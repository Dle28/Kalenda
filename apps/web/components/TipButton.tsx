"use client";
import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';

interface TipButtonProps {
  creatorPubkey: string;
  creatorName: string;
  platformAddress?: string;
}

const PRESET_AMOUNTS = [
  { label: '$5', sol: 0.05 },
  { label: '$10', sol: 0.1 },
  { label: '$25', sol: 0.25 },
  { label: '$50', sol: 0.5 },
];

export default function TipButton({ creatorPubkey, creatorName, platformAddress }: TipButtonProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const sendTip = async (solAmount: number) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      // Simple SOL transfer (no program call for MVP)
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(creatorPubkey),
          lamports: solAmount * LAMPORTS_PER_SOL,
        })
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      const signed = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      });

      setSuccess(true);
      console.log('Tip sent!', signature);
      
      // Close modal after 2s
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        setCustomAmount('');
        setMessage('');
      }, 2000);

    } catch (error) {
      console.error('Tip failed:', error);
      alert('Failed to send tip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        className="btn btn-outline"
        onClick={() => setShowModal(true)}
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 6,
          padding: '8px 14px',
          fontSize: 14
        }}
      >
        💰 Tip
      </button>

      {showModal && (
        <div 
          className="modal-overlay" 
          onClick={() => !loading && setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1b1e',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 16,
              padding: 24,
              maxWidth: 440,
              width: '90%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20 }}>Tip {creatorName}</h3>
              {!loading && (
                <button 
                  onClick={() => setShowModal(false)}
                  style={{ background: 'none', border: 'none', color: '#999', fontSize: 24, cursor: 'pointer' }}
                >
                  ×
                </button>
              )}
            </div>

            {success ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <h4 style={{ color: '#22c55e', margin: '0 0 8px' }}>Tip sent successfully!</h4>
                <p className="muted">Thank you for supporting {creatorName}</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 12, fontSize: 14, opacity: 0.85 }}>
                    Choose amount (SOL)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {PRESET_AMOUNTS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => !loading && sendTip(preset.sol)}
                        disabled={loading}
                        className="btn btn-outline"
                        style={{ 
                          padding: '12px 8px',
                          fontSize: 14,
                          opacity: loading ? 0.5 : 1,
                        }}
                      >
                        <div>{preset.label}</div>
                        <div style={{ fontSize: 11, opacity: 0.7 }}>{preset.sol} SOL</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ margin: '20px 0' }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, opacity: 0.85 }}>
                    Or custom amount (SOL)
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.1"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      disabled={loading}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(255,255,255,0.04)',
                        color: '#fff',
                        fontSize: 14,
                      }}
                    />
                    <button
                      onClick={() => {
                        const amount = parseFloat(customAmount);
                        if (amount > 0) {
                          sendTip(amount);
                        }
                      }}
                      disabled={loading || !customAmount || parseFloat(customAmount) <= 0}
                      className="btn btn-secondary"
                      style={{ 
                        padding: '10px 20px',
                        opacity: (!customAmount || parseFloat(customAmount) <= 0) ? 0.5 : 1,
                      }}
                    >
                      {loading ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 20 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, opacity: 0.85 }}>
                    Message (optional)
                  </label>
                  <textarea
                    placeholder="Say something nice..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading}
                    maxLength={200}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.04)',
                      color: '#fff',
                      fontSize: 14,
                      fontFamily: 'inherit',
                      resize: 'none',
                    }}
                  />
                  <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                    {message.length}/200
                  </div>
                </div>

                <div style={{ 
                  marginTop: 20, 
                  padding: 12, 
                  background: 'rgba(239,132,189,0.1)', 
                  border: '1px solid rgba(239,132,189,0.2)',
                  borderRadius: 10,
                  fontSize: 13,
                  opacity: 0.85,
                }}>
                  <strong>💡 Tip:</strong> 100% goes directly to the creator. No platform fees!
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

