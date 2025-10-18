import Link from 'next/link';
import { creators } from '@/lib/mock';
import styles from './home.module.css';

export default function Page() {
  const featured = creators.slice(0, 4);
  return (
    <section className={styles.wrap}>
      <div className="container">
        <div className={styles.hero}>
          <div className={styles.left}>
            <h1 className={styles.heading}>TIME IS MONEY.</h1>
            <p className={styles.sub}>
              Get instant access to and invest in your favorite creators & experts.
            </p>
            <div className="cta">
              <Link className="btn btn-secondary" href="/creators">Explore creators</Link>
              <Link className="btn btn-outline" href="/creator/onboard">Get paid for your time</Link>
            </div>
          </div>

          <div className={styles.right}>
            {featured.map((c) => (
              <div key={c.pubkey} className={styles.tile}>
                <div
                  className={styles.media}
                  style={{ backgroundImage: `url(${c.avatar || 'https://placehold.co/600x800'})` }}
                />
                <div className={styles.overlay}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <b>{c.name}</b>
                    {typeof c.pricePerSlot === 'number' && (
                      <span>
                        ${c.pricePerSlot.toFixed(2)} <span className="muted">/ min</span>
                      </span>
                    )}
                  </div>
                  {c.bio && (
                    <div className="muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.bio}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

