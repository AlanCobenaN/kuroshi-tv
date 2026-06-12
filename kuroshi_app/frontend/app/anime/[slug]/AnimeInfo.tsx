'use client'
// app/anime/[slug]/AnimeInfo.tsx
import { useState } from 'react'
import { Anime } from '@/types'

interface Props {
  anime: Anime
  isLoggedIn: boolean
}

const STATUS_CONFIG = {
  en_emision:   { label: 'En emisión',   color: '#4ade80' },
  finalizado:   { label: 'Finalizado',   color: 'var(--text-muted)' },
  proximamente: { label: 'Próximamente', color: 'var(--amber)' },
}

export function AnimeInfo({ anime, isLoggedIn }: Props) {
  const [synopsisExpanded, setSynopsisExpanded] = useState(false)
  const synopsis = anime.synopsis ?? ''
  const isLong = synopsis.length > 300
  const displaySynopsis = isLong && !synopsisExpanded
    ? synopsis.slice(0, 300) + '…'
    : synopsis

  const status = STATUS_CONFIG[anime.status] ?? STATUS_CONFIG.finalizado

  return (
    <div className="anime-info">
      {/* Títulos */}
      <div className="anime-info-titles">
        <h1 className="anime-title-es">{anime.title_es}</h1>
        {anime.title_jp && (
          <p className="anime-title-jp">{anime.title_jp}</p>
        )}
      </div>

      {/* Ratings */}
      <div className="anime-ratings-row">
        {anime.mal_rating && (
          <div className="anime-rating-block" title="Rating de MyAnimeList">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ color: 'var(--amber)' }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="rating-score">{anime.mal_rating.toFixed(2)}</span>
            <span className="rating-source">MAL</span>
          </div>
        )}
        {anime.community_rating && (
          <div className="anime-rating-block" title="Rating de la comunidad Kuroshi">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ color: 'var(--accent)' }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="rating-score">{anime.community_rating.toFixed(1)}</span>
            <span className="rating-source">
              Comunidad
              {anime.community_rating_count && (
                <span className="rating-count"> ({anime.community_rating_count.toLocaleString('es')})</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Géneros */}
      {anime.genres && anime.genres.length > 0 && (
        <div className="anime-genres" role="list" aria-label="Géneros">
          {anime.genres.map((g, i) => (
            <a
              key={g?.id ?? i}
              href={`/anime?genre=${(g?.name ?? g).toLowerCase().replace(/ /g, '_')}`}
              className="anime-genre-tag"
              role="listitem"
            >
              {g.name}
            </a>
          ))}
        </div>
      )}

      {/* Metadata en tabla */}
      <dl className="anime-meta-grid">
        <div className="anime-meta-item">
          <dt>Estado</dt>
          <dd style={{ color: status.color }}>{status.label}</dd>
        </div>
        {anime.studio && (
          <div className="anime-meta-item">
            <dt>Estudio</dt>
            <dd>{anime.studio}</dd>
          </div>
        )}
        {anime.year && (
          <div className="anime-meta-item">
            <dt>Año</dt>
            <dd>{anime.year}</dd>
          </div>
        )}
        {anime.season_name && (
          <div className="anime-meta-item">
            <dt>Temporada</dt>
            <dd style={{ textTransform: 'capitalize' }}>{anime.season_name}</dd>
          </div>
        )}
        {anime.total_episodes && (
          <div className="anime-meta-item">
            <dt>Episodios</dt>
            <dd>{anime.total_episodes}</dd>
          </div>
        )}
      </dl>

      {/* Sinopsis */}
      {synopsis && (
        <div className="anime-synopsis-block">
          <h2 className="anime-synopsis-label">Sinopsis</h2>
          <p className="anime-synopsis-text">{displaySynopsis}</p>
          {isLong && (
            <button
              onClick={() => setSynopsisExpanded(v => !v)}
              className="anime-synopsis-toggle"
              aria-expanded={synopsisExpanded}
            >
              {synopsisExpanded ? 'Ver menos ↑' : 'Ver más ↓'}
            </button>
          )}
        </div>
      )}

      <style>{`
        .anime-info {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* Títulos */
        .anime-info-titles { display: flex; flex-direction: column; gap: 0.375rem; }
        .anime-title-es {
          font-family: var(--font-display);
          font-size: clamp(1.625rem, 3.5vw, 2.25rem);
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          line-height: 1.15;
          margin: 0;
        }
        .anime-title-jp {
          font-size: 0.9375rem;
          color: var(--text-muted);
          font-style: italic;
          margin: 0;
        }

        /* Ratings */
        .anime-ratings-row {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
        }
        .anime-rating-block {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        .rating-score {
          font-family: var(--font-display);
          font-size: 1.125rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .rating-source {
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .rating-count { font-weight: 400; }

        /* Géneros */
        .anime-genres {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }
        .anime-genre-tag {
          padding: 0.3rem 0.75rem;
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          color: var(--text-secondary);
          background: var(--bg-overlay);
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          text-decoration: none;
          transition: all var(--transition-fast);
        }
        .anime-genre-tag:hover {
          color: var(--text-primary);
          border-color: var(--border-hover);
          background: var(--bg-hover);
        }

        /* Meta grid */
        .anime-meta-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.875rem 1.5rem;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1rem 1.25rem;
        }
        .anime-meta-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .anime-meta-item dt {
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .anime-meta-item dd {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
          margin: 0;
        }

        /* Sinopsis */
        .anime-synopsis-block { display: flex; flex-direction: column; gap: 0.5rem; }
        .anime-synopsis-label {
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin: 0;
        }
        .anime-synopsis-text {
          font-size: 0.9375rem;
          color: var(--text-secondary);
          line-height: 1.7;
          margin: 0;
        }
        .anime-synopsis-toggle {
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--accent);
          padding: 0;
          transition: opacity var(--transition-fast);
          align-self: flex-start;
        }
        .anime-synopsis-toggle:hover { opacity: 0.75; }

        @media (max-width: 480px) {
          .anime-meta-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  )
}
