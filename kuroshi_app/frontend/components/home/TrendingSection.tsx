'use client'
// components/home/TrendingSection.tsx
import Link from 'next/link'
import Image from 'next/image'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { AnimeSummary } from '@/types'

interface Props {
  animes: AnimeSummary[]
}

export function TrendingSection({ animes }: Props) {
  const top = animes.slice(0, 10)

  return (
    <div>
      <SectionHeader
        title="Tendencias de la semana"
        subtitle="Los más vistos por la comunidad"
        href="/anime?order=weekly"
        hrefLabel="Ver ranking"
      />

      <ol className="trending-list" role="list">
        {top.map((anime, index) => (
          <li key={anime.id} className="trending-item">
            <Link href={`/anime/${anime.slug}`} className="trending-card" aria-label={`${index + 1}. ${anime.title_es}`}>
              {/* Numeral editorial */}
              <span className="trending-rank" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>

              {/* Cover */}
              <div className="trending-img-wrapper">
                <Image
                  src={anime.cover_url}
                  alt={anime.title_es}
                  fill
                  sizes="56px"
                  className="trending-img"
                />
              </div>

              {/* Info */}
              <div className="trending-info">
                <h3 className="trending-title">{anime.title_es}</h3>
                <div className="trending-meta">
                  {anime.genres?.slice(0, 2).map((g, i) => (
                    <span key={typeof g === 'string' ? g : g.id} className="trending-genre">{typeof g === 'string' ? g : g.name}</span>
                  ))}
                </div>
              </div>

              {/* Rating + flecha */}
              <div className="trending-right">
                {anime.mal_rating && (
                  <span className="trending-rating">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {anime.mal_rating.toFixed(1)}
                  </span>
                )}
                <svg className="trending-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Separador sutil */}
            {index < top.length - 1 && <div className="trending-divider" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      <style>{`
        .trending-list {
          list-style: none;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          overflow: hidden;
        }

        .trending-item { position: relative; }

        .trending-card {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.875rem 1rem;
          text-decoration: none;
          transition: background var(--transition-fast);
          position: relative;
        }
        .trending-card:hover { background: var(--bg-elevated); }
        .trending-card:hover .trending-arrow { color: var(--accent); transform: translateX(3px); }
        .trending-card:hover .trending-img { transform: scale(1.08); }

        /* Numeral gigante — elemento diferenciador */
        .trending-rank {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 800;
          color: var(--bg-overlay);
          letter-spacing: -0.04em;
          line-height: 1;
          min-width: 2.5rem;
          text-align: right;
          flex-shrink: 0;
          /* Top 3 con acento */
        }

        /* Top 3 con color especial */
        .trending-item:nth-child(1) .trending-rank { color: var(--accent); opacity: 0.6; }
        .trending-item:nth-child(2) .trending-rank { color: var(--amber); opacity: 0.5; }
        .trending-item:nth-child(3) .trending-rank { color: var(--text-secondary); opacity: 0.5; }

        /* Cover cuadrado pequeño */
        .trending-img-wrapper {
          position: relative;
          width: 48px;
          height: 64px;
          border-radius: var(--radius-md);
          overflow: hidden;
          flex-shrink: 0;
          background: var(--bg-elevated);
        }
        .trending-img {
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .trending-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .trending-title {
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.3;
        }

        .trending-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .trending-genre {
          font-size: 0.625rem;
          font-family: var(--font-display);
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .trending-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .trending-rating {
          display: flex;
          align-items: center;
          gap: 0.2rem;
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--amber);
        }

        .trending-arrow {
          color: var(--text-muted);
          transition: color var(--transition-fast), transform var(--transition-fast);
        }

        .trending-divider {
          height: 1px;
          background: var(--border);
          margin: 0 1rem;
        }

        /* Grid de 2 columnas — separador vertical entre ellas */
        .trending-list {
          position: relative;
        }
        /* Items pares: borde izquierdo */
        .trending-item:nth-child(even) .trending-card {
          border-left: 1px solid var(--border);
        }
        /* Items de la primera mitad: borde inferior */
        .trending-item:nth-child(-n+10):not(:nth-last-child(-n+2)) {
          border-bottom: 1px solid var(--border);
        }

        @media (max-width: 768px) {
          .trending-list { grid-template-columns: 1fr; }
          .trending-item:nth-child(even) .trending-card { border-left: none; }
          .trending-item { border-bottom: 1px solid var(--border); }
          .trending-item:last-child { border-bottom: none; }
          .trending-divider { display: none; }
        }
      `}</style>
    </div>
  )
}
