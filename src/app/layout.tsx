import type { Metadata } from "next";
import "./globals.css";
import AppWalletProvider from "@/components/WalletProvider";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "MintLab – Create Your Solana Token. Simply.",
  description:
    "Create and configure a standard Solana token directly from your wallet. No coding. No custody. No MintLab creation fee.",
  openGraph: {
    title: "MintLab – Create Your Solana Token. Simply.",
    description:
      "Non-custodial Solana token creation. Connect wallet → configure → create.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-white antialiased">
        <AppWalletProvider>
          <Header />
          <main className="min-h-[calc(100vh-64px)]">{children}</main>
        </AppWalletProvider>
      </body>
    </html>
  );
}
