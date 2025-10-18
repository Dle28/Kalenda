"use client";
import { useMemo, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getProgram } from '@/lib/anchorClient';

export default function OnboardPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const program = useMemo(() => {
    if (!wallet.publicKey) return null;
    return getProgram(connection, wallet as any);
  }, [connection, wallet.publicKey]);

  const [payoutWallet, setPayoutWallet] = useState<string>('');
  const [feeBps, setFeeBps] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const canSubmit = !!wallet.publicKey && !!program && payoutWallet.length > 0;

  async function handleInitProfile() {
    try {
      setStatus('Đang gửi giao dịch...');
      // TODO: replace with actual Anchor call when IDL and instruction are wired
      // await program.methods.initCreatorProfile(new PublicKey(payoutWallet), feeBps ? Number(feeBps) : null)
      //   .accounts({...})
      //   .rpc();
      await new Promise((r) => setTimeout(r, 1200));
      setStatus('Đã khởi tạo hồ sơ (mô phỏng).');
    } catch (e: any) {
      setStatus(`Lỗi: ${e?.message || String(e)}`);
    }
  }

  return (
    <section>
      <h1 className="title" style={{fontSize:28}}>Trở thành Creator</h1>
      <p className="muted">Bước 1: Kết nối ví, Bước 2: Khởi tạo hồ sơ, Bước 3: Tạo slot.</p>
      <div className="card" style={{marginTop:16, display:'grid', gap:12}}>
        <label className="stack">
          <span className="muted">Ví nhận thanh toán (payout wallet)</span>
          <input value={payoutWallet} onChange={(e) => setPayoutWallet(e.target.value)} placeholder="PublicKey..." />
        </label>
        <label className="stack">
          <span className="muted">Phí nền tảng override (BPS, tuỳ chọn)</span>
          <input value={feeBps} onChange={(e) => setFeeBps(e.target.value)} placeholder="ví dụ: 250 (2.5%)" />
        </label>
        <button className="btn" disabled={!canSubmit} onClick={handleInitProfile}>
          Khởi tạo hồ sơ
        </button>
        <span className="muted">{wallet.publicKey ? `Đã kết nối: ${wallet.publicKey.toBase58().slice(0,6)}...` : 'Chưa kết nối ví'}</span>
        {status && <span className="muted">{status}</span>}
      </div>
    </section>
  );
}

