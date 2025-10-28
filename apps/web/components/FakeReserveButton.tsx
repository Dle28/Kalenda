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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [solscanUrl, setSolscanUrl] = useState<string>("");

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

      // Detect cluster from RPC endpoint
      const endpoint = connection.rpcEndpoint;
      let cluster = 'devnet';
      if (endpoint.includes('mainnet')) cluster = 'mainnet-beta';
      else if (endpoint.includes('testnet')) cluster = 'testnet';
      
      const url = `https://solscan.io/tx/${signature}?cluster=${cluster}`;
      setSolscanUrl(url);
      
      // Log to console for debugging
      console.log('✅ Transaction confirmed!');
      console.log('Signature:', signature);
      console.log('Cluster:', cluster);
      console.log('Solscan URL:', url);

      // Show success modal
      setShowSuccessModal(true);

    } catch (error) {
      console.error("Transaction failed:", error);
      alert("Transaction failed. Please try again.");
      setStatus("idle");
    }
  };

  return (
    <>
      {status === "processing" ? (
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
      ) : (
        <button
          className="btn btn-secondary"
          onClick={handleReserve}
          style={{ padding: "12px 16px" }}
        >
          {connected ? "Reserve now" : "Connect wallet to reserve"}
        </button>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            style={{
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1))",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: 24,
              padding: 32,
              maxWidth: 480,
              width: "100%",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
              animation: "slideUp 0.3s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Icon */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  boxShadow: "0 10px 30px rgba(16, 185, 129, 0.3)",
                }}
              >
                <span style={{ fontSize: 48 }}>✓</span>
              </div>
            </div>

            {/* Title */}
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                textAlign: "center",
                marginBottom: 12,
                background: "linear-gradient(135deg, #10b981, #3b82f6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Booking Confirmed!
            </h2>

            {/* Details */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: 16,
                padding: 20,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <span style={{ color: "var(--muted)" }}>Duration</span>
                <span style={{ fontWeight: 600 }}>{duration} minutes</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <span style={{ color: "var(--muted)" }}>Amount</span>
                <span style={{ fontWeight: 600 }}>{price} SOL</span>
              </div>
              <div
                style={{
                  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                  paddingTop: 12,
                  marginTop: 12,
                }}
              >
                <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6 }}>
                  Transaction ID
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                    color: "#10b981",
                  }}
                >
                  {txSignature}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 12 }}>
              <a
                href={solscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  textAlign: "center",
                  textDecoration: "none",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span>🔍</span>
                <span>View on Solscan</span>
              </a>
              <button
                className="btn btn-outline"
                onClick={() => setShowSuccessModal(false)}
                style={{
                  padding: "12px 20px",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
