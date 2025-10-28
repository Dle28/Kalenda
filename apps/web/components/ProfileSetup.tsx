"use client";
import { useState, useEffect } from 'react';

export type ProfileData = {
  name: string;
  bio: string;
  location: string;
  timezone: string;
  avatar?: string;
  meetingTypes: {
    video: boolean;
    audio: boolean;
    inperson: boolean;
  };
  sessionTitle?: string;
  sessionDescription?: string;
  sessionMaterials?: string;
  defaults?: {
    mode: 'Stable' | 'EnglishAuction';
    currency: 'SOL' | 'SOL';
    durationMin: string;
    bufferMin: string;
    price?: string;
    startPrice?: string;
    bidStep?: string;
  };
};

type ProfileSetupProps = {
  value: ProfileData;
  onChange: (data: ProfileData) => void;
  mode?: 'compact' | 'full';
};

export default function ProfileSetup({ value, onChange, mode = 'full' }: ProfileSetupProps) {
  const [imageUploading, setImageUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.url) {
        onChange({ ...value, avatar: json.url });
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <div className="profile-setup" style={{ display: 'grid', gap: 16 }}>
      {/* Avatar & Basic Info */}
      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <b style={{ fontSize: 18 }}>Profile basics</b>
        
        <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
          <div className="avatar-upload" style={{ position: 'relative' }}>
            {value.avatar ? (
              <img 
                src={value.avatar} 
                alt="Avatar" 
                style={{ 
                  width: 96, 
                  height: 96, 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  border: '3px solid rgba(96,165,250,0.3)'
                }} 
              />
            ) : (
              <div 
                style={{ 
                  width: 96, 
                  height: 96, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, rgba(96,165,250,0.2), rgba(168,85,247,0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed rgba(148,163,184,0.3)'
                }}
              >
                <span style={{ fontSize: 40, opacity: 0.5 }}>👤</span>
              </div>
            )}
            <label 
              htmlFor="avatar-input" 
              className="btn btn-outline" 
              style={{ 
                padding: '4px 8px', 
                fontSize: 12, 
                position: 'absolute', 
                bottom: -8, 
                left: '50%', 
                transform: 'translateX(-50%)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {imageUploading ? 'Uploading...' : 'Upload'}
            </label>
            <input 
              id="avatar-input" 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              style={{ display: 'none' }} 
              disabled={imageUploading}
            />
          </div>

          <div style={{ flex: 1, display: 'grid', gap: 10 }}>
            <label className="stack">
              <span className="muted">Display name *</span>
              <input 
                value={value.name} 
                onChange={(e) => onChange({ ...value, name: e.target.value })} 
                placeholder="Your name or brand"
                required
              />
            </label>
            <label className="stack">
              <span className="muted">Location</span>
              <input 
                value={value.location} 
                onChange={(e) => onChange({ ...value, location: e.target.value })} 
                placeholder="City, Country"
              />
            </label>
          </div>
        </div>

        <label className="stack">
          <span className="muted">Bio *</span>
          <textarea 
            value={value.bio} 
            onChange={(e) => onChange({ ...value, bio: e.target.value })} 
            placeholder="Tell people about yourself, your expertise, and what you offer..."
            rows={4}
            required
          />
        </label>

        <label className="stack">
          <span className="muted">Timezone</span>
          <input 
            value={value.timezone} 
            onChange={(e) => onChange({ ...value, timezone: e.target.value })} 
            placeholder="e.g., America/New_York"
          />
        </label>
      </div>

      {/* Session Details (only in full mode) */}
      {mode === 'full' && (
        <div className="card" style={{ display: 'grid', gap: 12 }}>
          <b style={{ fontSize: 18 }}>Session details</b>
          <p className="muted" style={{ marginTop: -8 }}>
            Describe what attendees can expect when they book time with you
          </p>

          <label className="stack">
            <span className="muted">Session title</span>
            <input 
              value={value.sessionTitle || ''} 
              onChange={(e) => onChange({ ...value, sessionTitle: e.target.value })} 
              placeholder="e.g., 1:1 Mentoring, Portfolio Review, Strategy Call"
            />
          </label>

          <label className="stack">
            <span className="muted">Session description</span>
            <textarea 
              value={value.sessionDescription || ''} 
              onChange={(e) => onChange({ ...value, sessionDescription: e.target.value })} 
              placeholder="What will you cover? What outcomes can attendees expect?"
              rows={5}
            />
          </label>

          <label className="stack">
            <span className="muted">Materials & links (optional)</span>
            <input 
              value={value.sessionMaterials || ''} 
              onChange={(e) => onChange({ ...value, sessionMaterials: e.target.value })} 
              placeholder="Links to prep materials, calendar, meeting platform..."
            />
          </label>

          <div>
            <b className="muted" style={{ display: 'block', marginBottom: 8 }}>Meeting types offered</b>
            <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
              <label className="row" style={{ gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={value.meetingTypes.video} 
                  onChange={(e) => onChange({ 
                    ...value, 
                    meetingTypes: { ...value.meetingTypes, video: e.target.checked } 
                  })} 
                />
                <span>🎥 Video call</span>
              </label>
              <label className="row" style={{ gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={value.meetingTypes.audio} 
                  onChange={(e) => onChange({ 
                    ...value, 
                    meetingTypes: { ...value.meetingTypes, audio: e.target.checked } 
                  })} 
                />
                <span>🎙️ Audio call</span>
              </label>
              <label className="row" style={{ gap: 6, alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={value.meetingTypes.inperson} 
                  onChange={(e) => onChange({ 
                    ...value, 
                    meetingTypes: { ...value.meetingTypes, inperson: e.target.checked } 
                  })} 
                />
                <span>🤝 In-person</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Default Pricing (only in full mode) */}
      {mode === 'full' && (
        <div className="card" style={{ display: 'grid', gap: 12 }}>
          <b style={{ fontSize: 18 }}>Default pricing & duration</b>
          <p className="muted" style={{ marginTop: -8 }}>
            Set your default values — you can customize individual slots later
          </p>

          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <label className="stack" style={{ minWidth: 160 }}>
              <span className="muted">Mode</span>
              <select 
                value={value.defaults?.mode || 'Stable'} 
                onChange={(e) => onChange({ 
                  ...value, 
                  defaults: { 
                    ...(value.defaults || { currency: 'SOL', durationMin: '30', bufferMin: '10' }), 
                    mode: e.target.value as any 
                  } 
                })}
              >
                <option value="Stable">Fixed price</option>
                <option value="EnglishAuction">English auction</option>
              </select>
            </label>

            <label className="stack" style={{ minWidth: 140 }}>
              <span className="muted">Currency</span>
              <select 
                value={value.defaults?.currency || 'SOL'} 
                onChange={(e) => onChange({ 
                  ...value, 
                  defaults: { 
                    ...(value.defaults || { mode: 'Stable', durationMin: '30', bufferMin: '10' }), 
                    currency: e.target.value as any 
                  } 
                })}
              >
                <option value="SOL">SOL</option>
                <option value="SOL">SOL</option>
              </select>
            </label>

            <label className="stack" style={{ minWidth: 140 }}>
              <span className="muted">Duration (min)</span>
              <input 
                type="number" 
                min={5} 
                step={5}
                value={value.defaults?.durationMin || '30'} 
                onChange={(e) => onChange({ 
                  ...value, 
                  defaults: { 
                    ...(value.defaults || { mode: 'Stable', currency: 'SOL', bufferMin: '10' }), 
                    durationMin: e.target.value 
                  } 
                })} 
              />
            </label>

            <label className="stack" style={{ minWidth: 140 }}>
              <span className="muted">Buffer (min)</span>
              <input 
                type="number" 
                min={0} 
                step={5}
                value={value.defaults?.bufferMin || '10'} 
                onChange={(e) => onChange({ 
                  ...value, 
                  defaults: { 
                    ...(value.defaults || { mode: 'Stable', currency: 'SOL', durationMin: '30' }), 
                    bufferMin: e.target.value 
                  } 
                })} 
              />
            </label>
          </div>

          {(value.defaults?.mode || 'Stable') === 'Stable' ? (
            <label className="stack" style={{ maxWidth: 200 }}>
              <span className="muted">Price ({value.defaults?.currency || 'SOL'})</span>
              <input 
                type="number" 
                min={0} 
                step={0.01}
                value={value.defaults?.price || '20'} 
                onChange={(e) => onChange({ 
                  ...value, 
                  defaults: { 
                    ...(value.defaults || { mode: 'Stable', currency: 'SOL', durationMin: '30', bufferMin: '10' }), 
                    price: e.target.value 
                  } 
                })} 
              />
            </label>
          ) : (
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              <label className="stack" style={{ minWidth: 160 }}>
                <span className="muted">Start price ({value.defaults?.currency || 'SOL'})</span>
                <input 
                  type="number" 
                  min={0} 
                  step={0.01}
                  value={value.defaults?.startPrice || '10'} 
                  onChange={(e) => onChange({ 
                    ...value, 
                    defaults: { 
                      ...(value.defaults || { mode: 'EnglishAuction', currency: 'SOL', durationMin: '30', bufferMin: '10' }), 
                      startPrice: e.target.value 
                    } 
                  })} 
                />
              </label>
              <label className="stack" style={{ minWidth: 160 }}>
                <span className="muted">Bid step ({value.defaults?.currency || 'SOL'})</span>
                <input 
                  type="number" 
                  min={0.01} 
                  step={0.01}
                  value={value.defaults?.bidStep || '1'} 
                  onChange={(e) => onChange({ 
                    ...value, 
                    defaults: { 
                      ...(value.defaults || { mode: 'EnglishAuction', currency: 'SOL', durationMin: '30', bufferMin: '10' }), 
                      bidStep: e.target.value 
                    } 
                  })} 
                />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

