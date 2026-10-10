/**
 * Free IPFS upload helpers.
 * Uses public free endpoints. For production reliability,
 * replace with Pinata free tier or web3.storage API key.
 */

export async function uploadImageToIPFS(file: File): Promise<string> {
  // Using nft.storage-style free public upload pattern via Pinata public or similar.
  // For true zero-cost without keys we use a temporary approach + document upgrade path.
  // Recommended free path: create free Pinata account → put JWT in env.

  const formData = new FormData();
  formData.append("file", file);

  // Fallback: use a free public IPFS pinning service pattern
  // In real free use, user should set NEXT_PUBLIC_PINATA_JWT
  const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;

  if (pinataJWT) {
    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pinataJWT}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`IPFS image upload failed: ${err}`);
    }

    const data = await res.json();
    return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
  }

  // Pure free fallback: convert to base64 data URI (works for small images, not ideal for permanence)
  // For demo / zero-config free use
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // For Mainnet tokens we strongly recommend real IPFS.
      // This base64 path is only for zero-config testing.
      resolve(result);
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

export async function uploadMetadataToIPFS(metadata: {
  name: string;
  symbol: string;
  description: string;
  image: string;
}): Promise<string> {
  const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;

  const blob = new Blob([JSON.stringify(metadata)], {
    type: "application/json",
  });
  const file = new File([blob], "metadata.json", { type: "application/json" });

  if (pinataJWT) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pinataJWT}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`IPFS metadata upload failed: ${err}`);
    }

    const data = await res.json();
    return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
  }

  // Zero-config free fallback – returns a data URI (not permanent, for testing only)
  return `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
}
