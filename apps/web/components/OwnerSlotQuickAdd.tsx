"use client";
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';

type PricingMode = 'Stable' | 'EnglishAuction';

export default function OwnerSlotQuickAdd({ creatorPubkey }: { creatorPubkey: string }) {
  const { publicKey } = useWallet();
  const router = useRouter();
  const mine = publicKey?.toBase58() === creatorPubkey;
  const [quick, setQuick] = useState({ date: '', start: '', durationMin: '30', mode: 'Stable' as PricingMode, price: '20', startPrice: '10', bidStep: '1' });
  const [saving, setSaving] = useState(false);
  if (!mine) return null;

  async function addSlot() {
    if (!quick.date || !quick.start) return;
    const start = new Date(`${quick.date}T${quick.start}:00`);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + Math.max(5, Number(quick.durationMin) || 30));
    const s: any = {
      id: `${creatorPubkey}-${start.toISOString()}`,
      creator: creatorPubkey,
      start: start.toISOString(),
      end: end.toISOString(),
      mode: quick.mode,
    };
    if (quick.mode === 'Stable') s.price = Number(quick.price) || 0;
    else s.startPrice = Number(quick.startPrice) || 0;
    setSaving(true);
    try {
      await fetch('/api/slots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
      router.refresh();
      setQuick((q) => ({ ...q, date: '', start: '' }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3 className="section-title">Add a slot</h3>
      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
        <label className="stack" style={{ minWidth: 160 }}>
          <span className="muted">Date</span>
          <input type="date" value={quick.date} onChange={(e) => setQuick({ ...quick, date: e.target.value })} />
        </label>
        <label className="stack" style={{ minWidth: 140 }}>
          <span className="muted">Start</span>
          <input type="time" value={quick.start} onChange={(e) => setQuick({ ...quick, start: e.target.value })} />
        </label>
        <label className="stack" style={{ minWidth: 140 }}>
          <span className="muted">Duration (min)</span>
          <input type="number" inputMode="numeric" min={5} step={5} value={quick.durationMin} onChange={(e) => setQuick({ ...quick, durationMin: e.target.value })} />
        </label>
        <label className="stack" style={{ minWidth: 160 }}>
          <span className="muted">Mode</span>
          <select value={quick.mode} onChange={(e) => setQuick({ ...quick, mode: e.target.value as PricingMode })}>
            <option value="Stable">Fixed price</option>
            <option value="EnglishAuction">English auction</option>
          </select>
        </label>
        {quick.mode === 'Stable' ? (
          <label className="stack" style={{ minWidth: 160 }}>
            <span className="muted">Price (USDC)</span>
            <input type="number" inputMode="decimal" min={0} step={0.01} value={quick.price} onChange={(e) => setQuick({ ...quick, price: e.target.value })} />
          </label>
        ) : (
          <label className="stack" style={{ minWidth: 160 }}>
            <span className="muted">Start price (USDC)</span>
            <input type="number" inputMode="decimal" min={0} step={0.01} value={quick.startPrice} onChange={(e) => setQuick({ ...quick, startPrice: e.target.value })} />
          </label>
        )}
        <div className="row" style={{ alignItems: 'end' }}>
          <button className="btn btn-secondary" style={{ padding: '8px 12px' }} disabled={saving} onClick={addSlot}>
            {saving ? 'Saving…' : 'Add slot'}
          </button>
        </div>
      </div>
    </div>
  );
}

