"use client";
import { useMemo, useState } from 'react';

export type BidEvent = { ts: number; bidder: string; amount: number };

export default function BidRoom(props: {
  startPrice: number;
  bidStep: number;
  currentPrice?: number;
  currency?: 'SOL' | 'SOL';
  onPlaceBid?: (amount: number) => Promise<void> | void;
}) {
  const { startPrice, bidStep, currentPrice, currency = 'SOL', onPlaceBid } = props;
  const [maxAutoBid, setMaxAutoBid] = useState<string>('');
  const [log, setLog] = useState<BidEvent[]>([]);

  const minNext = useMemo(() => {
    const base = typeof currentPrice === 'number' && currentPrice > 0 ? currentPrice : startPrice;
    return Math.round((base + bidStep) * 1e6) / 1e6;
  }, [startPrice, bidStep, currentPrice]);

  async function place(amount: number) {
    const a = Math.max(amount, minNext);
    onPlaceBid && (await onPlaceBid(a));
    setLog((prev) => [{ ts: Date.now(), bidder: 'you', amount: a }, ...prev].slice(0, 50));
  }

  return (
    <div className="card" style={{ display: 'grid', gap: 12 }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <b>Bid Room</b>
        <span className="badge">Step: {bidStep} {currency}</span>
      </div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="muted">Current price</span>
        <b>{(currentPrice ?? startPrice).toFixed(4)} {currency}</b>
      </div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="muted">Minimum next bid</span>
        <b>{minNext.toFixed(4)} {currency}</b>
      </div>
      <div className="row" style={{ gap: 8, alignItems: 'center' }}>
        <button className="btn btn-outline" onClick={() => place(minNext)} style={{ padding: '6px 10px' }}>
          Bid {minNext} {currency}
        </button>
        <span className="muted">or set auto-bid max</span>
        <input
          style={{ flex: 1, minWidth: 140 }}
          placeholder={`Max ${currency}…`}
          value={maxAutoBid}
          onChange={(e) => setMaxAutoBid(e.target.value)}
        />
        <button
          className="btn btn-secondary"
          onClick={() => {
            const v = Number(maxAutoBid);
            if (!Number.isFinite(v) || v <= 0) return;
            place(v);
          }}
          style={{ padding: '6px 10px' }}
        >
          Auto-bid
        </button>
      </div>

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 8 }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
          <b>Auction log</b>
          <span className="muted" style={{ fontSize: 12 }}>{log.length} events</span>
        </div>
        <div style={{ maxHeight: 160, overflow: 'auto', display: 'grid', gap: 6 }}>
          {log.length === 0 ? (
            <span className="muted">No bids yet.</span>
          ) : (
            log.map((e, i) => (
              <div key={i} className="row" style={{ justifyContent: 'space-between' }}>
                <span className="muted">{new Date(e.ts).toLocaleTimeString()}</span>
                <span>
                  <b>{e.amount.toFixed(4)} {currency}</b>
                  <span className="muted"> by {e.bidder}</span>
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


