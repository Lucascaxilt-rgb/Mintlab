import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/" className="text-mint-400 text-sm mb-6 inline-block">
        ← Back to MintLab
      </Link>
      <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
      <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
        <p>
          MintLab is designed to be privacy-first and non-custodial.
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>
            We do not require accounts, email, or personal information.
          </li>
          <li>
            We do not store your wallet address, private keys, or seed phrases.
          </li>
          <li>
            Token creation happens directly between your wallet and the Solana
            blockchain.
          </li>
          <li>
            Metadata (name, symbol, image, description) is uploaded to IPFS and
            becomes publicly readable on-chain.
          </li>
          <li>
            If any analytics are used in the future they will be privacy-conscious
            and will not collect wallet or personally identifiable information
            beyond what is necessary.
          </li>
        </ul>
        <p className="pt-4">
          Last updated: October 2026
        </p>
      </div>
    </div>
  );
}
