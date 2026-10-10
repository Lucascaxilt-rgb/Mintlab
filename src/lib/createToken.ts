import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createSetAuthorityInstruction,
  AuthorityType,
} from "@solana/spl-token";
import { TOKEN_METADATA_PROGRAM_ID } from "./constants";

export interface TokenConfig {
  name: string;
  symbol: string;
  decimals: number;
  supply: number; // human readable (e.g. 1000000000)
  description: string;
  imageUri: string;
  metadataUri: string;
}

/**
 * Builds the full token creation + metadata + authority revocation transaction.
 * User signs it with Phantom.
 */
export async function buildCreateTokenTransaction(
  connection: Connection,
  payer: PublicKey,
  config: TokenConfig
): Promise<{ transaction: Transaction; mintKeypair: Keypair }> {
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;

  // Convert human supply to raw amount
  const rawSupply = BigInt(Math.floor(config.supply * 10 ** config.decimals));

  const lamports = await getMinimumBalanceForRentExemptMint(connection);

  const ata = await getAssociatedTokenAddress(mint, payer);

  // 1. Create mint account
  const createMintAccountIx = SystemProgram.createAccount({
    fromPubkey: payer,
    newAccountPubkey: mint,
    space: MINT_SIZE,
    lamports,
    programId: TOKEN_PROGRAM_ID,
  });

  // 2. Initialize mint
  const initMintIx = createInitializeMintInstruction(
    mint,
    config.decimals,
    payer, // mint authority (temporary)
    payer  // freeze authority (temporary)
  );

  // 3. Create ATA for the user
  const createAtaIx = createAssociatedTokenAccountInstruction(
    payer,
    ata,
    payer,
    mint
  );

  // 4. Mint the full supply to the user
  const mintToIx = createMintToInstruction(
    mint,
    ata,
    payer,
    rawSupply
  );

  // 5. Create metadata account (Metaplex)
  const metadataPDA = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  )[0];

  const createMetadataIx = createCreateMetadataAccountV3Instruction(
    metadataPDA,
    mint,
    payer,
    payer,
    payer,
    config.name,
    config.symbol,
    config.metadataUri
  );

  // 6. Revoke mint authority
  const revokeMintIx = createSetAuthorityInstruction(
    mint,
    payer,
    AuthorityType.MintTokens,
    null
  );

  // 7. Revoke freeze authority
  const revokeFreezeIx = createSetAuthorityInstruction(
    mint,
    payer,
    AuthorityType.FreezeAccount,
    null
  );

  const transaction = new Transaction().add(
    createMintAccountIx,
    initMintIx,
    createAtaIx,
    mintToIx,
    createMetadataIx,
    revokeMintIx,
    revokeFreezeIx
  );

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  transaction.recentBlockhash = blockhash;
  transaction.feePayer = payer;
  // mintKeypair must also sign (new account)
  transaction.partialSign(mintKeypair);

  return { transaction, mintKeypair };
}

/**
 * Minimal CreateMetadataAccountV3 instruction (Metaplex)
 * Avoids pulling the full @metaplex-foundation/mpl-token-metadata package
 * for lighter free build.
 */
function createCreateMetadataAccountV3Instruction(
  metadata: PublicKey,
  mint: PublicKey,
  mintAuthority: PublicKey,
  payer: PublicKey,
  updateAuthority: PublicKey,
  name: string,
  symbol: string,
  uri: string
): TransactionInstruction {
  // Data layout for CreateMetadataAccountV3
  // Instruction discriminator for CreateMetadataAccountV3 = 33
  const nameBytes = Buffer.from(name);
  const symbolBytes = Buffer.from(symbol);
  const uriBytes = Buffer.from(uri);

  // Manual serialization of the instruction data
  // Structure: [discriminator (1)] + [name len u32 + name] + [symbol len u32 + symbol] + [uri len u32 + uri] + [sellerFeeBasisPoints u16] + [creators option] + [collection option] + [uses option] + [isMutable bool] + [collectionDetails option]
  const data = Buffer.alloc(
    1 + // discriminator
      4 + nameBytes.length +
      4 + symbolBytes.length +
      4 + uriBytes.length +
      2 + // seller fee
      1 + // creators None
      1 + // collection None
      1 + // uses None
      1 + // isMutable
      1   // collectionDetails None
  );

  let offset = 0;
  data.writeUInt8(33, offset); // CreateMetadataAccountV3
  offset += 1;

  data.writeUInt32LE(nameBytes.length, offset);
  offset += 4;
  nameBytes.copy(data, offset);
  offset += nameBytes.length;

  data.writeUInt32LE(symbolBytes.length, offset);
  offset += 4;
  symbolBytes.copy(data, offset);
  offset += symbolBytes.length;

  data.writeUInt32LE(uriBytes.length, offset);
  offset += 4;
  uriBytes.copy(data, offset);
  offset += uriBytes.length;

  data.writeUInt16LE(0, offset); // sellerFeeBasisPoints = 0
  offset += 2;

  data.writeUInt8(0, offset); // creators = None
  offset += 1;
  data.writeUInt8(0, offset); // collection = None
  offset += 1;
  data.writeUInt8(0, offset); // uses = None
  offset += 1;
  data.writeUInt8(1, offset); // isMutable = true (we still revoke mint/freeze)
  offset += 1;
  data.writeUInt8(0, offset); // collectionDetails = None

  return new TransactionInstruction({
    keys: [
      { pubkey: metadata, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: mintAuthority, isSigner: true, isWritable: false },
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: updateAuthority, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    programId: TOKEN_METADATA_PROGRAM_ID,
    data,
  });
}

/**
 * On-chain verification after creation (PRD requirement)
 */
export async function verifyTokenOnChain(
  connection: Connection,
  mintAddress: PublicKey,
  expectedDecimals: number,
  expectedSupply: number,
  owner: PublicKey
): Promise<{
  success: boolean;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  supply: string;
  decimals: number;
  error?: string;
}> {
  try {
    const mintInfo = await connection.getParsedAccountInfo(mintAddress);
    if (!mintInfo.value) {
      return {
        success: false,
        mintAuthority: null,
        freezeAuthority: null,
        supply: "0",
        decimals: 0,
        error: "Mint account not found",
      };
    }

    const data = (mintInfo.value.data as any).parsed?.info;
    if (!data) {
      return {
        success: false,
        mintAuthority: null,
        freezeAuthority: null,
        supply: "0",
        decimals: 0,
        error: "Could not parse mint data",
      };
    }

    const mintAuthority = data.mintAuthority;
    const freezeAuthority = data.freezeAuthority;
    const supply = data.supply;
    const decimals = data.decimals;

    const rawExpected = BigInt(
      Math.floor(expectedSupply * 10 ** expectedDecimals)
    ).toString();

    const authoritiesRevoked =
      mintAuthority === null && freezeAuthority === null;
    const supplyOk = supply === rawExpected;
    const decimalsOk = decimals === expectedDecimals;

    return {
      success: authoritiesRevoked && supplyOk && decimalsOk,
      mintAuthority,
      freezeAuthority,
      supply,
      decimals,
      error: !authoritiesRevoked
        ? "Authorities not fully revoked"
        : !supplyOk
        ? "Supply mismatch"
        : !decimalsOk
        ? "Decimals mismatch"
        : undefined,
    };
  } catch (e: any) {
    return {
      success: false,
      mintAuthority: null,
      freezeAuthority: null,
      supply: "0",
      decimals: 0,
      error: e.message || "Verification failed",
    };
  }
}
