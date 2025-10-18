"use client";
import { useMemo, useState } from 'react';

type SlotForm = {
  date: string;
  start: string;
  durationMin: string;
  mode: 'Stable' | 'EnglishAuction';
  price?: string;
  startPrice?: string;
  bidStep?: string;
};

export default function CreatorDashboard() {
  const [form, setForm] = useState<SlotForm>({ date: '', start: '', durationMin: '30', mode: 'Stable', price: '' });
  const [revenue, setRevenue] = useState<number>(0);
  const [slots, setSlots] = useState<any[]>([]);

  const canCreate = useMemo(() => !!form.date && !!form.start && Number(form.durationMin) > 0 && (form.mode === 'Stable' ? Number(form.price) > 0 : Number(form.startPrice) > 0), [form]);

  function createSlot() {
    const id = `${form.date} ${form.start}`;
    setSlots((prev) => [{ id, ...form }, ...prev]);
    setForm({ date: '', start: '', durationMin: '30', mode: form.mode, price: '', startPrice: '', bidStep: form.bidStep });
  }

  function exportCSV() {
    const headers = ['id', 'date', 'start', 'durationMin', 'mode', 'price', 'startPrice', 'bidStep'];
    const body = [headers.join(',')].concat(slots.map((s) => headers.map((h) => s[h] ?? '').join(',')));
    const blob = new Blob([body.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'slots.csv'; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <section className="container" style={{ padding: '20px 0 40px' }}>
      <div className="dashboard-shell">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="title" style={{ fontSize: 28, margin: 0 }}>Creator Dashboard</h1>
            <p className="muted" style={{ margin: '4px 0 0' }}>Create slots, toggle auction, set prices and view revenue.</p>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-outline" style={{ padding: '8px 12px' }}>Preview profile</button>
            <button className="btn btn-secondary" style={{ padding: '8px 12px' }}>New slot</button>
          </div>
        </div>

        <div className="grid" style={{ marginTop: 16 }}>
          <div className="card" style={{ display: 'grid', gap: 10 }}>
            <b>New slot</b>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <label className="stack" style={{ minWidth: 160 }}>
              <span className="muted">Date</span>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </label>
            <label className="stack" style={{ minWidth: 140 }}>
              <span className="muted">Start</span>
              <input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
            </label>
            <label className="stack" style={{ minWidth: 140 }}>
              <span className="muted">Duration (min)</span>
              <input value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} />
            </label>
          </div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <label className="stack">
              <span className="muted">Mode</span>
              <select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value as any })}>
                <option value="Stable">Fixed price</option>
                <option value="EnglishAuction">English auction</option>
              </select>
            </label>
            {form.mode === 'Stable' ? (
              <label className="stack">
                <span className="muted">Price (USDC)</span>
                <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </label>
            ) : (
              <>
                <label className="stack">
                  <span className="muted">Start price (USDC)</span>
                  <input value={form.startPrice} onChange={(e) => setForm({ ...form, startPrice: e.target.value })} />
                </label>
                <label className="stack">
                  <span className="muted">Bid step (USDC)</span>
                  <input value={form.bidStep} onChange={(e) => setForm({ ...form, bidStep: e.target.value })} />
                </label>
              </>
            )}
          </div>
          <button className="btn btn-secondary" disabled={!canCreate} onClick={createSlot} style={{ width: 'fit-content' }}>Create slot</button>
        </div>

        <div className="card" style={{ display: 'grid', gap: 10 }}>
          <b>Revenue</b>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="muted">Total earned</span>
            <b>${revenue.toFixed(2)}</b>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => setRevenue((v) => v + 10)}>Simulate +$10</button>
            <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={exportCSV}>Export CSV</button>
          </div>
        </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <h3 className="section-title">My slots</h3>
          <div className="grid" style={{ marginTop: 12 }}>
            {slots.length === 0 ? (
              <div className="card muted">No slots yet.</div>
            ) : (
              slots.map((s) => (
                <div key={s.id} className="card" style={{ display: 'grid', gap: 6 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <b>{s.mode === 'Stable' ? 'Fixed price' : 'Auction'}</b>
                    <span className="badge">{s.durationMin} min</span>
                  </div>
                  <span className="muted">{s.date} {s.start}</span>
                  <div className="row" style={{ gap: 8 }}>
                    <button className="btn btn-outline" style={{ padding: '6px 10px' }}>Toggle auction</button>
                    <button className="btn btn-outline" style={{ padding: '6px 10px' }}>Edit</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
