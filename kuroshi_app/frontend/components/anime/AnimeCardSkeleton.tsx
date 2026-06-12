'use client'
// components/anime/AnimeCardSkeleton.tsx
export function AnimeCardSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-img skeleton" />
      <div className="skeleton-info">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-sub" />
      </div>

      <style>{`
        .skeleton-card {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .skeleton-img {
          aspect-ratio: 2 / 3;
          border-radius: var(--radius-lg);
          width: 100%;
        }
        .skeleton-info {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          padding: 0 0.125rem;
        }
        .skeleton-title {
          height: 14px;
          border-radius: var(--radius-sm);
          width: 85%;
        }
        .skeleton-sub {
          height: 11px;
          border-radius: var(--radius-sm);
          width: 55%;
        }
      `}</style>
    </div>
  )
}
