# MintLab – Solana Token Creation Platform (V1)

Non-custodial Solana token creator.  
**0 SOL platform fee · Phantom · Mainnet · Authorities revoked**

## Quick Start (Free / Netlify)

```bash
# 1. Install dependencies
npm install

# 2. (Optional but recommended) Add free Pinata JWT for real IPFS
# Create free account at https://pinata.cloud → API Keys → copy JWT
# Then create .env.local:
echo "NEXT_PUBLIC_PINATA_JWT=your_jwt_here" > .env.local

# Optional better RPC (free tier from Helius / QuickNode / Alchemy)
# NEXT_PUBLIC_RPC_URL=https://your-free-rpc-url

# 3. Run locally
npm run dev
```

Open http://localhost:3000

## Deploy to Netlify (Free)

1. Push this folder to a GitHub repository.
2. Go to https://app.netlify.com → Add new site → Import from Git.
3. Build command: `npm run build`
4. Publish directory: leave default (Netlify Next.js plugin handles it).
5. Add environment variables in Netlify dashboard if you use Pinata / custom RPC.
6. Deploy.

Your site will be live at `https://random-name.netlify.app`.  
You can later add a custom domain.

## Features (matches PRD V1)

- Connect Phantom wallet
- Token name, symbol, supply, decimals (0-9), image, description
- Image + metadata upload (IPFS via Pinata free or base64 fallback)
- Full transaction preview
- Create mint → mint supply → Metaplex metadata → revoke mint authority → revoke freeze authority
- On-chain verification
- Success screen with Explorer links
- Mobile responsive
- 0 SOL platform fee
- No backend / no database / no custody

## Important Notes

- **Mainnet costs real SOL** for network fees (very small).
- Without a Pinata (or web3.storage) key the image/metadata falls back to data URIs (fine for testing, not ideal for permanent production tokens).
- Free public RPCs can be rate-limited. Upgrade to a free-tier key when you have traffic.
- Always test first with a small amount of SOL.

## Project Structure

```
src/
  app/           → pages (home, docs, terms, privacy)
  components/    → Header, TokenForm, WalletProvider
  lib/           → constants, ipfs, createToken (core logic)
```

## License

Private – for the client project.
