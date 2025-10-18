"use client";
import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function ProfileSettings() {
  const wallet = useWallet();
  const pubkey = wallet.publicKey?.toBase58() || '';
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [meeting, setMeeting] = useState({ video: true, audio: false, inperson: false });

  async function loadProfile() {
    if (!pubkey) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/creator/profile?pubkey=${encodeURIComponent(pubkey)}`, { cache: 'no-store' });
      const json = await res.json();
      const p = json?.profile;
      if (p) {
        setName(p.name || '');
        setBio(p.bio || '');
        setLocation(p.location || '');
        setTimezone(p.timezone || timezone);
        setAvatar(p.avatar);
        const mt = p.meetingTypes || [];
        setMeeting({
          video: mt.includes('Video call') || !!p.meetingTypes?.video,
          audio: mt.includes('Audio call') || !!p.meetingTypes?.audio,
          inperson: mt.includes('In-person') || !!p.meetingTypes?.inperson,
        });
      }
    } catch (e) {
      console.warn('loadProfile failed', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pubkey]);

  async function uploadAvatar(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const json = await res.json();
    if (json?.url) setAvatar(json.url);
  }

  async function save() {
    if (!pubkey) {
      setStatus('Connect wallet first');
      return;
    }
    setStatus('Saving...');
    const meetingTypes = Object.entries(meeting)
      .filter(([, v]) => v)
      .map(([k]) => ({ video: 'Video call', audio: 'Audio call', inperson: 'In-person' } as any)[k] || k);
    const body = { pubkey, name, bio, location, timezone, avatar, meetingTypes };
    const res = await fetch('/api/creator/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) setStatus('Saved');
    else setStatus('Save failed');
    setTimeout(() => setStatus(null), 1500);
  }

  return (
    <>
      <button className="btn btn-outline" style={{ padding: '6px 12px' }} onClick={() => setOpen(true)}>
        Settings
      </button>

      {open && (
        <div className="modal" onClick={() => setOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <b>Edit profile</b>
              <button className="btn btn-outline" style={{ padding: '6px 10px' }} onClick={() => setOpen(false)}>Close</button>
            </div>
            <div className="stack" style={{ gap: 10 }}>
              {!pubkey && <span className="muted">Connect your wallet to save profile.</span>}
              <label className="stack">
                <span className="muted">Display name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </label>
              <label className="stack">
                <span className="muted">Bio</span>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Introduce yourself..." rows={3} />
              </label>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                <label className="stack" style={{ minWidth: 160 }}>
                  <span className="muted">Location</span>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City / Remote" />
                </label>
                <label className="stack" style={{ minWidth: 200 }}>
                  <span className="muted">Timezone</span>
                  <input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
                </label>
              </div>
              <div className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <label className="row" style={{ gap: 6 }}>
                  <input type="checkbox" checked={meeting.video} onChange={(e) => setMeeting({ ...meeting, video: e.target.checked })} />
                  <span className="muted">Video call</span>
                </label>
                <label className="row" style={{ gap: 6 }}>
                  <input type="checkbox" checked={meeting.audio} onChange={(e) => setMeeting({ ...meeting, audio: e.target.checked })} />
                  <span className="muted">Audio call</span>
                </label>
                <label className="row" style={{ gap: 6 }}>
                  <input type="checkbox" checked={meeting.inperson} onChange={(e) => setMeeting({ ...meeting, inperson: e.target.checked })} />
                  <span className="muted">In-person</span>
                </label>
              </div>
              <label className="stack">
                <span className="muted">Avatar</span>
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
                {avatar && <img src={avatar} alt="avatar" width={72} height={72} style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,.12)' }} />}
              </label>

              {/* Removed defaults for new slots section as requested */}

              <div className="row" style={{ gap: 8 }}>
                <button className="btn btn-secondary" style={{ padding: '8px 12px' }} disabled={!pubkey || loading} onClick={save}>Save</button>
                {status && <span className="muted">{status}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
