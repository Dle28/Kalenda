import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Link from 'next/link';
import { creators, slots } from '@/lib/mock';
import '../profile.css';

dayjs.extend(relativeTime);

type Params = { params: { pubkey: string } };

export default function CreatorProfilePage({ params }: Params) {
  const pubkey = decodeURIComponent(params.pubkey);
  const creator = creators.find((c) => c.pubkey === pubkey);

  if (!creator) {
    return (
      <section className="profile-wrap">
        <div className="container">
          <p className="muted">Creator not found.</p>
          <Link href="/creators" className="btn btn-outline" style={{ marginTop: 12 }}>
            Back to creators
          </Link>
        </div>
      </section>
    );
  }

  const profileSlots = slots.filter((s) => s.creator === pubkey);
  const shortKey = `${pubkey.slice(0, 6)}...${pubkey.slice(-4)}`;

  return (
    <section className="profile-wrap">
      <div className="container">
        <div className="profile-hero">
          <div className="hero-left">
            <div className="row" style={{ gap: 14, alignItems: 'center' }}>
              <img
                src={creator.avatar || 'https://placehold.co/160x160?text=User'}
                alt={creator.name}
                width={72}
                height={72}
                className="avatar-lg"
              />
              <div className="stack">
                <h1 className="pf-title">{creator.name}</h1>
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <span className="badge">{shortKey}</span>
                  {creator.fields?.slice(0, 3).map((f) => (
                    <span key={f} className="badge">
                      {f}
                    </span>
                  ))}
                  {typeof creator.rating === 'number' && (
                    <span className="badge">★ {creator.rating.toFixed(1)} / 5</span>
                  )}
                </div>
              </div>
            </div>

            {creator.bio && <p className="pf-bio">{creator.bio}</p>}

            <div className="row ctas">
              <Link href={`/#book`} className="btn btn-secondary">
                Book time
              </Link>
              <Link href={`/#invest`} className="btn btn-outline">
                Invest
              </Link>
            </div>
          </div>

          <div className="hero-card">
            <div className="hero-media" style={{ backgroundImage: `url(${creator.avatar || 'https://placehold.co/640x640'})` }} />
            <div className="hero-overlay">
              <div className="row" style={{ justifyContent: 'space-between', width: '100%' }}>
                <b>{creator.name}</b>
                {typeof creator.pricePerSlot === 'number' && (
                  <span>
                    ${creator.pricePerSlot.toFixed(2)} <span className="muted">/ slot</span>
                  </span>
                )}
              </div>
              {creator.bio && <div className="muted one-line">{creator.bio}</div>}
            </div>
          </div>
        </div>

        <div className="profile-main">
          <div className="col">
            <h3 className="section-title">Available slots</h3>
            <div className="calendar">
              {profileSlots.map((s) => {
                const start = dayjs(s.start);
                const end = dayjs(s.end);
                const label = `${start.format('ddd, MMM D')} · ${start.format('HH:mm')} - ${end.format('HH:mm')}`;
                const isAuction = s.mode === 'EnglishAuction';
                return (
                  <div key={s.id} className={`day ${isAuction ? 'slot-auction' : ''}`}>
                    <div className="stack" style={{ gap: 4 }}>
                      <b>{label}</b>
                      <span className="muted">{isAuction ? 'Auction' : 'Fixed price'}</span>
                      <div className="row" style={{ justifyContent: 'space-between' }}>
                        <span className="badge">
                          {isAuction ? `Start ${s.startPrice ?? 0} USDC` : `${s.price ?? creator.pricePerSlot ?? 0} USDC`}
                        </span>
                        <button className="btn btn-outline" style={{ padding: '6px 10px' }}>Reserve</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="col">
            <h3 className="section-title">About</h3>
            <div className="card" style={{ marginBottom: 16 }}>
              <p className="muted" style={{ margin: 0 }}>{creator.bio || 'No bio yet.'}</p>
            </div>

            <h3 className="section-title">Stats</h3>
            <div className="stats">
              <div className="stat">
                <div className="stat-label">Rating</div>
                <div className="stat-value">{typeof creator.rating === 'number' ? creator.rating.toFixed(1) : '—'}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Price / slot</div>
                <div className="stat-value">{typeof creator.pricePerSlot === 'number' ? `$${creator.pricePerSlot}` : '—'}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Slots listed</div>
                <div className="stat-value">{profileSlots.length}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
