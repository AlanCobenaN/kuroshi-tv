'use client'
// app/anime/[slug]/loading.tsx
export default function AnimeDetailLoading() {
  return (
    <div className="loading-page">
      {/* Banner skeleton */}
      <div className="skeleton loading-banner" />

      <div className="container loading-body">
        <div className="loading-layout">
          {/* Sidebar skeleton */}
          <div className="loading-sidebar">
            <div className="skeleton loading-cover" />
            <div className="skeleton loading-btn" />
            <div className="skeleton loading-btn loading-btn--sm" />
          </div>

          {/* Main skeleton */}
          <div className="loading-main">
            <div className="skeleton loading-title" />
            <div className="skeleton loading-subtitle" />
            <div className="loading-tags">
              {[80, 65, 90, 55].map((w, i) => (
                <div key={i} className="skeleton loading-tag" style={{ width: w }} />
              ))}
            </div>
            <div className="skeleton loading-meta" />
            <div className="skeleton loading-text" />
            <div className="skeleton loading-text loading-text--sm" />
            <div className="skeleton loading-text" />
          </div>
        </div>
      </div>

      <style>{`
        .loading-page { min-height: 100dvh; }

        .loading-banner {
          height: 320px;
          margin-top: calc(var(--total-nav) * -1);
          border-radius: 0;
        }

        .loading-body {
          padding-top: 2rem;
          padding-bottom: 4rem;
        }

        .loading-layout {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 2.5rem;
        }

        .loading-sidebar {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: -100px;
        }

        .loading-cover {
          aspect-ratio: 2 / 3;
          border-radius: var(--radius-lg);
        }
        .loading-btn {
          height: 40px;
          border-radius: var(--radius-md);
        }
        .loading-btn--sm { height: 36px; }

        .loading-main {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-top: 1rem;
        }

        .loading-title {
          height: 36px;
          width: 60%;
          border-radius: var(--radius-md);
        }
        .loading-subtitle {
          height: 18px;
          width: 40%;
          border-radius: var(--radius-sm);
        }
        .loading-tags {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .loading-tag {
          height: 28px;
          border-radius: var(--radius-full);
        }
        .loading-meta {
          height: 80px;
          border-radius: var(--radius-lg);
        }
        .loading-text {
          height: 16px;
          width: 100%;
          border-radius: var(--radius-sm);
        }
        .loading-text--sm { width: 75%; }

        @media (max-width: 768px) {
          .loading-layout { grid-template-columns: 1fr; }
          .loading-sidebar { margin-top: 0; max-width: 180px; margin-inline: auto; }
        }
      `}</style>
    </div>
  )
}
