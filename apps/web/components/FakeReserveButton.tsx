"use client";
import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

// REPLACE THIS WITH YOUR ACTUAL WALLET ADDRESS
const TREASURY_ADDRESS = "PUT_YOUR_WALLET_ADDRESS_HERE";

export default function FakeReserveButton({
  slotId,
  price,
  duration,
}: {
  slotId: string;
  price: number;
  duration: number;
}) {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");
  const [txSignature, setTxSignature] = useState<string>("");

  const handleReserve = async () => {
    if (!connected || !publicKey || !signTransaction) {
      alert("Please connect your wallet first!");
      return;
    }

    setStatus("processing");

    try {
      // Validate treasury address
      let treasuryPubkey: PublicKey;
      try {
        treasuryPubkey = new PublicKey(TREASURY_ADDRESS);
      } catch {
        alert("Invalid treasury address configured. Using connected wallet as demo.");
        treasuryPubkey = publicKey; // Fallback: send to yourself
      }

      // Create a real transaction - send small amount
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: treasuryPubkey,
          lamports: 1000000, // 0.001 SOL for demo
        })
      );

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign and send transaction
      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      
      // Confirm transaction
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      setTxSignature(signature);
      setStatus("success");

      // Show success message with real transaction link
      setTimeout(() => {
        const solscanUrl = `https://solscan.io/tx/${signature}?cluster=devnet`;
        alert(`✅ Booking confirmed!\n\nSlot reserved for ${duration} minutes\nAmount: ${price} SOL\n\nTransaction: ${signature}\n\nView on Solscan: ${solscanUrl}`);
        // Open Solscan in new tab
        window.open(solscanUrl, '_blank');
        setStatus("idle");
      }, 1000);

    } catch (error) {
      console.error("Transaction failed:", error);
      alert("Transaction failed. Please try again.");
      setStatus("idle");
    }
  };

  if (status === "success") {
    const solscanUrl = `https://solscan.io/tx/${txSignature}?cluster=devnet`;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div
          className="btn btn-secondary"
          style={{
            padding: "12px 16px",
            background: "#10b981",
            cursor: "default",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 20 }}>✅</span>
          <span>Booking confirmed!</span>
        </div>
        <a
          href={solscanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
          style={{
            padding: "8px 12px",
            fontSize: 13,
            textAlign: "center",
            textDecoration: "none",
          }}
        >
          🔍 View on Solscan
        </a>
      </div>
    );
  }

  if (status === "processing") {
    return (
      <button
        className="btn btn-secondary"
        disabled
        style={{
          padding: "12px 16px",
          opacity: 0.7,
          cursor: "wait",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span className="spinner" style={{ width: 16, height: 16 }} />
        <span>Processing...</span>
      </button>
    );
  }

  return (
    <button
      className="btn btn-secondary"
      onClick={handleReserve}
      style={{ padding: "12px 16px" }}
    >
      {connected ? "Reserve now" : "Connect wallet to reserve"}
    </button>
  );
}
