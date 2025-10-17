"use client";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export default function WalletTestPage() {
  const { connected, publicKey, signMessage } = useWallet();
  const [result, setResult] = useState<string>("");

  const onSign = async () => {
    try {
      if (!connected || !publicKey) return setResult("Vui lòng kết nối ví trước.");
      if (!signMessage) return setResult("Ví không hỗ trợ ký thông điệp.");
      const message = new TextEncoder().encode("TimeMarket demo: xin chào!");
      const signature = await signMessage(message);
      setResult(`Đã ký: ${Buffer.from(signature).toString("hex").slice(0, 32)}…`);
    } catch (e: any) {
      setResult(`Lỗi: ${e?.message || e}`);
    }
  };

  return (
    <section className="stack">
      <h1>Kiểm tra kết nối ví</h1>
      <div>
        Trạng thái: {connected ? `Đã kết nối: ${publicKey?.toBase58()}` : "Chưa kết nối"}
      </div>
      <div className="row" style={{ gap: 12 }}>
        <button className="btn" onClick={onSign}>Ký thông điệp</button>
      </div>
      {result && <pre className="card" style={{ whiteSpace: 'pre-wrap' }}>{result}</pre>}
    </section>
  );
}

