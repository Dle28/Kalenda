"use client";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import Link from "next/link";

interface Transaction {
  signature: string;
  timestamp: number;
  amount: number;
  status: "success" | "failed";
  type: "booking" | "payment";
}

export default function TransactionHistory() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (connected && publicKey) {
      loadTransactions();
    }
  }, [connected, publicKey]);

  const loadTransactions = async () => {
    if (!publicKey) return;

    setLoading(true);
    setError("");

    try {
      // Fetch transaction signatures from Solana
      const signatures = await connection.getSignaturesForAddress(publicKey, {
        limit: 20,
      });

      // Map to our transaction format
      const txs: Transaction[] = signatures.map((sig) => ({
        signature: sig.signature,
        timestamp: sig.blockTime ? sig.blockTime * 1000 : Date.now(),
        amount: 0.001, // We don't have exact amounts from signature info
        status: sig.err ? "failed" : "success",
        type: "booking",
      }));

      setTransactions(txs);
    } catch (err) {
      console.error("Error loading transactions:", err);
      setError("Failed to load transaction history");
    } finally {
      setLoading(false);
    }
  };

  const getClusterUrl = () => {
    const endpoint = connection.rpcEndpoint;
    if (endpoint.includes("mainnet")) return "mainnet-beta";
    if (endpoint.includes("testnet")) return "testnet";
    return "devnet";
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateSignature = (sig: string) => {
    return `${sig.slice(0, 8)}...${sig.slice(-8)}`;
  };

  if (!connected) {
    return (
      <div style={{ maxWidth: "1200px", margin: "60px auto", padding: "0 20px" }}>
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "20px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <div
            style={{
              fontSize: "64px",
              marginBottom: "20px",
              opacity: 0.5,
            }}
          >
            🔒
          </div>
          <h2 style={{ fontSize: "28px", marginBottom: "12px" }}>
            Connect Your Wallet
          </h2>
          <p style={{ color: "var(--muted)", fontSize: "16px" }}>
            Please connect your wallet to view transaction history
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "60px auto", padding: "0 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <h1
          style={{
            fontSize: "42px",
            fontWeight: 800,
            marginBottom: "12px",
            letterSpacing: "-0.02em",
          }}
        >
          Transaction History
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "18px" }}>
          View all your bookings and payments on Solana blockchain
        </p>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <div style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "8px" }}>
            Total Transactions
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700, color: "#10b981" }}>
            {transactions.length}
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <div style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "8px" }}>
            Successful
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700, color: "#3b82f6" }}>
            {transactions.filter((tx) => tx.status === "success").length}
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.05))",
            border: "1px solid rgba(168, 85, 247, 0.2)",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <div style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "8px" }}>
            Total Spent
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700, color: "#a855f7" }}>
            {(transactions.length * 0.001).toFixed(3)} SOL
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div className="spinner" style={{ width: 40, height: 40, margin: "0 auto 20px" }} />
          <p style={{ color: "var(--muted)" }}>Loading transactions...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "20px",
            color: "#ef4444",
          }}
        >
          {error}
        </div>
      )}

      {/* Transactions List */}
      {!loading && transactions.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "20px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.5 }}>
            📜
          </div>
          <h3 style={{ fontSize: "24px", marginBottom: "12px" }}>
            No Transactions Yet
          </h3>
          <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
            Your booking history will appear here
          </p>
          <Link
            href="/creators"
            className="btn btn-primary"
            style={{ display: "inline-block" }}
          >
            Explore Creators
          </Link>
        </div>
      )}

      {!loading && transactions.length > 0 && (
        <div
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            borderRadius: "20px",
            overflow: "hidden",
          }}
        >
          {/* Table Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr 120px",
              gap: "20px",
              padding: "20px 24px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            <div>Transaction ID</div>
            <div>Date</div>
            <div>Amount</div>
            <div>Status</div>
            <div>Action</div>
          </div>

          {/* Table Rows */}
          {transactions.map((tx, index) => (
            <div
              key={tx.signature}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 120px",
                gap: "20px",
                padding: "20px 24px",
                borderBottom:
                  index < transactions.length - 1
                    ? "1px solid rgba(255, 255, 255, 0.05)"
                    : "none",
                alignItems: "center",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {/* Transaction ID */}
              <div>
                <code
                  style={{
                    fontFamily: "monospace",
                    fontSize: "14px",
                    color: "#10b981",
                  }}
                >
                  {truncateSignature(tx.signature)}
                </code>
              </div>

              {/* Date */}
              <div style={{ fontSize: "14px" }}>{formatDate(tx.timestamp)}</div>

              {/* Amount */}
              <div style={{ fontSize: "15px", fontWeight: 600 }}>
                {tx.amount} SOL
              </div>

              {/* Status */}
              <div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background:
                      tx.status === "success"
                        ? "rgba(16, 185, 129, 0.15)"
                        : "rgba(239, 68, 68, 0.15)",
                    color: tx.status === "success" ? "#10b981" : "#ef4444",
                  }}
                >
                  {tx.status === "success" ? "✓ Success" : "✗ Failed"}
                </span>
              </div>

              {/* Action */}
              <div>
                <a
                  href={`https://solscan.io/tx/${tx.signature}?cluster=${getClusterUrl()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "13px",
                    color: "#3b82f6",
                    textDecoration: "none",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#60a5fa";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#3b82f6";
                  }}
                >
                  View
                  <span style={{ fontSize: "10px" }}>↗</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      {!loading && transactions.length > 0 && (
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            onClick={loadTransactions}
            className="btn btn-outline"
            style={{
              padding: "10px 24px",
              fontSize: "14px",
            }}
          >
            🔄 Refresh
          </button>
        </div>
      )}
    </div>
  );
}
