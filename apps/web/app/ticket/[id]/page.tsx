"use client";
import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

export default function TicketPage() {
  const params = useParams<{ id?: string | string[] }>() as Readonly<{ id?: string | string[] }> | null;
  const rawId = Array.isArray(params?.id) ? params?.id?.[0] : params?.id || '';
  const id = decodeURIComponent(rawId);
  const [checkedIn, setCheckedIn] = useState(false);
  const url = useMemo(() => (typeof window !== 'undefined' ? `${location.origin}/ticket/${encodeURIComponent(id)}` : `ticket:${id}`), [id]);

  return (
    <section className="container" style={{ padding: '20px 0 40px' }}>
      <h1 className="title" style={{ fontSize: 28 }}>Ticket</h1>
      <div className="card" style={{ marginTop: 16, display: 'grid', gap: 10 }}>
        <div className="row" style={{ gap: 12, alignItems: 'center' }}>
          <div style={{ width: 160, height: 160, borderRadius: 12, background: 'repeating-linear-gradient(45deg,#111,#111 6px,#222 6px,#222 12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 12 }}>QR</div>
          <div className="stack">
            <span className="muted">NFT Ticket ID</span>
            <b>{id.slice(0, 8)}…{id.slice(-4)}</b>
            <span className="muted" style={{ fontSize: 12 }}>{url}</span>
            <span className="badge">Status: {checkedIn ? 'Checked-in' : 'Not checked-in'}</span>
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => setCheckedIn((v) => !v)}>
            {checkedIn ? 'Undo check-in' : 'Mark as checked-in'}
          </button>
          <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => navigator.clipboard?.writeText(url)}>Copy link</button>
        </div>
      </div>
    </section>
  );
}
