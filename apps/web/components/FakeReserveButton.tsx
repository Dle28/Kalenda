"use client";
import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

// REPLACE THIS WITH A DIFFERENT WALLET ADDRESS (creator/treasury wallet)
// ⚠️ IMPORTANT: This should NOT be your main wallet address!
// Use a separate wallet to receive payments, or this is just a demo showing self-transfer
const TREASURY_ADDRESS = "2eaTg4UY8nRmj16DWnASQwM88hAB1f4YXHUvMM5pTHWT";
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

      // Create a real transaction - send the ACTUAL slot price
      const lamportsToSend = Math.round(price * LAMPORTS_PER_SOL); // Convert SOL to lamports
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: treasuryPubkey,
          lamports: lamportsToSend, // Send actual slot price (e.g., 0.5 SOL = 500,000,000 lamports)
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
          onClick={() => setShowSuccessModal(false)}
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            margin: "0",
            padding: "0",
            width: "100vw",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              margin: "0",
              background: "linear-gradient(145deg, rgba(17, 24, 39, 0.95), rgba(31, 41, 55, 0.95))",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: "20px",
              padding: "40px",
              width: "90%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(16, 185, 129, 0.1)",
            }}
          >
            {/* Success Icon */}
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div
                style={{
                  width: "96px",
                  height: "96px",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 20px 40px rgba(16, 185, 129, 0.4), 0 0 0 8px rgba(16, 185, 129, 0.1)",
                }}
              >
                <span style={{ fontSize: "56px", color: "white", lineHeight: 1 }}>✓</span>
              </div>
            </div>

            {/* Title */}
            <h2
              style={{
                fontSize: "32px",
                fontWeight: 700,
                textAlign: "center",
                marginBottom: "8px",
                color: "white",
                letterSpacing: "-0.025em",
              }}
            >
              Booking Confirmed!
            </h2>

            <p style={{ 
              textAlign: "center", 
              color: "rgba(156, 163, 175, 1)", 
              marginBottom: "32px",
              fontSize: "15px",
            }}>
              Your transaction has been recorded on Solana blockchain
            </p>

            {/* Details */}
            <div
              style={{
                background: "rgba(16, 185, 129, 0.05)",
                border: "1px solid rgba(16, 185, 129, 0.15)",
                borderRadius: "16px",
                padding: "24px",
                marginBottom: "28px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <span style={{ color: "rgba(156, 163, 175, 1)", fontSize: "15px" }}>Duration</span>
                <span style={{ fontWeight: 600, color: "white", fontSize: "16px" }}>{duration} minutes</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: "16px",
                  borderBottom: "1px solid rgba(16, 185, 129, 0.1)",
                }}
              >
                <span style={{ color: "rgba(156, 163, 175, 1)", fontSize: "15px" }}>Amount</span>
                <span style={{ fontWeight: 700, color: "#10b981", fontSize: "18px" }}>{price} SOL</span>
              </div>
              <div
                style={{
                  paddingTop: "16px",
                }}
              >
                <div style={{ color: "rgba(156, 163, 175, 1)", fontSize: "13px", marginBottom: "8px", fontWeight: 500 }}>
                  Transaction ID
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                    color: "#10b981",
                    background: "rgba(16, 185, 129, 0.08)",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    lineHeight: "1.5",
                  }}
                >
                  {txSignature}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px", flexDirection: "column" }}>
              <a
                href={solscanUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: "100%",
                  padding: "16px",
                  textAlign: "center",
                  textDecoration: "none",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  border: "none",
                  borderRadius: "12px",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(16, 185, 129, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
                }}
              >
                <span>🔍</span>
                <span>View on Solscan</span>
              </a>
              <button
                onClick={() => setShowSuccessModal(false)}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "transparent",
                  border: "1px solid rgba(75, 85, 99, 0.5)",
                  borderRadius: "12px",
                  color: "rgba(156, 163, 175, 1)",
                  fontSize: "15px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(156, 163, 175, 0.8)";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(75, 85, 99, 0.5)";
                  e.currentTarget.style.color = "rgba(156, 163, 175, 1)";
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
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}
