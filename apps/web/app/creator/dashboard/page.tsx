"use client";
import { useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CalendarScheduler, { type WeeklyAvailability } from '@/components/CalendarScheduler';
import ProfileSetup, { type ProfileData } from '@/components/ProfileSetup';

type PricingMode = 'Stable' | 'EnglishAuction';
type Tab = 'overview' | 'profile' | 'slots' | 'earnings';

export default function CreatorDashboard() {
  const wallet = useWallet();
  const router = useRouter();
  const pubkey = wallet.publicKey?.toBase58();
  
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  // Profile state
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    bio: '',
    location: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    meetingTypes: { video: true, audio: false, inperson: false },
    avatar: undefined,
    sessionTitle: '',
    sessionDescription: '',
    sessionMaterials: '',
    defaults: { mode: 'Stable', currency: 'USDC', durationMin: '30', bufferMin: '10', price: '20', startPrice: '10', bidStep: '1' },
  });

  // Slots & availability
  const [availability, setAvailability] = useState<WeeklyAvailability>({ 0: [9, 10, 11], 2: [14, 15], 4: [9, 10, 16] });
  const [slots, setSlots] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<number>(0);
  const [autoPublish, setAutoPublish] = useState(true);
  const [useCalendar, setUseCalendar] = useState(false);

  // Quick slot creator
  const [quick, setQuick] = useState({ date: '', start: '', durationMin: '30', mode: 'Stable' as PricingMode, price: '20', startPrice: '10', bidStep: '1' });

  // Load profile on mount
  useEffect(() => {
    if (!pubkey) {
      router.push('/profile');
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(`/api/creator/profile?pubkey=${encodeURIComponent(pubkey)}`, { cache: 'no-store' });
        const json = await res.json();
        
        if (json?.profile) {
          const p = json.profile;
          const mt = p.meetingTypes || [];
          const meetingTypes = {
            video: mt.includes('Video call') || !!p.meetingTypes?.video,
            audio: mt.includes('Audio call') || !!p.meetingTypes?.audio,
            inperson: mt.includes('In-person') || !!p.meetingTypes?.inperson,
          };

          setProfile({
            name: p.name || '',
            bio: p.bio || '',
            location: p.location || '',
            timezone: p.timezone || profile.timezone,
            meetingTypes,
            avatar: p.avatar,
            sessionTitle: p.sessionTitle || '',
            sessionDescription: p.sessionDescription || '',
            sessionMaterials: p.sessionMaterials || '',
            defaults: {
              mode: p.defaults?.mode || 'Stable',
              currency: p.defaults?.currency || 'USDC',
              durationMin: String(p.defaults?.durationMin || '30'),
              bufferMin: String(p.defaults?.bufferMin || '10'),
              price: p.defaults?.price ?? '20',
              startPrice: p.defaults?.startPrice ?? '10',
              bidStep: p.defaults?.bidStep ?? '1',
            },
          });

          if (p.availability) {
            setAvailability(p.availability);
          }
        }
      } catch (err) {
        console.error('Load profile failed:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [pubkey, router]);

  async function handleSaveProfile() {
    if (!pubkey) return;

    setSaving(true);
    setStatus('Saving...');

    try {
      const meetingTypes = Object.entries(profile.meetingTypes)
        .filter(([, v]) => v)
        .map(([k]) => ({ video: 'Video call', audio: 'Audio call', inperson: 'In-person' } as any)[k] || k);

      const body = {
        pubkey,
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
        availability,
      };

      const res = await fetch('/api/creator/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to save');

      setStatus('✓ Saved successfully');
      setTimeout(() => setStatus(''), 2000);
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function generateSlotsFromAvailability() {
    if (!pubkey) return;
    
    const dur = Math.max(15, Number(profile.defaults?.durationMin) || 30);
    const base = new Date();
    const day = base.getDay();
    const monday = new Date(base);
    const diff = (day === 0 ? -6 : 1) - day;
    monday.setDate(base.getDate() + diff);
    const nextWeek = new Date(monday);
    nextWeek.setDate(monday.getDate() + 7);

    const next: any[] = [];
    for (let d = 0; d < 7; d++) {
      const hours = availability[d] || [];
      for (const h of hours) {
        const start = new Date(nextWeek);
        start.setDate(nextWeek.getDate() + d);
        start.setHours(h, 0, 0, 0);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + dur);
        
        next.push({
          id: `${pubkey}-${start.toISOString()}`,
          creator: pubkey,
          start: start.toISOString(),
          end: end.toISOString(),
          mode: profile.defaults?.mode,
          price: profile.defaults?.mode === 'Stable' ? Number(profile.defaults?.price) || 0 : undefined,
          startPrice: profile.defaults?.mode === 'EnglishAuction' ? Number(profile.defaults?.startPrice) || 0 : undefined,
        });
      }
    }
    
    next.sort((a, b) => a.start.localeCompare(b.start));
    setSlots(next);
    
    if (autoPublish) {
      await fetch('/api/slots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slots: next }) });
      setStatus('✓ Slots published');
      setTimeout(() => setStatus(''), 2000);
    }
  }

  if (loading) {
    return (
      <section className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 20px' }} />
        <p className="muted">Loading dashboard...</p>
      </section>
    );
  }

  return (
    <section className="container page-enter" style={{ padding: '20px 0 60px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h1 className="title" style={{ fontSize: 32, margin: 0 }}>Creator Dashboard</h1>
          <Link href={`/creator/${pubkey}`} className="btn btn-outline" style={{ padding: '8px 16px' }}>
            View Public Profile →
          </Link>
        </div>
        <p className="muted">Manage your profile, availability, and earnings</p>
      </div>

      {status && (
        <div className={`card`} style={{ padding: 12, marginBottom: 20, background: status.includes('Error') ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', border: `1px solid ${status.includes('Error') ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}` }}>
          <span style={{ color: status.includes('Error') ? '#fca5a5' : '#86efac' }}>{status}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24, borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
        <div className="row" style={{ gap: 4 }}>
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile
          </button>
          <button
            className={`tab ${activeTab === 'slots' ? 'active' : ''}`}
            onClick={() => setActiveTab('slots')}
          >
            📅 Slots
          </button>
          <button
            className={`tab ${activeTab === 'earnings' ? 'active' : ''}`}
            onClick={() => setActiveTab('earnings')}
          >
            💰 Earnings
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="fade-in" style={{ display: 'grid', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="card" style={{ padding: 20 }}>
              <div className="muted" style={{ fontSize: 14, marginBottom: 8 }}>Total Earnings</div>
              <b style={{ fontSize: 32 }}>${revenue.toFixed(2)}</b>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div className="muted" style={{ fontSize: 14, marginBottom: 8 }}>Available Hours</div>
              <b style={{ fontSize: 32 }}>{Object.values(availability).flat().length}/week</b>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div className="muted" style={{ fontSize: 14, marginBottom: 8 }}>Published Slots</div>
              <b style={{ fontSize: 32 }}>{slots.length}</b>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div className="muted" style={{ fontSize: 14, marginBottom: 8 }}>Bookings</div>
              <b style={{ fontSize: 32 }}>0</b>
            </div>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <b style={{ fontSize: 18, marginBottom: 16, display: 'block' }}>Quick Actions</b>
            <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => setActiveTab('profile')}>Edit Profile</button>
              <button className="btn btn-secondary" onClick={() => setActiveTab('slots')}>Manage Slots</button>
              <button className="btn btn-outline" onClick={generateSlotsFromAvailability}>Generate Next Week</button>
              <Link href={`/creator/${pubkey}`} className="btn btn-outline">Preview Profile</Link>
            </div>
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="fade-in">
          <ProfileSetup value={profile} onChange={setProfile} mode="full" />
          <div className="row" style={{ gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'Saving...' : '💾 Save Profile'}
            </button>
          </div>
        </div>
      )}

      {/* Slots Tab */}
      {activeTab === 'slots' && (
        <div className="fade-in" style={{ display: 'grid', gap: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <b style={{ fontSize: 18 }}>{useCalendar ? 'Weekly Availability' : 'New slot'}</b>
              <label className="row" style={{ gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={useCalendar} onChange={(e) => setUseCalendar(e.target.checked)} />
                <span className="muted">Use calendar mode</span>
              </label>
            </div>

            {useCalendar ? (
              <>
                <CalendarScheduler value={availability} onChange={setAvailability} startHour={7} endHour={22} />
                <div className="row" style={{ gap: 12, marginTop: 16, justifyContent: 'space-between' }}>
                  <label className="row" style={{ gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={autoPublish} onChange={(e) => setAutoPublish(e.target.checked)} />
                    <span className="muted">Auto-publish on generate</span>
                  </label>
                  <button className="btn btn-secondary" onClick={generateSlotsFromAvailability}>
                    Generate Next Week Slots
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <label className="stack" style={{ minWidth: 160 }}>
                    <span className="muted">Date</span>
                    <input type="date" value={quick.date} onChange={(e) => setQuick({ ...quick, date: e.target.value })} />
                  </label>
                  <label className="stack" style={{ minWidth: 120 }}>
                    <span className="muted">Start</span>
                    <input type="time" value={quick.start} onChange={(e) => setQuick({ ...quick, start: e.target.value })} />
                  </label>
                  <label className="stack" style={{ minWidth: 120 }}>
                    <span className="muted">Duration (min)</span>
                    <input type="number" min={15} step={15} value={quick.durationMin} onChange={(e) => setQuick({ ...quick, durationMin: e.target.value })} />
                  </label>
                  <label className="stack" style={{ minWidth: 140 }}>
                    <span className="muted">Price (USDC)</span>
                    <input type="number" min={0} step={0.01} value={quick.price} onChange={(e) => setQuick({ ...quick, price: e.target.value })} />
                  </label>
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={async () => {
                    if (!quick.date || !quick.start || Number(quick.durationMin) <= 0) return;
                    const start = new Date(`${quick.date}T${quick.start}:00`);
                    const end = new Date(start);
                    end.setMinutes(end.getMinutes() + Number(quick.durationMin));
                    const s = {
                      id: `${pubkey}-${start.toISOString()}`,
                      creator: pubkey,
                      start: start.toISOString(),
                      end: end.toISOString(),
                      mode: 'Stable',
                      price: Number(quick.price) || 0,
                    };
                    setSlots((prev) => [s, ...prev]);
                    if (autoPublish) {
                      await fetch('/api/slots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
                      setStatus('✓ Slot published');
                      setTimeout(() => setStatus(''), 2000);
                    }
                  }}
                >
                  + Create Slot
                </button>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 20 }}>
            <b style={{ fontSize: 18, marginBottom: 16, display: 'block' }}>Published Slots ({slots.length})</b>
            {slots.length === 0 ? (
              <p className="muted">No slots created yet. Use the creator above to add your first slot.</p>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {slots.slice(0, 5).map((s) => (
                  <div key={s.id} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <b>{new Date(s.start).toLocaleString()}</b>
                      <div className="muted" style={{ fontSize: 14 }}>
                        {s.mode === 'Stable' ? `$${s.price}` : `Auction from $${s.startPrice}`}
                      </div>
                    </div>
                    <button className="btn btn-outline" style={{ padding: '6px 12px' }} onClick={() => setSlots((prev) => prev.filter((x) => x.id !== s.id))}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Earnings Tab */}
      {activeTab === 'earnings' && (
        <div className="fade-in">
          <div className="card" style={{ padding: 24 }}>
            <b style={{ fontSize: 20, marginBottom: 16, display: 'block' }}>Revenue Overview</b>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div>
                <div className="muted" style={{ marginBottom: 8 }}>Total Earned (Revenue)</div>
                <b style={{ fontSize: 28 }}>${revenue.toFixed(2)}</b>
              </div>
              <div>
                <div className="muted" style={{ marginBottom: 8 }}>This Month</div>
                <b style={{ fontSize: 28 }}>$0.00</b>
              </div>
              <div>
                <div className="muted" style={{ marginBottom: 8 }}>Pending</div>
                <b style={{ fontSize: 28 }}>$0.00</b>
              </div>
            </div>
            <button className="btn btn-outline" onClick={() => setRevenue((v) => v + 25)}>
              Simulate +$25 Revenue
            </button>
          </div>
        </div>
      )}

      <style>{`
        .tabs { padding: 0 4px; }
        .tab {
          padding: 12px 20px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: rgba(148,163,184,0.8);
          cursor: pointer;
          font-size: 15px;
          transition: all 0.2s ease;
        }
        .tab:hover { color: #f8fafc; background: rgba(148,163,184,0.05); }
        .tab.active {
          color: #60a5fa;
          border-bottom-color: #60a5fa;
          font-weight: 600;
        }
        .fade-in {
          animation: fadeIn 0.3s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .spinner {
          border: 3px solid rgba(148,163,184,0.2);
          border-top-color: #60a5fa;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}
