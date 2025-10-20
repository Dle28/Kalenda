"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import WalletButton from './WalletButton';

export default function CreatorBalance({ creatorPubkey }: { creatorPubkey: string }) {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const isOwner = useMemo(() => publicKey?.toBase58() === creatorPubkey, [publicKey, creatorPubkey]);
  const [lamports, setLamports] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let sub = 0;
    let active = true;
    async function load() {
      try {
        if (!publicKey) return setLamports(null);
        setLoading(true);
        const bal = await connection.getBalance(publicKey);
        if (!active) return;
        setLamports(bal);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    if (publicKey) {
      sub = connection.onAccountChange(publicKey, (acc) => {
        setLamports(acc.lamports);
      });
    }
    return () => {
      active = false;
      if (sub) connection.removeAccountChangeListener(sub);
    };
  }, [connection, publicKey]);

  if (!connected || !isOwner) {
    return (
      <div className="card" style={{ marginTop: 12 }}>
        <h3 className="section-title" style={{ marginTop: 0 }}>Balance</h3>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="muted">Connect your wallet to view balance</span>
          <WalletButton />
        </div>
      </div>
    );
  }

  const base58 = publicKey!.toBase58();
  const short = `${base58.slice(0, 6)}...${base58.slice(-4)}`;
  const sol = typeof lamports === 'number' ? lamports / LAMPORTS_PER_SOL : null;
  const cluster = (process.env.NEXT_PUBLIC_RPC_ENDPOINT || '').includes('devnet') ? 'devnet' : (process.env.NEXT_PUBLIC_RPC_ENDPOINT || '').includes('testnet') ? 'testnet' : undefined;
  const explorer = `https://explorer.solana.com/address/${encodeURIComponent(base58)}${cluster ? `?cluster=${cluster}` : ''}`;

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <h3 className="section-title" style={{ marginTop: 0 }}>Balance</h3>
      <div className="stats" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="stat">
          <span className="stat-label">SOL</span>
          <span className="stat-value">{loading ? '…' : (sol !== null ? sol.toFixed(4) : '-')}</span>
        </div>
        <div className="stat" title={base58}>
          <span className="stat-label">Wallet</span>
          <Link className="one-line" href={explorer} target="_blank" rel="noreferrer" style={{ color: '#e5e7eb', textDecoration: 'none' }}>
            {short}
          </Link>
        </div>
      </div>
    </div>
  );
}

