import Link from 'next/link';
import Reveal from '@/components/Reveal';
import SlotCard from '@/components/SlotCard';
import { creators, slots } from '@/lib/mock';

type RouteParams = { pubkey: string };
type Params = { params: RouteParams | Promise<RouteParams> };

function isPromise<T>(v: Promise<T> | T): v is Promise<T> {
  return !!v && typeof (v as any).then === 'function';
}

export default async function CreatorProfilePage({ params }: Params) {
  const resolved = isPromise(params) ? await params : params;
  const pubkey = decodeURIComponent(resolved?.pubkey ?? '');
  const creator = creators.find((c) => c.pubkey === pubkey);

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

  const profileSlots = slots.filter((s) => s.creator === pubkey);
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
              <Link href="/#book" className="btn btn-secondary">
                Book time
              </Link>
              <Link href="/#invest" className="btn btn-outline">
                Invest
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
            <div className="calendar" style={{ gap: 14 }}>
              {profileSlots.map((s, idx) => (
                <Reveal key={s.id} as="div" style={{ transitionDelay: `${idx * 60}ms` }}>
                  <SlotCard slot={s} fallbackPrice={creator.pricePerSlot} />
                </Reveal>
              ))}
            </div>
          </Reveal>

          <Reveal className="col" as="div" delay={120}>
            <h3 className="section-title">About</h3>
            <div className="card" style={{ marginBottom: 16 }}>
              <p className="muted" style={{ margin: 0 }}>
                {creator.bio || 'No bio yet.'}
              </p>
            </div>
            <h3 className="section-title">Stats</h3>
            <div className="stats">
              <div className="stat">
                <div className="stat-label">Rating</div>
                <div className="stat-value">{typeof creator.rating === 'number' ? creator.rating.toFixed(1) : 'N/A'}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Price / slot</div>
                <div className="stat-value">{typeof creator.pricePerSlot === 'number' ? `$${creator.pricePerSlot}` : 'N/A'}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Slots listed</div>
                <div className="stat-value">{profileSlots.length}</div>
              </div>
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
