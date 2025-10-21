"use client";
import { useMemo, useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { getProgram } from '@/lib/anchorClient';
import CalendarScheduler, { type WeeklyAvailability } from '@/components/CalendarScheduler';
import ProfileSetup, { type ProfileData } from '@/components/ProfileSetup';

type Step = 1 | 2 | 3 | 4;

export default function OnboardPage() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const router = useRouter();
  const program = useMemo(() => (wallet.publicKey ? getProgram(connection, wallet as any) : null), [connection, wallet.publicKey]);

  // Stepper state
  const [step, setStep] = useState<Step>(1);
  const [status, setStatus] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Profile data (step 1-2)
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    bio: '',
    location: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    meetingTypes: { video: true, audio: false, inperson: false },
    sessionTitle: '',
    sessionDescription: '',
    sessionMaterials: '',
    defaults: {
      mode: 'Stable',
      currency: 'USDC',
      durationMin: '30',
      bufferMin: '10',
      price: '20',
      startPrice: '10',
      bidStep: '1',
    },
  });

  // Availability (step 3)
  const [availability, setAvailability] = useState<WeeklyAvailability>({ 
    1: [9, 10, 11, 14, 15], 
    3: [9, 10, 14, 15], 
    5: [9, 10, 11] 
  });

  // Check if profile already exists
  useEffect(() => {
    const checkExisting = async () => {
      if (!wallet.publicKey) return;
      try {
        const res = await fetch(`/api/creator/profile?pubkey=${wallet.publicKey.toBase58()}`, { cache: 'no-store' });
        const json = await res.json();
        if (json?.profile && json.profile.name) {
          // Profile exists, offer to skip to dashboard
          const skip = confirm('You already have a profile. Skip to dashboard?');
          if (skip) {
            router.push('/creator/dashboard');
          }
        }
      } catch {}
    };
    checkExisting();
  }, [wallet.publicKey, router]);

  const canContinueStep1 = profile.name.trim().length > 0 && profile.bio.trim().length > 0;
  const canContinueStep2 = profile.sessionTitle && profile.sessionTitle.trim().length > 0;
  const canContinueStep3 = Object.values(availability).some((arr) => arr && arr.length > 0);

  async function handleSaveProfile() {
    if (!wallet.publicKey) {
      setStatus('Please connect your wallet');
      return;
    }

    setSaving(true);
    setStatus('Saving profile...');

    try {
      const meetingTypes = Object.entries(profile.meetingTypes)
        .filter(([, v]) => v)
        .map(([k]) => ({ video: 'Video call', audio: 'Audio call', inperson: 'In-person' } as any)[k] || k);

      const body = {
        pubkey: wallet.publicKey.toBase58(),
        name: profile.name,
        bio: profile.bio,
        location: profile.location,
        timezone: profile.timezone,
        avatar: profile.avatar,
        meetingTypes,
        sessionTitle: profile.sessionTitle,
        sessionDescription: profile.sessionDescription,
        sessionMaterials: profile.sessionMaterials,
        defaults: profile.defaults,
        availability: availability,
      };

      const res = await fetch('/api/creator/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to save profile');

      setStatus('Profile saved successfully!');
      setTimeout(() => setStatus(''), 2000);
      return true;
    } catch (err: any) {
      console.error('Save failed:', err);
      setStatus(`Error: ${err?.message || 'Failed to save'}`);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleFinish() {
    const saved = await handleSaveProfile();
    if (saved) {
      setTimeout(() => {
        router.push('/creator/dashboard');
      }, 500);
    }
  }

  const progressPercent = (step / 4) * 100;

  return (
    <section className="container" style={{ maxWidth: 900, padding: '20px 0 60px' }}>
      <div className="page-enter">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 className="title" style={{ fontSize: 36, marginBottom: 12, background: 'linear-gradient(135deg, #60a5fa, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Become a Creator
          </h1>
          <p className="muted" style={{ fontSize: 16 }}>
            Set up your profile and start selling your time in minutes
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 24, background: 'rgba(148,163,184,0.1)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              background: 'linear-gradient(90deg, #60a5fa, #a855f7)', 
              width: `${progressPercent}%`,
              transition: 'width 0.3s ease',
              borderRadius: 999
            }} 
          />
        </div>

        {/* Step indicators */}
        <div className="row" style={{ gap: 8, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          <div className={`badge ${step === 1 ? 'badge-primary' : step > 1 ? 'badge-success' : ''}`}>
            {step > 1 ? '✓' : '1'} Profile
          </div>
          <span className="muted">→</span>
          <div className={`badge ${step === 2 ? 'badge-primary' : step > 2 ? 'badge-success' : ''}`}>
            {step > 2 ? '✓' : '2'} Session
          </div>
          <span className="muted">→</span>
          <div className={`badge ${step === 3 ? 'badge-primary' : step > 3 ? 'badge-success' : ''}`}>
            {step > 3 ? '✓' : '3'} Availability
          </div>
          <span className="muted">→</span>
          <div className={`badge ${step === 4 ? 'badge-primary' : ''}`}>
            4 Launch
          </div>
        </div>

        {status && (
          <div className="card" style={{ padding: 12, background: status.includes('Error') ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', border: `1px solid ${status.includes('Error') ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`, marginBottom: 16 }}>
            <span style={{ color: status.includes('Error') ? '#fca5a5' : '#86efac' }}>{status}</span>
          </div>
        )}

        {/* Step 1: Profile basics */}
        {step === 1 && (
          <div className="fade-in">
            <ProfileSetup value={profile} onChange={setProfile} mode="compact" />
            
            <div className="row" style={{ gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              {!wallet.publicKey && (
                <span className="muted">⚠️ Connect your wallet to continue</span>
              )}
              <button 
                className="btn btn-secondary" 
                disabled={!canContinueStep1 || !wallet.publicKey} 
                onClick={() => setStep(2)}
                style={{ padding: '10px 24px' }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Session details */}
        {step === 2 && (
          <div className="fade-in">
            <div className="card" style={{ display: 'grid', gap: 12 }}>
              <b style={{ fontSize: 18 }}>Session details</b>
              <p className="muted" style={{ marginTop: -8 }}>
                Tell people what they'll get when they book time with you
              </p>

              <label className="stack">
                <span className="muted">Session title *</span>
                <input 
                  value={profile.sessionTitle || ''} 
                  onChange={(e) => setProfile({ ...profile, sessionTitle: e.target.value })} 
                  placeholder="e.g., 1:1 Career Mentoring, Portfolio Review, Strategy Call"
                  required
                />
              </label>

              <label className="stack">
                <span className="muted">Session description *</span>
                <textarea 
                  value={profile.sessionDescription || ''} 
                  onChange={(e) => setProfile({ ...profile, sessionDescription: e.target.value })} 
                  placeholder="What will you cover? What outcomes can attendees expect? What should they prepare?"
                  rows={6}
                  required
                />
              </label>

              <label className="stack">
                <span className="muted">Materials & links (optional)</span>
                <input 
                  value={profile.sessionMaterials || ''} 
                  onChange={(e) => setProfile({ ...profile, sessionMaterials: e.target.value })} 
                  placeholder="Links to prep materials, calendar link, meeting platform..."
                />
              </label>

              <div>
                <b className="muted" style={{ display: 'block', marginBottom: 10 }}>Meeting types you offer *</b>
                <div className="row" style={{ gap: 14, flexWrap: 'wrap' }}>
                  <label className="row" style={{ gap: 8, alignItems: 'center', cursor: 'pointer', padding: '8px 12px', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, background: profile.meetingTypes.video ? 'rgba(96,165,250,0.1)' : 'transparent' }}>
                    <input 
                      type="checkbox" 
                      checked={profile.meetingTypes.video} 
                      onChange={(e) => setProfile({ 
                        ...profile, 
                        meetingTypes: { ...profile.meetingTypes, video: e.target.checked } 
                      })} 
                    />
                    <span>🎥 Video call</span>
                  </label>
                  <label className="row" style={{ gap: 8, alignItems: 'center', cursor: 'pointer', padding: '8px 12px', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, background: profile.meetingTypes.audio ? 'rgba(96,165,250,0.1)' : 'transparent' }}>
                    <input 
                      type="checkbox" 
                      checked={profile.meetingTypes.audio} 
                      onChange={(e) => setProfile({ 
                        ...profile, 
                        meetingTypes: { ...profile.meetingTypes, audio: e.target.checked } 
                      })} 
                    />
                    <span>🎙️ Audio call</span>
                  </label>
                  <label className="row" style={{ gap: 8, alignItems: 'center', cursor: 'pointer', padding: '8px 12px', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8, background: profile.meetingTypes.inperson ? 'rgba(96,165,250,0.1)' : 'transparent' }}>
                    <input 
                      type="checkbox" 
                      checked={profile.meetingTypes.inperson} 
                      onChange={(e) => setProfile({ 
                        ...profile, 
                        meetingTypes: { ...profile.meetingTypes, inperson: e.target.checked } 
                      })} 
                    />
                    <span>🤝 In-person</span>
                  </label>
                </div>
              </div>

              {/* Pricing defaults */}
              <div style={{ marginTop: 12, paddingTop: 16, borderTop: '1px solid rgba(148,163,184,0.1)' }}>
                <b style={{ display: 'block', marginBottom: 10 }}>Default pricing</b>
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <label className="stack" style={{ minWidth: 160 }}>
                    <span className="muted">Mode</span>
                    <select 
                      value={profile.defaults?.mode || 'Stable'} 
                      onChange={(e) => setProfile({ 
                        ...profile, 
                        defaults: { ...profile.defaults!, mode: e.target.value as any } 
                      })}
                    >
                      <option value="Stable">💵 Fixed price</option>
                      <option value="EnglishAuction">🔨 Auction</option>
                    </select>
                  </label>

                  <label className="stack" style={{ minWidth: 120 }}>
                    <span className="muted">Currency</span>
                    <select 
                      value={profile.defaults?.currency || 'USDC'} 
                      onChange={(e) => setProfile({ 
                        ...profile, 
                        defaults: { ...profile.defaults!, currency: e.target.value as any } 
                      })}
                    >
                      <option value="USDC">USDC</option>
                      <option value="SOL">SOL</option>
                    </select>
                  </label>

                  <label className="stack" style={{ minWidth: 120 }}>
                    <span className="muted">Duration (min)</span>
                    <input 
                      type="number" 
                      min={15} 
                      step={15}
                      value={profile.defaults?.durationMin || '30'} 
                      onChange={(e) => setProfile({ 
                        ...profile, 
                        defaults: { ...profile.defaults!, durationMin: e.target.value } 
                      })} 
                    />
                  </label>

                  {profile.defaults?.mode === 'Stable' ? (
                    <label className="stack" style={{ minWidth: 140 }}>
                      <span className="muted">Price ({profile.defaults?.currency})</span>
                      <input 
                        type="number" 
                        min={0} 
                        step={0.01}
                        value={profile.defaults?.price || '20'} 
                        onChange={(e) => setProfile({ 
                          ...profile, 
                          defaults: { ...profile.defaults!, price: e.target.value } 
                        })} 
                      />
                    </label>
                  ) : (
                    <>
                      <label className="stack" style={{ minWidth: 140 }}>
                        <span className="muted">Start price ({profile.defaults?.currency})</span>
                        <input 
                          type="number" 
                          min={0} 
                          step={0.01}
                          value={profile.defaults?.startPrice || '10'} 
                          onChange={(e) => setProfile({ 
                            ...profile, 
                            defaults: { ...profile.defaults!, startPrice: e.target.value } 
                          })} 
                        />
                      </label>
                      <label className="stack" style={{ minWidth: 120 }}>
                        <span className="muted">Bid step</span>
                        <input 
                          type="number" 
                          min={0.01} 
                          step={0.01}
                          value={profile.defaults?.bidStep || '1'} 
                          onChange={(e) => setProfile({ 
                            ...profile, 
                            defaults: { ...profile.defaults!, bidStep: e.target.value } 
                          })} 
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="row" style={{ gap: 12, marginTop: 24, justifyContent: 'space-between' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => setStep(1)}
                style={{ padding: '10px 20px' }}
              >
                ← Back
              </button>
              <button 
                className="btn btn-secondary" 
                disabled={!canContinueStep2} 
                onClick={() => setStep(3)}
                style={{ padding: '10px 24px' }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Availability */}
        {step === 3 && (
          <div className="fade-in">
            <div className="card" style={{ display: 'grid', gap: 12 }}>
              <b style={{ fontSize: 18 }}>Set your weekly availability</b>
              <p className="muted" style={{ marginTop: -8 }}>
                Click hours to toggle your typical available times. You can create specific slots later.
              </p>
              <CalendarScheduler 
                value={availability} 
                onChange={setAvailability}
                startHour={7}
                endHour={22}
              />
            </div>

            <div className="row" style={{ gap: 12, marginTop: 24, justifyContent: 'space-between' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => setStep(2)}
                style={{ padding: '10px 20px' }}
              >
                ← Back
              </button>
              <button 
                className="btn btn-secondary" 
                disabled={!canContinueStep3} 
                onClick={() => setStep(4)}
                style={{ padding: '10px 24px' }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Launch */}
        {step === 4 && (
          <div className="fade-in">
            <div className="card" style={{ display: 'grid', gap: 16, padding: 24, background: 'linear-gradient(135deg, rgba(96,165,250,0.05), rgba(168,85,247,0.05))' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
                <b style={{ fontSize: 20 }}>Ready to launch!</b>
                <p className="muted" style={{ marginTop: 8 }}>Review your profile before going live</p>
              </div>

              <div style={{ display: 'grid', gap: 12, padding: 16, background: 'rgba(15,23,42,0.5)', borderRadius: 12 }}>
                <div className="row" style={{ gap: 12, alignItems: 'center' }}>
                  {profile.avatar && (
                    <img src={profile.avatar} alt="Avatar" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} />
                  )}
                  <div>
                    <b style={{ display: 'block', fontSize: 18 }}>{profile.name}</b>
                    <span className="muted">{profile.location || 'Location not set'}</span>
                  </div>
                </div>
                
                <div style={{ paddingTop: 12, borderTop: '1px solid rgba(148,163,184,0.1)' }}>
                  <p style={{ fontSize: 14, lineHeight: 1.6 }}>{profile.bio}</p>
                </div>

                <div style={{ display: 'grid', gap: 8, paddingTop: 12, borderTop: '1px solid rgba(148,163,184,0.1)' }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="muted">Session:</span>
                    <b>{profile.sessionTitle}</b>
                  </div>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="muted">Pricing:</span>
                    <b>
                      {profile.defaults?.mode === 'Stable' 
                        ? `${profile.defaults?.price} ${profile.defaults?.currency}` 
                        : `Auction from ${profile.defaults?.startPrice} ${profile.defaults?.currency}`
                      }
                    </b>
                  </div>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="muted">Duration:</span>
                    <b>{profile.defaults?.durationMin} minutes</b>
                  </div>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span className="muted">Available hours:</span>
                    <b>{Object.values(availability).flat().length} hours/week</b>
                  </div>
                </div>
              </div>
            </div>

            <div className="row" style={{ gap: 12, marginTop: 24, justifyContent: 'space-between' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => setStep(3)}
                style={{ padding: '10px 20px' }}
              >
                ← Back
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleFinish}
                disabled={saving}
                style={{ padding: '12px 32px', fontSize: 16 }}
              >
                {saving ? 'Saving...' : '🚀 Launch Profile'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .fade-in {
          animation: fadeIn 0.3s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .badge-primary {
          background: linear-gradient(135deg, #60a5fa, #a855f7);
          color: white;
          font-weight: 600;
        }
        .badge-success {
          background: rgba(34,197,94,0.2);
          border-color: rgba(34,197,94,0.4);
          color: #86efac;
        }
      `}</style>
    </section>
  );
}
