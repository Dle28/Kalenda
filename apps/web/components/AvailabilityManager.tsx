"use client";
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

type Item = { id: string; creator: string; start: string; end: string };

export default function AvailabilityManager({ creatorPubkey }: { creatorPubkey: string }) {
  const { publicKey } = useWallet();
  const mine = publicKey?.toBase58() === creatorPubkey;
  if (!mine) return null;
  const [list, setList] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState({ start: '', end: '' });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/availability?creator=${encodeURIComponent(creatorPubkey)}`, { cache: 'no-store' });
      const json = await res.json();
      setList(json.availability || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [creatorPubkey]);

  async function remove(id: string) {
    await fetch(`/api/availability?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    setList((x) => x.filter((i) => i.id !== id));
  }
  function openEdit(item: Item) {
    const s = new Date(item.start);
    const e = new Date(item.end);
    setForm({ start: s.toISOString().slice(0, 16), end: e.toISOString().slice(0, 16) });
    setEditing(item);
  }
  async function saveEdit() {
    if (!editing) return;
    const s = new Date(form.start);
    const e = new Date(form.end);
    if (e <= s) return;
    const payload = { ...editing, start: s.toISOString(), end: e.toISOString() };
    await fetch('/api/availability', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setEditing(null);
    await load();
  }

  return (
    <div className="card" style={{ marginTop: 10 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="section-title" style={{ margin: 0 }}>Intro call slots</h3>
        <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={load}>Refresh</button>
      </div>
      {loading ? (
        <p className="muted">Loading...</p>
      ) : list.length === 0 ? (
        <p className="muted">No availability yet.</p>
      ) : (
        <div className="stack" style={{ gap: 8 }}>
          {list.map((i) => {
            const s = new Date(i.start);
            const e = new Date(i.end);
            const dur = Math.round((e.getTime() - s.getTime()) / 60000);
            return (
              <div key={i.id} className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted">{s.toLocaleString()} – {e.toLocaleTimeString()} ({dur} min)</span>
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => openEdit(i)}>Edit</button>
                  <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => remove(i.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="modal" onClick={() => setEditing(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <b>Edit availability</b>
              <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => setEditing(null)}>Close</button>
            </div>
            <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
              <label className="stack" style={{ minWidth: 220 }}>
                <span className="muted">Start</span>
                <input type="datetime-local" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
              </label>
              <label className="stack" style={{ minWidth: 220 }}>
                <span className="muted">End</span>
                <input type="datetime-local" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
              </label>
              <div className="row" style={{ alignItems: 'end', gap: 8 }}>
                <button className="btn btn-secondary" style={{ padding: '8px 12px' }} onClick={saveEdit}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

