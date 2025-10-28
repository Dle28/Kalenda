"use client";
import { useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

type Req = { id: string; creator: string; start: string; end: string; from?: string; note?: string; createdAt: string; status?: 'pending'|'approved'|'declined' };

export default function RequestsPanel({ creatorPubkey, pricePerMin }: { creatorPubkey: string; pricePerMin?: number }) {
  const { publicKey } = useWallet();
  const mine = publicKey?.toBase58() === creatorPubkey;
  if (!mine) return null;
  const [list, setList] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<{ id: string; price: string } | null>(null);

  const pending = useMemo(() => list.filter((x) => (x.status || 'pending') === 'pending'), [list]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/requests?creator=${encodeURIComponent(creatorPubkey)}`, { cache: 'no-store' });
      const json = await res.json();
      const arr: Req[] = (json.requests || []).sort((a: Req, b: Req) => b.createdAt.localeCompare(a.createdAt));
      setList(arr);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [creatorPubkey]);

  async function setStatus(id: string, status: Req['status']) {
    await fetch('/api/requests', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    await load();
  }
  async function remove(id: string) {
    await fetch(`/api/requests?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await load();
  }
  function approveWithPrice(id: string, start: string, end: string) {
    const s = new Date(start), e = new Date(end);
    const dur = Math.round((e.getTime() - s.getTime())/60000);
    const def = typeof pricePerMin === 'number' ? (pricePerMin * dur).toFixed(2) : '';
    setEdit({ id, price: def });
  }
  async function confirmApprove(req: Req) {
    if (!edit) return;
    const price = Number(edit.price || 0);
    const slot = {
      id: `${req.creator}-${req.start}-approved`,
      creator: req.creator,
      start: req.start,
      end: req.end,
      mode: 'Stable' as const,
      price,
    };
    await fetch('/api/slots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(slot) });
    await setStatus(req.id, 'approved');
    setEdit(null);
  }

  return (
    <div className="card" style={{ marginTop: 10 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="section-title" style={{ margin: 0 }}>Booking requests</h3>
        <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={load}>Refresh</button>
      </div>
      {loading ? (
        <p className="muted">Loading...</p>
      ) : list.length === 0 ? (
        <p className="muted">No requests yet.</p>
      ) : (
        <div className="stack" style={{ gap: 8 }}>
          {list.map((r) => {
            const s = new Date(r.start);
            const e = new Date(r.end);
            const dur = Math.round((e.getTime() - s.getTime())/60000);
            const st = r.status || 'pending';
            return (
              <div key={r.id} className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="stack" style={{ gap: 2 }}>
                  <b>{s.toLocaleString()} – {e.toLocaleTimeString()} ({dur} min)</b>
                  <span className="muted">From: {r.from || 'Anonymous'} • {st}</span>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  {st === 'pending' && (
                    <>
                      <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => approveWithPrice(r.id, r.start, r.end)}>Approve</button>
                      <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => setStatus(r.id, 'declined')}>Decline</button>
                    </>
                  )}
                  {st !== 'pending' && (
                    <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => remove(r.id)}>Delete</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {edit && (
        <div className="modal" onClick={() => setEdit(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <b>Approve request</b>
              <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => setEdit(null)}>Close</button>
            </div>
            <div className="row" style={{ gap: 10, alignItems: 'end', flexWrap: 'wrap' }}>
              <label className="stack" style={{ minWidth: 160 }}>
                <span className="muted">Price (SOL)</span>
                <input type="number" inputMode="decimal" min={0} step={0.01} value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} />
              </label>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn btn-secondary" style={{ padding: '8px 12px' }} onClick={() => confirmApprove(list.find((x) => x.id === edit.id)!)}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

