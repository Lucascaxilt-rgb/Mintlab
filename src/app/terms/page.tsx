import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/" className="text-mint-400 text-sm mb-6 inline-block">
        ← Back to MintLab
      </Link>
      <h1 className="text-3xl font-bold text-white mb-6">Terms of Use</h1>
      <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
        <p>
          MintLab is a non-custodial interface that helps you create standard SPL
          tokens on Solana Mainnet. By using MintLab you agree to the following:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>
            You are solely responsible for every transaction you sign with your
            wallet.
          </li>
          <li>
            MintLab never takes custody of your private keys, seed phrases, or
            funds.
          </li>
          <li>
            Blockchain transactions are irreversible. Double-check all details
            before signing.
          </li>
          <li>
            MintLab does not guarantee any token will have value, liquidity, or
            trading activity.
          </li>
          <li>
            MintLab provides no investment, financial, or legal advice.
          </li>
          <li>
            You must comply with all applicable laws in your jurisdiction.
          </li>
          <li>
            The service is provided “as is” without warranties of any kind.
          </li>
        </ul>
        <p className="pt-4">
          Last updated: October 2026
        </p>
      </div>
    </div>
  );
}
