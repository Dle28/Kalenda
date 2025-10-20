import Reveal from './Reveal';

type CreatorCardProps = {
  pubkey: string;
  name: string;
  avatar?: string;
  fields: string[];
  rating?: number;
  bio?: string;
  pricePerSlot?: number;
  trend?: number;
};

export default function CreatorCard(props: CreatorCardProps) {
  const { pubkey, name, avatar, fields, rating, bio, pricePerSlot, trend } = props;
  const displayAvatar = avatar || 'https://placehold.co/600x600?text=Creator';
  const displayRating = Number.isFinite(Number(rating)) ? Number(rating) : 5.0;
  const fieldList = Array.isArray(fields) ? fields : [];
  const shown = fieldList.slice(0, 3);
  const rest = Math.max(0, fieldList.length - shown.length);
  const safeKey = typeof pubkey === 'string' ? pubkey : '';
  const shortKey = safeKey ? `${safeKey.slice(0, 6)}...${safeKey.slice(-4)}` : 'N/A';
  const isTop = displayRating >= 4.8;
  const stableTrend = (() => {
    if (typeof trend === 'number') return trend;
    let h = 0;
    for (let i = 0; i < safeKey.length; i++) h = (h * 31 + safeKey.charCodeAt(i)) >>> 0;
    return Number(((h % 300) / 100).toFixed(2)); // 0.00 -> 2.99
  })();

  return (
    <Reveal as="div" className="card creator-card" style={{ transitionDelay: '40ms', position: 'relative', overflow: 'hidden' }}>
      <a href={`/creator/${encodeURIComponent(safeKey)}`} className="stretched-link" aria-label={`Open ${name} profile`}></a>

      <div className="tile-top">
        <div className="creator-media" style={{ backgroundImage: `url(${displayAvatar})` }} />
        {isTop && <div className="pill pill-pink">Top Expert</div>}
      </div>

      <div className="stack" style={{ gap: 8, marginTop: 10 }}>
        <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: 8, minWidth: 0 }}>
            <b className="creator-name one-line">{name}</b>
            <span className="verified-badge">Verified</span>
          </div>
          <span className="badge" title={`Rating ${displayRating.toFixed(2)} / 5.0`}>Rating {displayRating.toFixed(1)}</span>
        </div>

        {bio && (
          <p className="muted" style={{ margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{bio}</p>
        )}

        <div className="row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
          {typeof pricePerSlot === 'number' ? (
            <span><b>${pricePerSlot.toFixed(2)}</b> <span className="muted">/ min</span></span>
          ) : (
            <span className="muted">Price on request</span>
          )}
          <span className={stableTrend >= 0 ? 'trend-pos' : 'trend-neg'}>
            {(stableTrend >= 0 ? '+' : '')}{stableTrend.toFixed(2)}%
          </span>
        </div>

        <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          {shown.map((f) => (
            <span key={f} className="chip">{f}</span>
          ))}
          {rest > 0 && <span className="chip">+{rest} more</span>}
          <span className="muted" style={{ marginLeft: 'auto', fontSize: 12 }}>{shortKey}</span>
          <NextAvailableBadge creatorPubkey={safeKey} />
        </div>
      </div>
    </Reveal>
  );
}
import dynamic from 'next/dynamic';
const NextAvailableBadge = dynamic(() => import('./NextAvailableBadge'), { ssr: false });
