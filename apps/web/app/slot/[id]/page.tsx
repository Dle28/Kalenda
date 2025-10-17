"use client";
import { useMemo, useState } from 'react';
import { slots } from '@/lib/mock';
import SlotCard from '@/components/SlotCard';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getProgram } from '@/lib/anchorClient';

export default function SlotPage({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const s = slots.find((x) => x.id === id);
  const { connection } = useConnection();
  const wallet = useWallet();
  const program = useMemo(() => {
    if (!wallet.publicKey) return null;
    return getProgram(connection, wallet as any);
  }, [connection, wallet.publicKey]);

  const [status, setStatus] = useState<string>('');

  if (!s) return <div>Không tìm thấy slot.</div>;

  async function reserveStable() {
    try {
      setStatus('Đang gửi lệnh đặt chỗ...');
      await new Promise((r) => setTimeout(r, 1000));
      setStatus('Đã đặt chỗ (mô phỏng).');
    } catch (e: any) {
      setStatus(`Lỗi: ${e?.message || String(e)}`);
    }
  }

  async function placeBid() {
    try {
      setStatus('Đang đặt bid...');
      await new Promise((r) => setTimeout(r, 1000));
      setStatus('Đã đặt bid (mô phỏng).');
    } catch (e: any) {
      setStatus(`Lỗi: ${e?.message || String(e)}`);
    }
  }

  return (
    <section>
      <h1 className="title" style={{ fontSize: 28 }}>Slot</h1>
      <p className="muted">Creator: {s.creator.slice(0, 6)}...{s.creator.slice(-4)}</p>
      <div style={{ marginTop: 12 }}>
        <SlotCard
          id={s.id}
          mode={s.mode}
          start={new Date(s.start)}
          end={new Date(s.end)}
          price={s.price}
          startPrice={s.startPrice}
        />
      </div>
      <div className="card" style={{ marginTop: 16, display:'grid', gap:12 }}>
        <b>Hành động</b>
        {s.mode === 'Stable' ? (
          <button className="btn" disabled={!program} onClick={reserveStable}>Đặt ngay</button>
        ) : (
          <button className="btn btn-secondary" disabled={!program} onClick={placeBid}>Đặt bid</button>
        )}
        <span className="muted">{wallet.publicKey ? `Ví: ${wallet.publicKey.toBase58().slice(0,6)}...` : 'Chưa kết nối ví'}</span>
        {status && <span className="muted">{status}</span>}
      </div>
    </section>
  );
}

