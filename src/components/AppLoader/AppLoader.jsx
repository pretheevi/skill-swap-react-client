import './AppLoader.css';

// Instagram-style skeleton loader shown while verifying token
function AppLoader() {
  return (
    <div className="apl-wrapper">

      {/* sidebar skeleton - desktop only */}
      <aside className="apl-sidebar">
        <div className="apl-logo-row">
          <div className="apl-sk apl-sk-circle" style={{ width: 32, height: 32 }} />
          <div className="apl-sk apl-sk-line" style={{ width: 90, height: 16 }} />
        </div>

        <div className="apl-profile-block">
          <div className="apl-sk apl-sk-circle" style={{ width: 72, height: 72 }} />
          <div className="apl-sk apl-sk-line" style={{ width: 100, height: 14, marginTop: 10 }} />
          <div className="apl-sk apl-sk-line" style={{ width: 70, height: 10, marginTop: 6 }} />
          <div className="apl-stat-row">
            {[1,2,3].map(i => (
              <div key={i} className="apl-stat-col">
                <div className="apl-sk apl-sk-line" style={{ width: 28, height: 14 }} />
                <div className="apl-sk apl-sk-line" style={{ width: 40, height: 10, marginTop: 4 }} />
              </div>
            ))}
          </div>
        </div>

        <div className="apl-nav-block">
          {[1,2,3,4].map(i => (
            <div key={i} className="apl-nav-item">
              <div className="apl-sk apl-sk-circle" style={{ width: 20, height: 20 }} />
              <div className="apl-sk apl-sk-line" style={{ width: 70, height: 13 }} />
            </div>
          ))}
        </div>
      </aside>

      {/* main feed skeleton */}
      <main className="apl-main">

        {/* header bar */}
        <div className="apl-header">
          <div className="apl-sk apl-sk-line" style={{ width: 120, height: 14 }} />
          <div className="apl-sk apl-sk-pill" style={{ width: 100, height: 32 }} />
        </div>

        {/* masonry cards */}
        <div className="apl-masonry">
          {[280, 380, 320, 420, 300, 360, 310, 400, 270, 340].map((h, i) => (
            <div key={i} className="apl-card" style={{ '--card-h': `${h}px` }}>
              {/* card header */}
              <div className="apl-card-header">
                <div className="apl-sk apl-sk-circle" style={{ width: 36, height: 36 }} />
                <div className="apl-card-header-lines">
                  <div className="apl-sk apl-sk-line" style={{ width: 80, height: 12 }} />
                  <div className="apl-sk apl-sk-line" style={{ width: 55, height: 10, marginTop: 5 }} />
                </div>
              </div>
              {/* image block */}
              <div className="apl-sk apl-card-media" />
              {/* footer */}
              <div className="apl-card-footer">
                <div className="apl-sk apl-sk-line" style={{ width: '60%', height: 11 }} />
                <div className="apl-sk apl-sk-line" style={{ width: '40%', height: 10, marginTop: 6 }} />
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* mobile bottom nav skeleton */}
      <div className="apl-mobile-nav">
        {[1,2,3].map(i => (
          <div key={i} className="apl-sk apl-sk-circle" style={{ width: 26, height: 26 }} />
        ))}
      </div>

    </div>
  );
}

export default AppLoader;