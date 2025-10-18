import Link from 'next/link';
import '../profile.css';
import Reveal from '@/components/Reveal';
import { getCreator, getCreatorSlots } from '@/lib/data';
import ReserveButton from '@/components/ReserveButton';

type RouteParams = { pubkey: string };
type Params = { params: RouteParams | Promise<RouteParams> };

function isPromise<T>(v: Promise<T> | T): v is Promise<T> {
  return !!v && typeof (v as any).then === 'function';
}

export default async function CreatorProfilePage({ params }: Params) {
  const resolved = isPromise(params) ? await params : params;
  const rawKey = resolved?.pubkey ?? '';
  const pubkey = decodeURIComponent(rawKey);
  const [creator, list] = await Promise.all([
    getCreator(pubkey),
    getCreatorSlots(pubkey),
  ]);

  if (!creator) {
    return (
      <section className="profile-wrap page-enter">
        <div className="container">
          <p className="muted">Creator not found.</p>
          <Link href="/creators" className="btn btn-outline" style={{ marginTop: 12 }}>
            Back to creators
          </Link>
        </div>
      </section>
    );
  }

  const shortKey = `${pubkey.slice(0, 6)}...${pubkey.slice(-4)}`;

  return (
    <section className="profile-wrap page-enter">
      <div className="container">
        <div className="profile-hero">
          <Reveal className="hero-left" as="div">
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
                    <span className="badge">Rating {creator.rating.toFixed(1)} / 5</span>
                  )}
                </div>
              </div>
            </div>
            {creator.bio && <p className="pf-bio">{creator.bio}</p>}
            <div className="row ctas">
              <Link href="/creators" className="btn btn-outline">
                Back
              </Link>
            </div>
          </Reveal>

          <Reveal className="hero-card" as="div" delay={120}>
            <div
              className="hero-media"
              style={{ backgroundImage: `url(${creator.avatar || 'https://placehold.co/640x640'})` }}
            />
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
          </Reveal>
        </div>

        <div className="profile-main">
          <Reveal className="col" as="div">
            <h3 className="section-title">Available slots</h3>
            <div className="calendar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {list.length === 0 ? (
                <div className="card muted">No slots yet.</div>
              ) : (
                list.map((s, idx) => {
                  const start = new Date(s.start);
                  const end = new Date(s.end);
                  const dur = Math.round((end.getTime() - start.getTime()) / 60000);
                  const label = `${start.toLocaleString()} - ${end.toLocaleTimeString()} (${dur} min)`;
                  const price = s.mode === 'EnglishAuction' ? (s.startPrice ?? 0) : (s.price ?? 0);
                  return (
                    <Reveal key={s.id} as="div" style={{ transitionDelay: `${idx * 60}ms` }}>
                      <div className={`card day ${s.mode === 'EnglishAuction' ? 'slot-auction' : ''}`} style={{ display: 'grid', gap: 8 }}>
                        <b>{s.mode === 'EnglishAuction' ? 'Auction' : 'Fixed price'}</b>
                        <span className="muted">{label}</span>
                        <div className="row" style={{ justifyContent: 'space-between' }}>
                          <span className="muted">{s.mode === 'EnglishAuction' ? 'Starting price' : 'Price'}</span>
                          <b>{price} USDC</b>
                        </div>
                        {s.mode === 'Stable' ? (
                          <ReserveButton slotId={s.id} mode={s.mode} price={s.price} />
                        ) : (
                          <Link href={`/slot/${encodeURIComponent(s.id)}`} className="btn btn-secondary" style={{ padding: '8px 12px' }}>Reserve</Link>
                        )}
                      </div>
                    </Reveal>
                  );
                })
              )}
            </div>
          </Reveal>

          <Reveal className="col" as="div" delay={120}>
            <h3 className="section-title">Stats</h3>
            <div className="stats">
              <div className="stat"><span className="stat-label">Slots</span><span className="stat-value">{list.length}</span></div>
              <div className="stat"><span className="stat-label">Price/min</span><span className="stat-value">{creator?.pricePerSlot ?? '-'} USDC</span></div>
              <div className="stat"><span className="stat-label">Rating</span><span className="stat-value">{creator?.rating ?? '-'}</span></div>
            </div>
          </Reveal>
        </div>
      </div>
      <div className="scroll-cue" aria-hidden="true">
        <span />
      </div>
    </section>
  );
}
