import '../profile.css';

export default function Loading() {
  return (
    <section className="profile-wrap page-enter profile-loading" aria-busy="true">
      <div className="container">
        <div className="skeleton-grid">
          <div className="stack" style={{ gap: 16 }}>
            <div className="row" style={{ gap: 14, alignItems: 'center' }}>
              <div className="skeleton skeleton-avatar" />
              <div className="stack" style={{ gap: 8, flex: 1 }}>
                <div className="skeleton skeleton-title" />
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <div className="skeleton skeleton-chip" />
                  <div className="skeleton skeleton-chip" />
                  <div className="skeleton skeleton-chip" />
                </div>
              </div>
            </div>
            <div className="stack" style={{ gap: 10 }}>
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line" />
            </div>
            <div className="row" style={{ gap: 12 }}>
              <div className="skeleton skeleton-chip" style={{ width: 120 }} />
              <div className="skeleton skeleton-chip" style={{ width: 120 }} />
            </div>
          </div>
          <div className="skeleton skeleton-card" />
        </div>

        <div className="skeleton-calendar">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="skeleton" />
          ))}
        </div>
      </div>
    </section>
  );
}
