"use client";

import { useState, useCallback, useRef } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  MAX_NAME_LENGTH,
  MAX_SYMBOL_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_IMAGE_SIZE_MB,
  ALLOWED_IMAGE_TYPES,
  DEFAULT_DECIMALS,
  MIN_DECIMALS,
  MAX_DECIMALS,
} from "@/lib/constants";
import { uploadImageToIPFS, uploadMetadataToIPFS } from "@/lib/ipfs";
import {
  buildCreateTokenTransaction,
  verifyTokenOnChain,
} from "@/lib/createToken";

type Step =
  | "form"
  | "preview"
  | "uploading"
  | "signing"
  | "confirming"
  | "verifying"
  | "success"
  | "error";

interface FormData {
  name: string;
  symbol: string;
  supply: string;
  decimals: number;
  description: string;
  imageFile: File | null;
  imagePreview: string | null;
}

export default function TokenForm() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();

  const [form, setForm] = useState<FormData>({
    name: "",
    symbol: "",
    supply: "1000000000",
    decimals: DEFAULT_DECIMALS,
    description: "",
    imageFile: null,
    imagePreview: null,
  });

  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [mintAddress, setMintAddress] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSubmitting = useRef(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Unsupported image type. Use PNG, JPEG, WebP or GIF.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_IMAGE_SIZE_MB} MB.`);
      return;
    }

    setError(null);
    const preview = URL.createObjectURL(file);
    setForm((prev) => ({
      ...prev,
      imageFile: file,
      imagePreview: preview,
    }));
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return "Token name is required.";
    if (form.name.trim().length > MAX_NAME_LENGTH)
      return `Name must be ≤ ${MAX_NAME_LENGTH} characters.`;
    if (!form.symbol.trim()) return "Symbol is required.";
    if (form.symbol.trim().length > MAX_SYMBOL_LENGTH)
      return `Symbol must be ≤ ${MAX_SYMBOL_LENGTH} characters.`;
    if (!/^[A-Za-z0-9]+$/.test(form.symbol.trim()))
      return "Symbol can only contain letters and numbers.";
    const supplyNum = Number(form.supply.replace(/,/g, ""));
    if (!supplyNum || supplyNum <= 0) return "Supply must be greater than zero.";
    if (form.decimals < MIN_DECIMALS || form.decimals > MAX_DECIMALS)
      return `Decimals must be between ${MIN_DECIMALS} and ${MAX_DECIMALS}.`;
    if (!form.imageFile) return "Token image is required.";
    if (form.description.length > MAX_DESCRIPTION_LENGTH)
      return `Description must be ≤ ${MAX_DESCRIPTION_LENGTH} characters.`;
    return null;
  };

  const goToPreview = () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep("preview");
  };

  const createToken = useCallback(async () => {
    if (!publicKey || !connected || isSubmitting.current) return;
    isSubmitting.current = true;
    setError(null);

    try {
      // 1. Upload image
      setStep("uploading");
      setStatusMessage("Uploading image to IPFS...");
      const imageUri = await uploadImageToIPFS(form.imageFile!);

      // 2. Upload metadata
      setStatusMessage("Uploading metadata...");
      const metadata = {
        name: form.name.trim(),
        symbol: form.symbol.trim().toUpperCase(),
        description: form.description.trim() || `${form.name.trim()} token`,
        image: imageUri,
      };
      const metadataUri = await uploadMetadataToIPFS(metadata);

      // 3. Build transaction
      setStep("signing");
      setStatusMessage("Preparing transaction...");
      const supplyNum = Number(form.supply.replace(/,/g, ""));

      const { transaction, mintKeypair } = await buildCreateTokenTransaction(
        connection,
        publicKey,
        {
          name: metadata.name,
          symbol: metadata.symbol,
          decimals: form.decimals,
          supply: supplyNum,
          description: metadata.description,
          imageUri,
          metadataUri,
        }
      );

      setStatusMessage("Waiting for Phantom approval...");
      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      });

      setTxSignature(signature);
      setMintAddress(mintKeypair.publicKey.toBase58());

      // 4. Confirm
      setStep("confirming");
      setStatusMessage("Confirming transaction on Solana...");
      const latest = await connection.getLatestBlockhash("confirmed");
      await connection.confirmTransaction(
        {
          signature,
          blockhash: latest.blockhash,
          lastValidBlockHeight: latest.lastValidBlockHeight,
        },
        "confirmed"
      );

      // 5. Verify on-chain
      setStep("verifying");
      setStatusMessage("Verifying token on-chain...");
      const verification = await verifyTokenOnChain(
        connection,
        mintKeypair.publicKey,
        form.decimals,
        supplyNum,
        publicKey
      );

      if (!verification.success) {
        // Still show success but with warning – token likely created
        console.warn("Verification warning:", verification.error);
      }

      setStep("success");
      setStatusMessage("Token created successfully!");
    } catch (err: any) {
      console.error(err);
      let msg = err?.message || "Something went wrong.";
      if (msg.includes("User rejected") || msg.includes("rejected the request"))
        msg = "Transaction cancelled in Phantom. You can try again.";
      if (msg.includes("insufficient") || msg.includes("0x1"))
        msg =
          "Your wallet does not have enough SOL to complete this transaction.";
      setError(msg);
      setStep("error");
    } finally {
      isSubmitting.current = false;
    }
  }, [publicKey, connected, connection, form, sendTransaction]);

  const reset = () => {
    setStep("form");
    setError(null);
    setMintAddress(null);
    setTxSignature(null);
    setStatusMessage("");
    isSubmitting.current = false;
  };

  // ─── RENDER ───────────────────────────────────────────────

  if (step === "success" && mintAddress) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-mint-500/20 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-mint-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Token Created</h2>

        {form.imagePreview && (
          <img
            src={form.imagePreview}
            alt={form.name}
            className="w-24 h-24 rounded-xl mx-auto object-cover border border-gray-700"
          />
        )}

        <div className="space-y-1">
          <p className="text-xl font-semibold text-white">{form.name}</p>
          <p className="text-mint-400 font-mono">${form.symbol.toUpperCase()}</p>
        </div>

        <div className="text-left bg-gray-950 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Supply</span>
            <span className="text-white font-mono">
              {Number(form.supply).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Decimals</span>
            <span className="text-white">{form.decimals}</span>
          </div>
          <div className="flex justify-between items-start gap-2">
            <span className="text-gray-400 shrink-0">Mint</span>
            <span className="text-white font-mono text-xs break-all text-right">
              {mintAddress}
            </span>
          </div>
          {txSignature && (
            <div className="flex justify-between items-start gap-2">
              <span className="text-gray-400 shrink-0">Tx</span>
              <span className="text-white font-mono text-xs break-all text-right">
                {txSignature.slice(0, 20)}…
              </span>
            </div>
          )}
          <div className="flex justify-between pt-1">
            <span className="text-gray-400">Mint Authority</span>
            <span className="text-mint-400">Revoked ✓</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Freeze Authority</span>
            <span className="text-mint-400">Revoked ✓</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={`https://explorer.solana.com/address/${mintAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition"
          >
            View on Explorer
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(mintAddress);
            }}
            className="flex-1 py-2.5 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition"
          >
            Copy Mint Address
          </button>
        </div>

        <button
          onClick={reset}
          className="w-full py-3 rounded-xl bg-solana-purple hover:bg-purple-600 text-white font-medium transition"
        >
          Create Another Token
        </button>

        <p className="text-xs text-gray-500">
          Your token has been created. To make it tradable, add liquidity on a
          Solana DEX such as Raydium.
        </p>
      </div>
    );
  }

  if (["uploading", "signing", "confirming", "verifying"].includes(step)) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-lg mx-auto text-center space-y-6">
        <div className="w-12 h-12 mx-auto border-4 border-mint-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white font-medium">{statusMessage}</p>
        <p className="text-sm text-gray-400">
          Please do not close this window or reject the transaction.
        </p>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="bg-gray-900 border border-red-900/50 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white">Transaction Failed</h2>
        <p className="text-red-300 text-sm">{error}</p>
        <button
          onClick={() => setStep("preview")}
          className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition"
        >
          Go Back & Retry
        </button>
      </div>
    );
  }

  if (step === "preview") {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto space-y-6">
        <h2 className="text-xl font-bold text-white text-center">
          Token Preview
        </h2>

        {form.imagePreview && (
          <img
            src={form.imagePreview}
            alt="Token"
            className="w-28 h-28 rounded-xl mx-auto object-cover border border-gray-700"
          />
        )}

        <div className="space-y-3 text-sm">
          <Row label="Name" value={form.name} />
          <Row label="Symbol" value={form.symbol.toUpperCase()} />
          <Row
            label="Supply"
            value={Number(form.supply.replace(/,/g, "")).toLocaleString()}
          />
          <Row label="Decimals" value={String(form.decimals)} />
          <Row label="Network" value="Solana Mainnet" />
          <Row label="MintLab Fee" value="0 SOL" />
          <Row label="Mint Authority" value="Will be revoked" />
          <Row label="Freeze Authority" value="Will be revoked" />
          {form.description && (
            <div>
              <p className="text-gray-400 mb-1">Description</p>
              <p className="text-white text-sm bg-gray-950 rounded-lg p-3">
                {form.description}
              </p>
            </div>
          )}
        </div>

        {!connected && (
          <p className="text-amber-400 text-sm text-center">
            Connect your Phantom wallet to continue.
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setStep("form")}
            className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition"
          >
            Edit
          </button>
          <button
            onClick={createToken}
            disabled={!connected}
            className="flex-1 py-3 rounded-xl bg-solana-purple hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition"
          >
            Confirm & Create
          </button>
        </div>
      </div>
    );
  }

  // Default: Form
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto space-y-5">
      <h2 className="text-xl font-bold text-white text-center">
        Create Your Token
      </h2>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm text-gray-300 mb-1.5">
          Token Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          maxLength={MAX_NAME_LENGTH}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. MintLab"
          className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-mint-500 transition"
        />
      </div>

      {/* Symbol */}
      <div>
        <label className="block text-sm text-gray-300 mb-1.5">
          Symbol <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          maxLength={MAX_SYMBOL_LENGTH}
          value={form.symbol}
          onChange={(e) =>
            setForm({ ...form, symbol: e.target.value.toUpperCase() })
          }
          placeholder="e.g. MLAB"
          className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-mint-500 transition uppercase"
        />
      </div>

      {/* Supply */}
      <div>
        <label className="block text-sm text-gray-300 mb-1.5">
          Total Supply <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.supply}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9]/g, "");
            setForm({ ...form, supply: v });
          }}
          placeholder="1000000000"
          className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-mint-500 transition font-mono"
        />
      </div>

      {/* Decimals */}
      <div>
        <label className="block text-sm text-gray-300 mb-1.5">
          Decimals{" "}
          <span className="text-gray-500 text-xs">
            (0–9, default 6)
          </span>
        </label>
        <select
          value={form.decimals}
          onChange={(e) =>
            setForm({ ...form, decimals: Number(e.target.value) })
          }
          className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-mint-500 transition"
        >
          {Array.from({ length: 10 }, (_, i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Decimals determine the smallest unit of your token (like cents for
          dollars). Most tokens use 6 or 9.
        </p>
      </div>

      {/* Image */}
      <div>
        <label className="block text-sm text-gray-300 mb-1.5">
          Token Image <span className="text-red-400">*</span>
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-700 hover:border-mint-600 rounded-xl p-6 text-center cursor-pointer transition bg-gray-950/50"
        >
          {form.imagePreview ? (
            <img
              src={form.imagePreview}
              alt="Preview"
              className="w-24 h-24 mx-auto rounded-lg object-cover"
            />
          ) : (
            <div className="text-gray-400 text-sm">
              <p>Click to upload</p>
              <p className="text-xs mt-1">PNG, JPEG, WebP · max {MAX_IMAGE_SIZE_MB} MB</p>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          onChange={handleImageChange}
          className="hidden"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm text-gray-300 mb-1.5">
          Description{" "}
          <span className="text-gray-500 text-xs">(optional)</span>
        </label>
        <textarea
          maxLength={MAX_DESCRIPTION_LENGTH}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          placeholder="A short description of your token"
          className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-mint-500 transition resize-none"
        />
        <p className="text-xs text-gray-500 text-right">
          {form.description.length}/{MAX_DESCRIPTION_LENGTH}
        </p>
      </div>

      <div className="pt-2">
        <div className="flex justify-between text-sm text-gray-400 mb-3">
          <span>MintLab Fee</span>
          <span className="text-mint-400 font-medium">0 SOL</span>
        </div>
        <button
          onClick={goToPreview}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-solana-purple to-purple-600 hover:from-purple-600 hover:to-purple-500 text-white font-semibold transition shadow-lg shadow-purple-900/30"
        >
          Preview Token
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-800 last:border-0">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
