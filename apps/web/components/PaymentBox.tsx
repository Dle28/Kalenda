"use client";
import { useMemo } from "react";

const SOL_USD = 200; // demo conversion rate

export default function PaymentBox({
  baseAmount,
  feeBps = 250,
}: {
  baseAmount: number; // SOL
  feeBps?: number;
}) {
  const breakdown = useMemo(() => {
    const platformFee = Math.round(baseAmount * feeBps) / 10000;
    const networkFee = 0.0005;
    const total = baseAmount + platformFee + networkFee;
    return { platformFee, networkFee, total };
  }, [baseAmount, feeBps]);

  return (
    <div className="card" style={{ display: "grid", gap: 10 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <b>Payment</b>
        <span className="muted" style={{ fontSize: 12 }}>
          Settled in SOL · 1 SOL ≈ ${SOL_USD} USD
        </span>
      </div>

      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="muted">Amount</span>
        <b>{baseAmount.toFixed(3)} SOL</b>
      </div>

      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="muted">Platform fee</span>
        <span>{breakdown.platformFee.toFixed(3)} SOL</span>
      </div>

      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="muted">Network fee (est.)</span>
        <span>{breakdown.networkFee.toFixed(4)} SOL</span>
      </div>

      <div
        className="row"
        style={{
          justifyContent: "space-between",
          borderTop: "1px solid var(--line)",
          paddingTop: 8,
        }}
      >
        <span>Total</span>
        <b>{breakdown.total.toFixed(3)} SOL</b>
      </div>

      <span className="muted" style={{ fontSize: 12 }}>
        ≈ ${(breakdown.total * SOL_USD).toFixed(2)} USD
      </span>
    </div>
  );
}
