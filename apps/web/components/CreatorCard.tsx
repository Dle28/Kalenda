import Reveal from './Reveal';
import type { SaleSummary } from '@/lib/slotSummary';

type CreatorCardProps = {
  pubkey: string;
  name: string;
  avatar?: string;
  fields: string[];
  rating?: number;
  bio?: string;
  saleSummary?: SaleSummary | null;
};

export default function CreatorCard(props: CreatorCardProps) {
  const { pubkey, name, avatar, fields, rating, bio, saleSummary } = props;
  const displayAvatar = avatar || 'https://placehold.co/600x600?text=Creator';
  const displayRating = Number.isFinite(Number(rating)) ? Number(rating) : 5.0;
  const fieldList = Array.isArray(fields) ? fields : [];
  const shown = fieldList.slice(0, 3);
  const rest = Math.max(0, fieldList.length - shown.length);
  const safeKey = typeof pubkey === 'string' ? pubkey : '';
  const shortKey = safeKey ? `${safeKey.slice(0, 6)}...${safeKey.slice(-4)}` : 'N/A';
  const isTop = displayRating >= 4.8;
  const headline = saleSummary?.headline || 'Scheduling soon';
  const window = saleSummary?.window;

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

        <div className="stack" style={{ gap: 2, marginTop: 4 }}>
          <span className="muted" style={{ fontSize: 13 }}>{headline}</span>
          {window && <span className="muted" style={{ fontSize: 12 }}>{window}</span>}
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

