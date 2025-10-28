"use client";
import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getProgram } from '@/lib/anchorClient';
import type { PublicKey } from '@solana/web3.js';

export type ReserveButtonProps = {
  slotId: string;
  mode: 'Stable' | 'EnglishAuction';
  price?: number;
  startPrice?: number;
  currency?: 'SOL' | 'SOL';
};

export default function ReserveButton({ slotId, mode, price, startPrice, currency = 'SOL' }: ReserveButtonProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleReserve() {
    try {
      if (!wallet.connected) {
        await wallet.connect();
      }
      setSubmitting(true);
      setStatus('Preparing transaction...');

      // Currently, we only implement Stable flow placeholder
      if (mode !== 'Stable') {
        setStatus('Redirecting to slot detail for auction bidding...');
        location.assign(`/slot/${encodeURIComponent(slotId)}`);
        return;
      }

      const program = getProgram(connection, wallet as any);
      // TODO: replace placeholders with real PDA derivations from SDK and accounts wiring
      // For demo purposes, simulate a pending transaction
      setStatus('Sending transaction...');
      await new Promise((r) => setTimeout(r, 1200));
      setStatus('Reserved (mock).');
    } catch (e: any) {
      setStatus(`Error: ${e?.message || String(e)}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stack" style={{ gap: 6 }}>
      <button className="btn btn-secondary" style={{ padding: '8px 12px' }} disabled={submitting} onClick={handleReserve}>
        {submitting ? 'Reserving...' : 'Reserve'}
      </button>
      {status && <span className="muted" style={{ fontSize: 12 }}>{status}</span>}
    </div>
  );
}

