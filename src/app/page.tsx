import TokenForm from "@/components/TokenForm";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:py-16">
      {/* Hero */}
      <section className="text-center mb-12 sm:mb-16 space-y-4">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
          Create Your Solana Token.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-mint-400 to-solana-green">
            Simply.
          </span>
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto text-base sm:text-lg">
          Create and configure a standard Solana token directly from your
          wallet. No coding. No custody. No MintLab creation fee.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-xs sm:text-sm text-gray-500 pt-2">
          <span className="inline-flex items-center gap-1.5 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-mint-400" />
            Non-custodial
          </span>
          <span className="inline-flex items-center gap-1.5 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full">
            0 SOL Platform Fee
          </span>
          <span className="inline-flex items-center gap-1.5 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full">
            Solana Mainnet
          </span>
          <span className="inline-flex items-center gap-1.5 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full">
            Authorities Revoked
          </span>
        </div>
      </section>

      {/* Form */}
      <TokenForm />

      {/* Trust footer */}
      <section className="mt-16 text-center space-y-4 text-sm text-gray-500 max-w-2xl mx-auto">
        <p>
          MintLab is non-custodial. You sign every transaction with your own
          wallet. MintLab never holds your keys, funds, or tokens.
        </p>
        <p>
          Blockchain transactions are irreversible. MintLab does not guarantee
          token value, liquidity, or trading activity.
        </p>
        <div className="flex justify-center gap-6 pt-2">
          <Link href="/docs" className="hover:text-mint-400 transition">
            Documentation
          </Link>
          <Link href="/terms" className="hover:text-mint-400 transition">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-mint-400 transition">
            Privacy
          </Link>
        </div>
      </section>
    </div>
  );
}
