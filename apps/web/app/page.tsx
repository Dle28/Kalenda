import Link from 'next/link';
import { creators } from '@/lib/mock';
import styles from './home.module.css';
import FloatingBadges from '@/components/FloatingBadges';

export default function Page() {
  const featured = creators.slice(0, 4);
  const leftItems = featured.filter((_, i) => i % 2 === 0);
  const rightItems = featured.filter((_, i) => i % 2 === 1);
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
            {/* Left scrolling column */}
            <div className={`${styles.col} ${styles.colLeft}`}>
              <div className={styles.track}>
                {[0, 1].map((dup) => (
                  leftItems.map((c, idx) => (
                    <div key={`L-${dup}-${idx}-${c.pubkey}`} className={styles.tile}>
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
                  ))
                ))}
              </div>
            </div>

            {/* Right scrolling column (staggered) */}
            <div className={`${styles.col} ${styles.colRight}`}>
              <div className={styles.track}>
                {[0, 1].map((dup) => (
                  rightItems.map((c, idx) => (
                    <div key={`R-${dup}-${idx}-${c.pubkey}`} className={styles.tile}>
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
                  ))
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <FloatingBadges />
    </section>
  );
}
