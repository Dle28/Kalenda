import Reveal from './Reveal';

type CreatorCardProps = {
  pubkey: string;
  name: string;
  avatar?: string;
  fields: string[];
  rating?: number;
  bio?: string;
  pricePerSlot?: number;
};

export default function CreatorCard(props: CreatorCardProps) {
  const { pubkey, name, avatar, fields, rating, bio, pricePerSlot } = props;
  const displayAvatar = avatar || 'https://placehold.co/96x96?text=User';
  const displayRating = Number.isFinite(Number(rating)) ? Number(rating) : 5.0;
  const fieldList = Array.isArray(fields) ? fields : [];
  const shown = fieldList.slice(0, 3);
  const rest = Math.max(0, fieldList.length - shown.length);
  const safeKey = typeof pubkey === 'string' ? pubkey : '';
  const shortKey = safeKey ? `${safeKey.slice(0, 6)}...${safeKey.slice(-4)}` : 'N/A';

  const isTop = displayRating >= 4.8;

  return (
    <Reveal as="div" className="card creator-card" style={{ transitionDelay: '40ms', position: 'relative', overflow: 'hidden' }}>
      {isTop && (
        <div className="ribbon">TOP</div>
      )}
      <div className="row" style={{ alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <img
            src={displayAvatar}
            alt={name}
            width={48}
            height={48}
            style={{ borderRadius: 999, border: '1px solid rgba(255,255,255,.15)' }}
          />
        </div>
        <div className="stack" style={{ flex: 1, minWidth: 0 }}>
          <b style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</b>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {shown.map((f) => (
              <span key={f} className="badge">
                {f}
              </span>
            ))}
            {rest > 0 && <span className="badge">+{rest} more</span>}
          </div>
        </div>
        <span className="badge" title={`Rating ${displayRating.toFixed(2)} / 5.0`}>
          Rating {displayRating.toFixed(1)}
        </span>
      </div>

      {bio && (
        <p
          className="muted"
          style={{
            marginTop: 8,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as any,
            overflow: 'hidden',
          }}
        >
          {bio}
        </p>
      )}

      <div className="row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
        <span className="muted" style={{ fontSize: 12 }}>
          {shortKey}
        </span>
        <div className="row" style={{ gap: 8 }}>
          {typeof pricePerSlot === 'number' && (
            <span className="badge" title="Estimated price">
              From {pricePerSlot} USDC
            </span>
          )}
          <a href={`/creator/${encodeURIComponent(safeKey)}`} className="btn btn-outline">
            View details
          </a>
        </div>
      </div>

      {typeof pricePerSlot === 'number' && (
        <div style={{ position: 'absolute', right: 12, top: 12 }}>
          <span className="badge" title="Price per slot">${pricePerSlot.toFixed(2)} / min</span>
        </div>
      )}
    </Reveal>
  );
}
