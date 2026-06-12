'use client'
// components/episode/EpisodeNavigator.tsx
import Link from 'next/link'
import { Episode } from '@/types'

interface Props {
  animeSlug: string
  currentEpisodeNumber: number
  prevEpisode?: Episode
  nextEpisode?: Episode
  episodes: Episode[]
}

export function EpisodeNavigator({
  animeSlug,
  currentEpisodeNumber,
  prevEpisode,
  nextEpisode,
  episodes,
}: Props) {
  return (
    <div className="ep-nav">
      {/* Anterior / Siguiente */}
      <div className="ep-nav-arrows">
        {prevEpisode ? (
          <Link
            href={`/anime/${animeSlug}/episodio/${prevEpisode.number}`}
            className="ep-nav-btn ep-nav-btn--prev"
            aria-label={`Episodio anterior: ${prevEpisode.number}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Ep {prevEpisode.number}
          </Link>
        ) : (
          <span className="ep-nav-btn ep-nav-btn--disabled" aria-disabled="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Anterior
          </span>
        )}

        <Link
          href={`/anime/${animeSlug}`}
          className="ep-nav-anime-link"
          aria-label="Volver al anime"
        >
          Ver todos los episodios
        </Link>

        {nextEpisode ? (
          <Link
            href={`/anime/${animeSlug}/episodio/${nextEpisode.number}`}
            className="ep-nav-btn ep-nav-btn--next"
            aria-label={`Siguiente episodio: ${nextEpisode.number}`}
          >
            Ep {nextEpisode.number}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <span className="ep-nav-btn ep-nav-btn--disabled" aria-disabled="true">
            Siguiente
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </div>

      {/* Strip horizontal de episodios */}
      {episodes.length > 0 && (
        <div className="ep-strip-wrapper">
          <div className="ep-strip" role="list" aria-label="Episodios del anime">
            {episodes.map(ep => (
              <Link
                key={ep.id}
                href={`/anime/${animeSlug}/episodio/${ep.number}`}
                role="listitem"
                className={`ep-strip-item ${ep.number === currentEpisodeNumber ? 'ep-strip-item--active' : ''}`}
                aria-current={ep.number === currentEpisodeNumber ? 'page' : undefined}
                aria-label={`Episodio ${ep.number}${ep.title ? ': ' + ep.title : ''}`}
              >
                {ep.number}
              </Link>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .ep-nav {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .ep-nav-arrows {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .ep-nav-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.875rem;
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          text-decoration: none;
          transition: all var(--transition-fast);
        }
        .ep-nav-btn:not(.ep-nav-btn--disabled):hover {
          color: var(--text-primary);
          border-color: var(--border-hover);
          background: var(--bg-elevated);
        }
        .ep-nav-btn--disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .ep-nav-anime-link {
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--accent);
          text-decoration: none;
          transition: opacity var(--transition-fast);
        }
        .ep-nav-anime-link:hover { opacity: 0.75; }

        /* Strip de episodios */
        .ep-strip-wrapper {
          overflow-x: auto;
          scrollbar-width: none;
        }
        .ep-strip-wrapper::-webkit-scrollbar { display: none; }

        .ep-strip {
          display: flex;
          gap: 0.375rem;
          padding: 0.25rem 0;
          min-width: max-content;
        }

        .ep-strip-item {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 32px;
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          text-decoration: none;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }
        .ep-strip-item:hover { color: var(--text-primary); border-color: var(--border-hover); background: var(--bg-elevated); }
        .ep-strip-item--active {
          color: var(--text-primary);
          background: var(--accent);
          border-color: var(--accent);
        }
      `}</style>
    </div>
  )
}
