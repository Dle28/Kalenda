"use client";
import dynamic from "next/dynamic";
import { Connection } from "@solana/web3.js";

const WalletMultiButton = dynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function Home() {
  const testPing = async () => {
    const endpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com";
    const conn = new Connection(endpoint);
    const slot = await conn.getSlot();
    alert(`Current slot: ${slot}`);
  };

  return (
    <main className="p-8 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Solana dApp Starter</h1>
      <WalletMultiButton />
      <button onClick={testPing} className="px-4 py-2 rounded bg-black text-white">Ping RPC</button>
    </main>
  );
}
