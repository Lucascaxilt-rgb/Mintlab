"use client";

import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { RPC_ENDPOINT } from "@/lib/constants";

// Default styles for wallet modal
import "@solana/wallet-adapter-react-ui/styles.css";

export default function AppWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => RPC_ENDPOINT, []);

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    // @ts-ignore - temporary fix for wallet-adapter + React 18 type conflict
    <ConnectionProvider endpoint={endpoint}>
      {/* @ts-ignore */}
      <WalletProvider wallets={wallets} autoConnect>
        {/* @ts-ignore */}
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}