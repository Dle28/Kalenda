"use client";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export default function WalletTestPage() {
  const { connected, publicKey, signMessage } = useWallet();
  const [result, setResult] = useState<string>("");

  const onSign = async () => {
    try {
      if (!connected || !publicKey) return setResult("Please connect your wallet first.");
      if (!signMessage) return setResult("Wallet does not support message signing.");
      const message = new TextEncoder().encode("TimeMarket demo: hello!");
      const signature = await signMessage(message);
      setResult(`Signed: ${Buffer.from(signature).toString("hex").slice(0, 32)}…`);
    } catch (e: any) {
      setResult(`Error: ${e?.message || e}`);
    }
  };

  return (
    <section className="stack">
      <h1>Wallet connection test</h1>
      <div>
        Status: {connected ? `Connected: ${publicKey?.toBase58()}` : "Not connected"}
      </div>
      <div className="row" style={{ gap: 12 }}>
        <button className="btn" onClick={onSign}>Sign message</button>
      </div>
      {result && <pre className="card" style={{ whiteSpace: 'pre-wrap' }}>{result}</pre>}
    </section>
  );
}


