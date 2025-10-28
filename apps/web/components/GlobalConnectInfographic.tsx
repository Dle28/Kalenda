import styles from './GlobalConnectInfographic.module.css';

const hubs = [
  { id: 'tokyo', label: 'Tokyo', detail: 'Asia creator hub', x: 72, y: 38 },
  { id: 'berlin', label: 'Berlin', detail: 'Europe design studios', x: 46, y: 32 },
  { id: 'newyork', label: 'New York', detail: 'North America investors', x: 32, y: 36 },
  { id: 'sydney', label: 'Sydney', detail: 'Oceania animation teams', x: 78, y: 64 },
  { id: 'saoPaulo', label: 'Sao Paulo', detail: 'Latin America storytellers', x: 40, y: 58 },
  { id: 'vietnam', label: 'Vietnam', detail: 'Southeast Asia innovators', x: 66, y: 44 },
];

const size = 600;
const hubLookup = hubs.reduce<Record<string, typeof hubs[number]>>((acc, hub) => {
  acc[hub.id] = hub;
  return acc;
}, {});

const connections: Array<[string, string]> = [
  ['newyork', 'berlin'],
  ['berlin', 'tokyo'],
  ['tokyo', 'vietnam'],
  ['vietnam', 'sydney'],
  ['newyork', 'saoPaulo'],
  ['saoPaulo', 'tokyo'],
];

function makeCurvePath(from: typeof hubs[number], to: typeof hubs[number]) {
  const ax = (from.x / 100) * size;
  const ay = (from.y / 100) * size;
  const bx = (to.x / 100) * size;
  const by = (to.y / 100) * size;
  const dx = bx - ax;
  const dy = by - ay;
  const distance = Math.hypot(dx, dy) || 1;
  const midX = (ax + bx) / 2;
  const midY = (ay + by) / 2;
  const normalX = (-dy / distance) * (distance * 0.25);
  const normalY = (dx / distance) * (distance * 0.25);
  const controlX = midX + normalX;
  const controlY = midY + normalY;
  return `M${ax.toFixed(2)} ${ay.toFixed(2)} Q ${controlX.toFixed(2)} ${controlY.toFixed(2)} ${bx.toFixed(2)} ${by.toFixed(2)}`;
}

export default function GlobalConnectInfographic() {
  return (
    <div className={styles.wrap} aria-label="Global creator network infographic">
      <div className={styles.copy}>
        <span className={styles.kicker}>Creators everywhere</span>
        <h2 className={styles.title}>Connecting talent around the globe</h2>
        <p className={styles.subtitle}>
          A living marketplace that links collectors, investors, and fans with creators across every timezone.
        </p>
      </div>
      <div className={styles.globeArea}>
        <div className={styles.rotatingLayer}>
          <div className={styles.globeCanvas}>
          <svg className={styles.globe} viewBox="0 0 600 600" role="presentation" aria-hidden="true">
            <defs>
              <radialGradient id="globeGradient" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="rgba(59,130,246,0.6)" />
                <stop offset="65%" stopColor="rgba(30,64,175,0.45)" />
                <stop offset="100%" stopColor="rgba(15,23,42,0.85)" />
              </radialGradient>
              <linearGradient id="meridian" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(148,163,184,0.05)" />
                <stop offset="100%" stopColor="rgba(148,163,184,0.35)" />
              </linearGradient>
              <linearGradient id="arc" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(236,72,153,0.1)" />
                <stop offset="50%" stopColor="rgba(236,72,153,0.45)" />
                <stop offset="100%" stopColor="rgba(96,165,250,0.45)" />
              </linearGradient>
            </defs>

            <circle cx="300" cy="300" r="240" fill="url(#globeGradient)" stroke="rgba(148,163,184,0.25)" strokeWidth="1.5" />

            <ellipse cx="300" cy="300" rx="220" ry="160" fill="none" stroke="url(#meridian)" strokeWidth="1.2" />
            <ellipse cx="300" cy="300" rx="220" ry="110" fill="none" stroke="url(#meridian)" strokeWidth="1" />
            <ellipse cx="300" cy="300" rx="220" ry="70" fill="none" stroke="url(#meridian)" strokeWidth="0.9" />

            <path d="M300 60 C 440 120 440 480 300 540" fill="none" stroke="url(#meridian)" strokeWidth="1.2" />
            <path d="M300 60 C 160 120 160 480 300 540" fill="none" stroke="url(#meridian)" strokeWidth="1.2" />

            {connections.map(([fromId, toId], idx) => {
              const from = hubLookup[fromId];
              const to = hubLookup[toId];
              if (!from || !to) return null;
              const path = makeCurvePath(from, to);
              const width = 1.2 + (idx % 3) * 0.3;
              return (
                <path
                  key={`${fromId}-${toId}`}
                  d={path}
                  fill="none"
                  stroke="url(#arc)"
                  strokeWidth={width}
                  strokeLinecap="round"
                  opacity={0.8}
                />
              );
            })}
          </svg>
        </div>
          {hubs.map((hub, index) => (
            <div
              key={hub.id}
              className={styles.point}
              style={{ left: `${hub.x}%`, top: `${hub.y}%`, ['--point-delay' as any]: `${index * 1.2}s` }}
            >
              <div className={styles.pointInner}>
                <span className={styles.ripple} />
                <span className={styles.pulse} />
                <span className={styles.pointLabel}>{hub.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
