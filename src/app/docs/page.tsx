import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose prose-invert">
      <Link href="/" className="text-mint-400 text-sm mb-6 inline-block">
        ← Back to MintLab
      </Link>
      <h1 className="text-3xl font-bold text-white mb-6">Documentation</h1>

      <section className="space-y-4 text-gray-300">
        <h2 className="text-xl font-semibold text-white">How it works</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Connect your Phantom wallet.</li>
          <li>Enter token name, symbol, supply, decimals and upload an image.</li>
          <li>Preview the token and review the transaction.</li>
          <li>Approve the transaction in Phantom.</li>
          <li>MintLab creates the SPL token, mints the supply to you, attaches metadata, and revokes mint + freeze authorities.</li>
          <li>On-chain verification confirms the result.</li>
        </ol>

        <h2 className="text-xl font-semibold text-white mt-8">What you need</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Phantom wallet (browser or mobile)</li>
          <li>A small amount of SOL for network fees</li>
          <li>Token name, symbol, image and optional description</li>
        </ul>

        <h2 className="text-xl font-semibold text-white mt-8">Authorities</h2>
        <p>
          After creation, both Mint Authority and Freeze Authority are set to
          None. This is irreversible and is verified on-chain before the success
          screen is shown.
        </p>

        <h2 className="text-xl font-semibold text-white mt-8">Fees</h2>
        <p>
          MintLab charges <strong className="text-mint-400">0 SOL</strong>{" "}
          platform fee. You only pay the normal Solana network transaction fee
          through Phantom.
        </p>

        <h2 className="text-xl font-semibold text-white mt-8">Adding liquidity</h2>
        <p>
          MintLab does not create liquidity pools. After your token is created
          you can add liquidity on any Solana DEX such as Raydium.
        </p>
      </section>
    </div>
  );
}
