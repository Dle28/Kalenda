"use client";
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function OwnerAvailabilityQuickAdd({ creatorPubkey }: { creatorPubkey: string }) {
  const { publicKey } = useWallet();
  const mine = publicKey?.toBase58() === creatorPubkey;
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: '', start: '', end: '', repeatWeeks: '0' });

  if (!mine) return null;

  async function addAvailability() {
    if (!form.date || !form.start || !form.end) return;
    const s = new Date(`${form.date}T${form.start}:00`);
    const e = new Date(`${form.date}T${form.end}:00`);
    if (e <= s) return;
    const payloads: any[] = [];
    const baseId = `${creatorPubkey}-avail-${s.toISOString()}`;
    const repeat = Math.max(0, Number(form.repeatWeeks) || 0);
    for (let i = 0; i <= repeat; i++) {
      const si = new Date(s);
      const ei = new Date(e);
      if (i > 0) { si.setDate(si.getDate() + 7 * i); ei.setDate(ei.getDate() + 7 * i); }
      payloads.push({ id: `${baseId}-r${i}`, creator: creatorPubkey, start: si.toISOString(), end: ei.toISOString() });
    }
    setSaving(true);
    try {
      const body = payloads.length > 1 ? { availability: payloads } : payloads[0];
      await fetch('/api/availability', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setOpen(false);
      setForm({ date: '', start: '', end: '', repeatWeeks: '0' });
      // Soft refresh to show in calendar
      if (typeof window !== 'undefined') window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <div className="row" style={{ marginBottom: 8 }}>
        <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => setOpen(true)}>
          Add availability
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="section-title" style={{ margin: 0 }}>Add availability</h3>
        <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => setOpen(false)}>Close</button>
      </div>
      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
        <label className="stack" style={{ minWidth: 160 }}>
          <span className="muted">Date</span>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </label>
        <label className="stack" style={{ minWidth: 140 }}>
          <span className="muted">Start</span>
          <input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
        </label>
        <label className="stack" style={{ minWidth: 140 }}>
          <span className="muted">End</span>
          <input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
        </label>
        <label className="stack" style={{ minWidth: 160 }}>
          <span className="muted">Repeat weekly</span>
          <input type="number" min={0} step={1} value={form.repeatWeeks} onChange={(e) => setForm({ ...form, repeatWeeks: e.target.value })} />
        </label>
        <div className="row" style={{ alignItems: 'end', gap: 8 }}>
          <button className="btn btn-outline" style={{ padding: '8px 12px' }} onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn btn-secondary" style={{ padding: '8px 12px' }} disabled={saving} onClick={addAvailability}>
            {saving ? 'Saving…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
