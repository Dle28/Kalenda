"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Slot = {
  id: string;
  creator: string;
  start: string;
  end: string;
  mode: 'Stable' | 'EnglishAuction';
  price?: number;
  startPrice?: number;
};

export default function ManageSlotPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = decodeURIComponent(params.id);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [price, setPrice] = useState<string>('');
  const [startPrice, setStartPrice] = useState<string>('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/slot?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          setSlot(json.slot);
          setPrice(String(json.slot?.price ?? ''));
          setStartPrice(String(json.slot?.startPrice ?? ''));
        }
      } catch {}
    };
    load();
  }, [id]);

  // Minimal editable UI with send/update/delete via existing endpoints
  async function save() {
    if (!slot) return;
    setStatus('Saving...');
    const body: any = { ...slot };
    if (slot.mode === 'Stable') body.price = Number(price || slot.price || 0);
    else body.startPrice = Number(startPrice || slot.startPrice || 0);
    await fetch('/api/slots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setStatus('Saved.');
    setTimeout(() => setStatus(null), 1200);
  }

  async function remove() {
    if (!slot) return;
    if (!confirm('Delete this slot?')) return;
    setStatus('Deleting...');
    await fetch(`/api/slots?id=${encodeURIComponent(slot.id)}`, { method: 'DELETE' });
    setStatus('Deleted');
    setTimeout(() => router.back(), 600);
  }

  // Placeholder UI while loading
  if (!slot) {
    return (
      <section className="container page-enter">
        <div className="card">
          <b>Manage slot</b>
          <p className="muted">Slot data will appear here once integrated.</p>
        </div>
      </section>
    );
  }

  const st = new Date(slot.start);
  const en = new Date(slot.end);

  return (
    <section className="container page-enter" style={{ maxWidth: 780 }}>
      <h1 className="title" style={{ fontSize: 28, margin: '8px 0 12px' }}>Manage slot</h1>
      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <b>{slot.mode === 'EnglishAuction' ? 'Auction' : 'Fixed price'}</b>
          <span className="badge">{Math.round((en.getTime() - st.getTime())/60000)} min</span>
        </div>
        <span className="muted">{st.toLocaleString()} - {en.toLocaleTimeString()}</span>
        {slot.mode === 'Stable' ? (
          <label className="stack">
            <span className="muted">Price (USDC)</span>
            <input type="number" inputMode="decimal" min={0} step={0.01} value={price} onChange={(e) => setPrice(e.target.value)} placeholder={String(slot.price ?? 0)} />
          </label>
        ) : (
          <label className="stack">
            <span className="muted">Start price (USDC)</span>
            <input type="number" inputMode="decimal" min={0} step={0.01} value={startPrice} onChange={(e) => setStartPrice(e.target.value)} placeholder={String(slot.startPrice ?? 0)} />
          </label>
        )}
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-secondary" style={{ padding: '8px 12px' }} onClick={save}>Save</button>
          <button className="btn btn-outline" style={{ padding: '8px 12px' }} onClick={remove}>Delete</button>
          {status && <span className="muted">{status}</span>}
        </div>
      </div>
    </section>
  );
}
