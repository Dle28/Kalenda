"use client";
import { useMemo, useState } from 'react';

type Currency = 'SOL' | 'SOL';

export default function PaymentBox(props: {
  baseAmount: number; // in selected currency units
  defaultCurrency?: Currency;
  feeBps?: number; // platform fee in basis points
  onCurrencyChange?: (c: Currency) => void;
}) {
  const { baseAmount, defaultCurrency = 'SOL', feeBps = 250, onCurrencyChange } = props;
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);

  const breakdown = useMemo(() => {
    const platformFee = Math.round(baseAmount * feeBps) / 10000; // BPS
    const networkFee = currency === 'SOL' ? 0.0005 : 0.01; // rough display-only
    const total = baseAmount + platformFee + networkFee;
    return { platformFee, networkFee, total };
  }, [baseAmount, feeBps, currency]);

  return (
    <div className="card" style={{ display: 'grid', gap: 10 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <b>Payment</b>
        <div className="row" style={{ gap: 8 }}>
          <button
            onClick={() => { setCurrency('SOL'); onCurrencyChange?.('SOL'); }}
            className={currency === 'SOL' ? 'btn btn-secondary' : 'btn btn-outline'}
            style={{ padding: '6px 10px' }}
          >SOL</button>
          <button
            onClick={() => { setCurrency('SOL'); onCurrencyChange?.('SOL'); }}
            className={currency === 'SOL' ? 'btn btn-secondary' : 'btn btn-outline'}
            style={{ padding: '6px 10px' }}
          >SOL</button>
        </div>
      </div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="muted">Amount</span>
        <b>{baseAmount} {currency}</b>
      </div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="muted">Platform fee</span>
        <span>{breakdown.platformFee.toFixed(4)} {currency}</span>
      </div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="muted">Network fee (est.)</span>
        <span>{breakdown.networkFee} {currency}</span>
      </div>
      <div className="row" style={{ justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: 8 }}>
        <span>Total</span>
        <b>{breakdown.total.toFixed(4)} {currency}</b>
      </div>
    </div>
  );
}


