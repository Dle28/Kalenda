"use client";
import { useState, useEffect } from "react";
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
  const [showToast, setShowToast] = useState(false);
  const [solscanUrl, setSolscanUrl] = useState<string>("");

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

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

      // Show success toast notification
      setShowToast(true);

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

      {/* Success Toast Notification */}
      {showToast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            animation: "slideInRight 0.4s ease-out",
          }}
        >
          <style>{`
            @keyframes slideInRight {
              from {
                transform: translateX(400px);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}</style>
          
          <div
            style={{
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.98), rgba(5, 150, 105, 0.98))",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              borderRadius: "14px",
              padding: "18px 20px",
              minWidth: "380px",
              maxWidth: "420px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.15)",
            }}
          >
            {/* Header with checkmark and close */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "14px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  background: "rgba(255, 255, 255, 0.25)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: "26px", lineHeight: 1 }}>✓</span>
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: "17px", 
                  fontWeight: 700, 
                  color: "white",
                  lineHeight: 1.3,
                  marginBottom: "4px",
                }}>
                  Transaction Successful!
                </h3>
                <p style={{ 
                  margin: 0, 
                  fontSize: "13px", 
                  color: "rgba(255, 255, 255, 0.85)",
                  lineHeight: 1.4,
                }}>
                  Booking confirmed • {price} SOL
                </p>
              </div>

              <button
                onClick={() => setShowToast(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  borderRadius: "7px",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "white",
                  fontSize: "20px",
                  flexShrink: 0,
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                }}
              >
                ×
              </button>
            </div>

            {/* Solscan Link */}
            <a
              href={solscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 16px",
                background: "rgba(255, 255, 255, 0.18)",
                borderRadius: "10px",
                textDecoration: "none",
                color: "white",
                fontSize: "14px",
                fontWeight: 600,
                transition: "all 0.2s ease",
                border: "1px solid rgba(255, 255, 255, 0.25)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.28)";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.18)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span>🔍</span>
              <span>View on Solscan</span>
              <span style={{ marginLeft: "auto", opacity: 0.7, fontSize: "16px" }}>→</span>
            </a>

            {/* Auto-close progress bar */}
            <div style={{ 
              marginTop: "14px", 
              height: "3px", 
              background: "rgba(255, 255, 255, 0.2)", 
              borderRadius: "2px",
              overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                background: "rgba(255, 255, 255, 0.6)",
                animation: "shrink 5s linear",
                width: "100%",
              }} />
            </div>
            <style>{`
              @keyframes shrink {
                from { width: 100%; }
                to { width: 0%; }
              }
            `}</style>
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
