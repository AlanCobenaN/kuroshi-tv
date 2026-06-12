'use client'
// app/anime/loading.tsx
import { AnimeCardSkeleton } from '@/components/anime/AnimeCardSkeleton'

export default function CatalogLoading() {
  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div className="skeleton" style={{ height: 28, width: 220, borderRadius: 8, marginBottom: '1.5rem' }} />

      <div className="loading-layout">
        {/* Sidebar skeleton */}
        <div className="loading-sidebar">
          <div className="skeleton" style={{ height: 500, borderRadius: 12 }} />
        </div>

        {/* Grid skeleton */}
        <div className="loading-grid">
          {Array.from({ length: 20 }).map((_, i) => (
            <AnimeCardSkeleton key={i} />
          ))}
        </div>
      </div>

      <style>{`
        .loading-layout {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 2rem;
        }
        .loading-sidebar {}
        .loading-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1rem;
        }
        @media (max-width: 900px) {
          .loading-layout { grid-template-columns: 1fr; }
          .loading-sidebar { display: none; }
          .loading-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 600px) {
          .loading-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  )
}
