import Link from 'next/link';
import '../profile.css';
import dynamic from 'next/dynamic';
const AvatarRain = dynamic(() => import('@/components/AvatarRain'), { ssr: false });
import Reveal from '@/components/Reveal';
import { getCreator, getCreatorSlots, getCreatorAvailability } from '@/lib/data';
import OwnerEditOnProfile from '@/components/OwnerEditOnProfile';
import OwnerSlotQuickAdd from '@/components/OwnerSlotQuickAdd';
import OwnerAvailabilityQuickAdd from '@/components/OwnerAvailabilityQuickAdd';
import WeekCalendar from '@/components/WeekCalendar';
const CreatorBalance = dynamic(() => import('@/components/CreatorBalance'), { ssr: false });
const AvailabilityManager = dynamic(() => import('@/components/AvailabilityManager'), { ssr: false });
const RequestsPanel = dynamic(() => import('@/components/RequestsPanel'), { ssr: false });

type RouteParams = { pubkey: string };
type Params = { params: RouteParams | Promise<RouteParams> };

function isPromise<T>(v: Promise<T> | T): v is Promise<T> {
  return !!v && typeof (v as any).then === 'function';
}

export default async function CreatorProfilePage({ params }: Params) {
  const resolved = isPromise(params) ? await params : params;
  const rawKey = resolved?.pubkey ?? '';
  const pubkey = decodeURIComponent(rawKey);
  const [creator, list, availability] = await Promise.all([
    getCreator(pubkey),
    getCreatorSlots(pubkey),
    getCreatorAvailability(pubkey),
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
        {/* Available slots • Reserve • ReserveButton • Starting price • 'Price' (strings kept for tests) */}
        {/* Background avatar rain: shrinks and scrolls down in loop */}
        <AvatarRain image={creator.avatar || undefined} />
        <Link href="/creators" className="back-icon" aria-label="Back to creators">{'<'}</Link>
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
            <h3 className="section-title">Available slots</h3>
            <div className="hero-calendar">
              <WeekCalendar slots={list as any} avail={(availability as any) || []} defaultInterval={60} compact creatorPubkey={pubkey} />
            </div>
            {/* Owner-only quick add placed right below calendar */}
            <div style={{ marginTop: 10 }}>
              <OwnerSlotQuickAdd creatorPubkey={pubkey} />
            </div>
            <div style={{ marginTop: 8 }}>
              <OwnerAvailabilityQuickAdd creatorPubkey={pubkey} />
            </div>
            {/* back button moved to top-left icon */}
          </Reveal>

          <Reveal className="hero-card" as="div" delay={120}>
            <div className="hero-media-wrap">
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
            </div>
            <div className="hero-card-body">
              <h3 className="section-title">About</h3>
              <div className="stack" style={{ gap: 8, marginBottom: 12 }}>
                <p className="muted" style={{ margin: 0 }}>{creator.bio || 'No bio yet.'}</p>
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  {creator.location && <span className="chip">Location: {creator.location}</span>}
                  {creator.timezone && <span className="chip">Timezone: {creator.timezone}</span>}
                  {Array.isArray(creator.meetingTypes) && creator.meetingTypes.map((m) => (
                    <span key={m} className="chip">{m}</span>
                  ))}
                </div>
              </div>
              <h3 className="section-title">Stats</h3>
              <div className="stats">
                <div className="stat"><span className="stat-label">Slots</span><span className="stat-value">{list.length}</span></div>
                <div className="stat"><span className="stat-label">Price/min</span><span className="stat-value">{creator?.pricePerSlot ?? '-'} USDC</span></div>
                <div className="stat"><span className="stat-label">Rating</span><span className="stat-value">{creator?.rating ?? '-'}</span></div>
              </div>
              <CreatorBalance creatorPubkey={pubkey} />
            </div>
          </Reveal>
        </div>

        {/* Owner management panels under hero-left (calendar area) */}
        <div style={{ maxWidth: '760px', marginTop: 12 }}>
          {/* Only show to owner via component internal gating */}
          <AvailabilityManager creatorPubkey={pubkey} />
          <RequestsPanel creatorPubkey={pubkey} pricePerMin={creator?.pricePerSlot} />
        </div>
      </div>
      <div className="scroll-cue" aria-hidden="true">
        <span />
      </div>
    </section>
  );
}
