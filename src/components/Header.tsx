"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";

export default function Header() {
  const { publicKey } = useWallet();

  return (
    <header className="w-full border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mint-400 to-solana-green flex items-center justify-center font-bold text-gray-900 text-sm">
            M
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">
            MintLab
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-mint-400 bg-mint-900/30 px-2.5 py-1 rounded-full border border-mint-800">
            <span className="w-1.5 h-1.5 rounded-full bg-mint-400 animate-pulse" />
            Solana Mainnet
          </span>
          <WalletMultiButton className="!bg-solana-purple hover:!bg-purple-600 !rounded-lg !h-10 !text-sm !font-medium" />
        </div>
      </div>
    </header>
  );
}
