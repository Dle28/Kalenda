"use client";
import { useMemo, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getProgram } from '@/lib/anchorClient';
import CalendarScheduler, { type WeeklyAvailability } from '@/components/CalendarScheduler';

type Step = 1 | 2 | 3;

export default function OnboardPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const program = useMemo(() => (wallet.publicKey ? getProgram(connection, wallet as any) : null), [connection, wallet.publicKey]);

  // Stepper state
  const [step, setStep] = useState<Step>(1);
  const [status, setStatus] = useState<string>('');

  // Step 1: payout
  const [payoutWallet, setPayoutWallet] = useState<string>('');
  const [feeBps, setFeeBps] = useState<string>('250');
  const canInit = !!wallet.publicKey && !!program && payoutWallet.length > 0;

  async function handleInitProfile() {
    try {
      setStatus('Sending transaction...');
      // TODO wire real anchor call
      await new Promise((r) => setTimeout(r, 800));
      setStatus('Profile initialized.');
      setStep(2);
    } catch (e: any) {
      setStatus(`Error: ${e?.message || String(e)}`);
    }
  }

  // Step 2: availability + pricing quick setup
  const [availability, setAvailability] = useState<WeeklyAvailability>({ 1: [9, 10, 11], 3: [14, 15], 5: [9, 10] });
  const [durationMin, setDurationMin] = useState('30');
  const [price, setPrice] = useState('20');
  const [mode, setMode] = useState<'Stable' | 'EnglishAuction'>('Stable');
  const [startPrice, setStartPrice] = useState('10');
  const [bidStep, setBidStep] = useState('1');

  function canContinueStep2() {
    const hasAny = Object.values(availability).some((arr) => (arr || []).length > 0);
    return hasAny && Number(durationMin) > 0 && (mode === 'Stable' ? Number(price) > 0 : Number(startPrice) > 0);
  }

  // Step 3: review + finish
  function goDashboard() {
    location.assign('/creator/dashboard');
  }

  return (
    <section>
      <h1 className="title" style={{ fontSize: 28 }}>Become a Creator</h1>
      <p className="muted">Follow 3 steps to start selling your time.</p>

      <div className="card" style={{ marginTop: 16, display: 'grid', gap: 14 }}>
        <div className="row" style={{ gap: 8 }}>
          <span className={`badge ${step === 1 ? '' : 'muted'}`}>1. Profile</span>
          <span className={`badge ${step === 2 ? '' : 'muted'}`}>2. Availability & Pricing</span>
          <span className={`badge ${step === 3 ? '' : 'muted'}`}>3. Review</span>
          <span className="spacer" />
          {status && <span className="muted">{status}</span>}
        </div>

        {step === 1 && (
          <div className="stack" style={{ gap: 12 }}>
            <label className="stack">
              <span className="muted">Payout wallet</span>
              <input value={payoutWallet} onChange={(e) => setPayoutWallet(e.target.value)} placeholder="PublicKey..." />
            </label>
            <label className="stack" style={{ maxWidth: 260 }}>
              <span className="muted">Platform fee override (BPS, optional)</span>
              <input value={feeBps} onChange={(e) => setFeeBps(e.target.value)} />
            </label>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn-secondary" disabled={!canInit} onClick={handleInitProfile}>Initialize profile</button>
              <button className="btn btn-outline" onClick={() => setStep(2)} disabled={!wallet.publicKey}>Skip to Step 2</button>
              <span className="muted">{wallet.publicKey ? `Connected: ${wallet.publicKey.toBase58().slice(0,6)}...` : 'Wallet not connected'}</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="stack" style={{ gap: 12 }}>
            <b>Availability</b>
            <CalendarScheduler value={availability} onChange={setAvailability} />
            <b>Pricing</b>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              <label className="stack" style={{ minWidth: 160 }}>
                <span className="muted">Mode</span>
                <select value={mode} onChange={(e) => setMode(e.target.value as any)}>
                  <option value="Stable">Fixed price</option>
                  <option value="EnglishAuction">English auction</option>
                </select>
              </label>
              <label className="stack" style={{ minWidth: 160 }}>
                <span className="muted">Duration (min)</span>
                <input value={durationMin} onChange={(e) => setDurationMin(e.target.value)} />
              </label>
              {mode === 'Stable' ? (
                <label className="stack" style={{ minWidth: 160 }}>
                  <span className="muted">Price (USDC)</span>
                  <input value={price} onChange={(e) => setPrice(e.target.value)} />
                </label>
              ) : (
                <>
                  <label className="stack" style={{ minWidth: 160 }}>
                    <span className="muted">Start price (USDC)</span>
                    <input value={startPrice} onChange={(e) => setStartPrice(e.target.value)} />
                  </label>
                  <label className="stack" style={{ minWidth: 160 }}>
                    <span className="muted">Bid step (USDC)</span>
                    <input value={bidStep} onChange={(e) => setBidStep(e.target.value)} />
                  </label>
                </>
              )}
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn-secondary" disabled={!canContinueStep2()} onClick={() => setStep(3)}>Continue</button>
              <button className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="stack" style={{ gap: 12 }}>
            <b>Review & Publish</b>
            <div className="card" style={{ display: 'grid', gap: 6 }}>
              <span><b>Payout:</b> {payoutWallet || '(not set)'}</span>
              <span><b>Fee (BPS):</b> {feeBps || 'default'}</span>
              <span><b>Mode:</b> {mode}</span>
              <span><b>Duration:</b> {durationMin} min</span>
              <span><b>Price:</b> {mode === 'Stable' ? `${price} USDC` : `Start ${startPrice} USDC • step ${bidStep}`}</span>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn-secondary" onClick={goDashboard}>Go to Dashboard</button>
              <button className="btn btn-outline" onClick={() => setStep(2)}>Edit</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
