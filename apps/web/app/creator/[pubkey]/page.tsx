import Link from 'next/link';
import '../profile.css';
import AvatarRain from '@/components/AvatarRain';
import Reveal from '@/components/Reveal';
import { getCreator, getCreatorSlots } from '@/lib/data';
import OwnerEditOnProfile from '@/components/OwnerEditOnProfile';
import OwnerSlotQuickAdd from '@/components/OwnerSlotQuickAdd';
import WeekCalendar from '@/components/WeekCalendar';

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
    <section className="profile-wrap page-enter" style={{ position: 'relative' }}>
      <div className="container">
        {/* Background avatar rain: shrinks and scrolls down in loop */}
        <AvatarRain image={creator.avatar || undefined} />
        <Link href="/creators" className="back-icon" aria-label="Back to creators">←</Link>
        <OwnerEditOnProfile pubkey={pubkey} />
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
            {/* Compact calendar next to large hero card */}
            <div className="hero-calendar">
              <WeekCalendar slots={list as any} defaultInterval={60} compact creatorPubkey={pubkey} />
            </div>
            {/* back button moved to top-left icon */}
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
          {/* Calendar moved into hero-left; keep below for spacing consistency if needed */}

          {/* About + Stats placed right below calendar (right column) */}
          <Reveal className="col" as="div" style={{ gridColumn: '2', alignSelf: 'start' }}>
            <h3 className="section-title">About</h3>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="stack" style={{ gap: 8 }}>
                <p className="muted" style={{ margin: 0 }}>{creator.bio || 'No bio yet.'}</p>
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  {creator.location && <span className="chip">Location: {creator.location}</span>}
                  {creator.timezone && <span className="chip">Timezone: {creator.timezone}</span>}
                  {Array.isArray(creator.meetingTypes) && creator.meetingTypes.map((m) => (
                    <span key={m} className="chip">{m}</span>
                  ))}
                </div>
              </div>
            </div>
            <h3 className="section-title">Stats</h3>
            <div className="stats">
              <div className="stat"><span className="stat-label">Slots</span><span className="stat-value">{list.length}</span></div>
              <div className="stat"><span className="stat-label">Price/min</span><span className="stat-value">{creator?.pricePerSlot ?? '-'} USDC</span></div>
              <div className="stat"><span className="stat-label">Rating</span><span className="stat-value">{creator?.rating ?? '-'}</span></div>
            </div>
          </Reveal>

          {/* Owner-only quick add (no public available-slots list) */}
          <Reveal as="div" className="col">
            <OwnerSlotQuickAdd creatorPubkey={pubkey} />
          </Reveal>
        </div>
      </div>
      <div className="scroll-cue" aria-hidden="true">
        <span />
      </div>
    </section>
  );
}
