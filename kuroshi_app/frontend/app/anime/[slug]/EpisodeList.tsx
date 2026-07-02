'use client'
// app/anime/[slug]/EpisodeList.tsx
import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Season, Episode, UserProgress } from '@/types'

interface Props {
  animeSlug: string
  seasons: Season[]
  initialEpisodes: Episode[]
  userProgress?: UserProgress
}

export function EpisodeList({ animeSlug, seasons, initialEpisodes, userProgress }: Props) {
  const [activeSeason, setActiveSeason] = useState<string>(
    seasons[0]?.id ?? 'all'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [orderAsc, setOrderAsc] = useState(true)

  const episodes = useMemo(() => {
    let list = activeSeason === 'all'
      ? initialEpisodes
      : initialEpisodes.filter(ep => ep.season_id === activeSeason)

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(ep =>
        ep.number.toString().includes(q) ||
        ep.title?.toLowerCase().includes(q)
      )
    }

    return orderAsc ? list : [...list].reverse()
  }, [activeSeason, initialEpisodes, searchQuery, orderAsc])

  // Agrupar episodios por temporada para el acordeón
  const groupedBySeason = useMemo(() => {
    const groups: { season: any; episodes: any[] }[] = []
    for (const season of seasons) {
      const eps = initialEpisodes.filter(ep => ep.season_id === season.id)
      if (eps.length > 0) {
        groups.push({ season, episodes: orderAsc ? eps : [...eps].reverse() })
      }
    }
    return groups
  }, [seasons, initialEpisodes, orderAsc])

  if (seasons.length === 0 && initialEpisodes.length === 0) {
    return (
      <div className="ep-list-empty">
        <p>No hay episodios disponibles aún.</p>
      </div>
    )
  }

  return (
    <div className="ep-list-wrapper">
      {/* Encabezado */}
      <div className="ep-list-header">
        <h2 className="ep-list-title">Episodios</h2>
        <span className="ep-list-count">{episodes.length} disponibles</span>
      </div>

      {/* Acordeón de temporadas */}
      {seasons.length > 1 && (
        <div className="season-accordion">
          {seasons.map(season => {
            const isActive = activeSeason === season.id
            const seasonLabel = season.type === 'ova'
              ? 'OVAs'
              : season.type === 'especial'
              ? 'Especiales'
              : season.title ?? `Temporada ${season.number}`
            const epCount = initialEpisodes.filter(ep => ep.season_id === season.id).length
            return (
              <div key={season.id} className="season-accordion-item">
                <button
                  onClick={() => setActiveSeason(isActive ? 'all' : season.id)}
                  className={`season-accordion-header ${isActive ? 'season-accordion-header--active' : ''}`}
                  aria-expanded={isActive}
                >
                  <span className="season-accordion-label">{seasonLabel}</span>
                  <span className="season-accordion-count">{epCount} episodios</span>
                  <svg className={`season-accordion-arrow ${isActive ? 'season-accordion-arrow--open' : ''}`}
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Controles */}
      <div className="ep-list-controls">
        <div className="ep-search-wrapper">
          <svg className="ep-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por número o título..."
            className="ep-search-input"
            aria-label="Buscar episodio"
          />
        </div>
        <button
          onClick={() => setOrderAsc(v => !v)}
          className="ep-order-btn"
          aria-label={orderAsc ? 'Orden ascendente — cambiar' : 'Orden descendente — cambiar'}
          title={orderAsc ? 'Del primero al último' : 'Del último al primero'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points={orderAsc ? '19 12 12 19 5 12' : '5 12 12 5 19 12'} />
          </svg>
          {orderAsc ? 'Ascendente' : 'Descendente'}
        </button>
      </div>

      {/* Lista de episodios */}
      {episodes.length === 0 ? (
        <p className="ep-no-results">No se encontraron episodios con ese criterio.</p>
      ) : (
        <ul className="ep-list" role="list">
          {episodes.map(ep => {
            const isWatched = userProgress?.episode?.id === ep.id && userProgress.completed
            const isCurrent = userProgress?.episode?.id === ep.id && !userProgress.completed
            const href = `/anime/${animeSlug}/episodio/${ep.number}`

            return (
              <li key={ep.id} className={`ep-item ${isCurrent ? 'ep-item--current' : ''}`}>
                <Link href={href} className="ep-row" aria-label={`Episodio ${ep.number}${ep.title ? ': ' + ep.title : ''}`}>
                  {/* Thumbnail */}
                  <div className="ep-thumb">
                    {ep.thumbnail_url ? (
                      <Image
                        src={ep.thumbnail_url}
                        alt=""
                        fill
                        sizes="72px"
                        className="ep-thumb-img"
                      />
                    ) : (
                      <div className="ep-thumb-placeholder" aria-hidden="true">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-muted)' }}>
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                    )}
                    {isWatched && (
                      <div className="ep-watched-overlay" aria-label="Visto">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Número + título */}
                  <div className="ep-row-info">
                    <span className="ep-row-num">Episodio {ep.number}</span>
                    {ep.title && <span className="ep-row-title">{ep.title}</span>}
                    <span className="ep-row-meta">
                      {ep.air_date && (
                        <span className="ep-row-date">
                          {new Date(ep.air_date).toLocaleDateString('es-LA', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                      )}
                      {ep.views !== undefined && ep.views > 0 && (
                        <span className="ep-row-views">{Number(ep.views).toLocaleString('es')} vistas</span>
                      )}
                    </span>
                  </div>

                  {/* Indicador de progreso o play */}
                  <div className="ep-row-right">
                    {isCurrent && (
                      <span className="ep-progress-badge">
                        {Math.round((userProgress!.last_minute / 1) * 100)}% visto
                      </span>
                    )}
                    <div className={`ep-play-icon ${isCurrent ? 'ep-play-icon--current' : ''}`} aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <style>{`
        .ep-list-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .ep-list-empty {
          color: var(--text-muted);
          font-size: 0.875rem;
          padding: 1rem 0;
        }

        .ep-list-header {
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
        }
        .ep-list-title {
          font-family: var(--font-display);
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .ep-list-count {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }

        /* Acordeón de temporadas */
        .season-accordion {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .season-accordion-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.5rem 0.75rem;
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-secondary);
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }
        .season-accordion-header:hover { color: var(--text-primary); border-color: var(--border-hover); }
        .season-accordion-header--active {
          color: var(--text-primary);
          background: var(--bg-overlay);
          border-color: var(--border-hover);
        }
        .season-accordion-label { flex: 1; }
        .season-accordion-count {
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .season-accordion-arrow {
          transition: transform var(--transition-fast);
          flex-shrink: 0;
        }
        .season-accordion-arrow--open { transform: rotate(180deg); }

        /* Controles */
        .ep-list-controls {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .ep-search-wrapper {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }
        .ep-search-icon {
          position: absolute;
          left: 0.75rem;
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .ep-search-input {
          width: 100%;
          padding: 0.5rem 0.75rem 0.5rem 2.25rem;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.875rem;
          outline: none;
          transition: border-color var(--transition-fast);
          -webkit-appearance: none;
        }
        .ep-search-input::placeholder { color: var(--text-muted); }
        .ep-search-input:focus { border-color: var(--border-focus); }
        .ep-search-input::-webkit-search-cancel-button { display: none; }

        .ep-order-btn {
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
          cursor: pointer;
          white-space: nowrap;
          transition: all var(--transition-fast);
        }
        .ep-order-btn:hover { color: var(--text-primary); border-color: var(--border-hover); }

        /* Sin resultados */
        .ep-no-results {
          text-align: center;
          color: var(--text-muted);
          font-size: 0.875rem;
          padding: 2rem 0;
          margin: 0;
        }

        /* Lista */
        .ep-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          overflow: hidden;
          background: var(--bg-surface);
        }

        .ep-item { border-bottom: 1px solid var(--border); }
        .ep-item:last-child { border-bottom: none; }
        .ep-item--current { background: rgba(230, 57, 70, 0.04); }

        .ep-row {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.75rem 1rem;
          text-decoration: none;
          transition: background var(--transition-fast);
        }
        .ep-row:hover { background: var(--bg-elevated); }
        .ep-row:hover .ep-play-icon { color: var(--accent); }

        /* Thumbnail */
        .ep-thumb {
          position: relative;
          width: 80px;
          height: 50px;
          border-radius: var(--radius-md);
          overflow: hidden;
          flex-shrink: 0;
          background: var(--bg-elevated);
        }
        .ep-thumb-img { object-fit: cover; }
        .ep-thumb-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ep-watched-overlay {
          position: absolute;
          inset: 0;
          background: rgba(74, 222, 128, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Info */
        .ep-row-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        .ep-row-num {
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .ep-row-title {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ep-row-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .ep-row-date {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .ep-row-views {
          font-size: 0.6875rem;
          color: var(--text-muted);
        }

        /* Derecha */
        .ep-row-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }
        .ep-progress-badge {
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--accent);
          background: var(--accent-glow);
          border-radius: var(--radius-full);
          padding: 0.15rem 0.5rem;
        }
        .ep-play-icon {
          color: var(--text-muted);
          transition: color var(--transition-fast);
        }
        .ep-play-icon--current { color: var(--accent); }

        @media (max-width: 640px) {
          .ep-row { padding: 0.625rem 0.75rem; gap: 0.625rem; }
          .ep-thumb { width: 64px; height: 40px; }
          .ep-row-num { font-size: 0.75rem; }
          .ep-row-title { font-size: 0.75rem; }
          .ep-list-controls { flex-direction: column; gap: 0.5rem; }
          .ep-search-wrapper { width: 100%; }
          .ep-order-btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  )
}
