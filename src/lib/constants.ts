import { PublicKey, clusterApiUrl } from "@solana/web3.js";

// Free public RPC – replace with a free-tier key from Helius/QuickNode for better reliability
export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl("mainnet-beta");

export const NETWORK = "mainnet-beta" as const;

// Metaplex Token Metadata Program ID
export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

// Max lengths (PRD requirements)
export const MAX_NAME_LENGTH = 32;
export const MAX_SYMBOL_LENGTH = 10;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_IMAGE_SIZE_MB = 5;
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];

export const DEFAULT_DECIMALS = 6;
export const MIN_DECIMALS = 0;
export const MAX_DECIMALS = 9;
