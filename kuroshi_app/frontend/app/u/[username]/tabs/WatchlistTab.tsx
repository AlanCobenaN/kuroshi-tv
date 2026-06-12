'use client'
// app/u/[username]/tabs/WatchlistTab.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usersApi } from '@/lib/api'
import { UserWatchlist, WatchStatus } from '@/types'

interface Props {
  username: string
  isOwnProfile: boolean
  accessToken?: string
}

const STATUS_TABS: { id: WatchStatus | 'todo'; label: string; color: string }[] = [
  { id: 'todo',       label: 'Todo',       color: 'var(--text-muted)' },
  { id: 'viendo',     label: 'Viendo',     color: '#4ade80' },
  { id: 'completado', label: 'Completado', color: '#60a5fa' },
  { id: 'pendiente',  label: 'Pendiente',  color: '#94a3b8' },
  { id: 'abandonado', label: 'Abandonado', color: 'var(--accent)' },
]

const STATUS_DOT: Record<WatchStatus, string> = {
  viendo:     '#4ade80',
  completado: '#60a5fa',
  pendiente:  '#94a3b8',
  abandonado: 'var(--accent)',
}

export function WatchlistTab({ username, isOwnProfile, accessToken }: Props) {
  const [watchlist, setWatchlist] = useState<UserWatchlist[]>([])
  const [activeStatus, setActiveStatus] = useState<WatchStatus | 'todo'>('todo')
  const [viewMode, setViewMode]   = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    usersApi.getWatchlist(username, accessToken)
      .then((data: any) => {
        const items: UserWatchlist[] = Array.isArray(data) ? data : data.data ?? []
        setWatchlist(items)
      })
      .catch(() => setWatchlist([]))
      .finally(() => setIsLoading(false))
  }, [username, accessToken])

  const filtered = activeStatus === 'todo'
    ? watchlist
    : watchlist.filter(w => w.status === activeStatus)

  const countByStatus = (s: WatchStatus | 'todo') =>
    s === 'todo' ? watchlist.length : watchlist.filter(w => w.status === s).length

  return (
    <div className="watchlist-tab">
      {/* Resumen numérico */}
      <div className="watchlist-summary">
        {STATUS_TABS.slice(1).map(s => (
          <div key={s.id} className="summary-item">
            <span className="summary-value" style={{ color: s.color }}>
              {countByStatus(s.id as WatchStatus)}
            </span>
            <span className="summary-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Controles */}
      <div className="watchlist-controls">
        <div className="watchlist-status-tabs" role="tablist">
          {STATUS_TABS.map(s => (
            <button
              key={s.id}
              role="tab"
              aria-selected={activeStatus === s.id}
              onClick={() => setActiveStatus(s.id as WatchStatus | 'todo')}
              className={`status-tab ${activeStatus === s.id ? 'status-tab--active' : ''}`}
              style={activeStatus === s.id ? { color: s.color, borderColor: s.color } : {}}
            >
              {s.id !== 'todo' && (
                <span
                  className="status-tab-dot"
                  style={{ background: s.color }}
                  aria-hidden="true"
                />
              )}
              {s.label}
              <span className="status-tab-count">{countByStatus(s.id as WatchStatus | 'todo')}</span>
            </button>
          ))}
        </div>

        <div className="view-toggle" role="group" aria-label="Vista">
          <button
            onClick={() => setViewMode('grid')}
            className={`view-btn ${viewMode === 'grid' ? 'view-btn--active' : ''}`}
            aria-label="Vista en cuadrícula" aria-pressed={viewMode === 'grid'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`view-btn ${viewMode === 'list' ? 'view-btn--active' : ''}`}
            aria-label="Vista en lista" aria-pressed={viewMode === 'list'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Contenido */}
      {isLoading ? (
        <div className="watchlist-loading">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: viewMode === 'grid' ? 180 : 64, borderRadius: 8 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="watchlist-empty">
          <span aria-hidden="true">📺</span>
          <p>{activeStatus === 'todo' ? 'La lista está vacía.' : `No hay anime con estado "${STATUS_TABS.find(s => s.id === activeStatus)?.label}".`}</p>
          {isOwnProfile && (
            <Link href="/anime" className="btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
              Explorar catálogo
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="watchlist-grid stagger">
          {filtered.map((entry, i) => (
            <Link
              key={entry.anime_id}
              href={`/anime/${entry.anime.slug}`}
              className="wl-grid-card animate-fade-in"
              style={{ animationDelay: `${i * 0.04}s` }}
              aria-label={`${entry.anime.title_es} — ${entry.status}`}
            >
              <div className="wl-grid-img">
                <Image src={entry.anime.cover_url} alt={entry.anime.title_es} fill sizes="120px" className="wl-img" />
                <span
                  className="wl-status-dot"
                  style={{ background: STATUS_DOT[entry.status] }}
                  aria-label={entry.status}
                />
              </div>
              <p className="wl-grid-title">{entry.anime.title_es}</p>
              {entry.personal_rating && (
                <p className="wl-grid-rating">
                  {'★'.repeat(entry.personal_rating)}{'☆'.repeat(5 - entry.personal_rating)}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="watchlist-list">
          {filtered.map((entry, i) => (
            <Link
              key={entry.anime_id}
              href={`/anime/${entry.anime.slug}`}
              className="wl-list-row animate-fade-in"
              style={{ animationDelay: `${i * 0.03}s` }}
              aria-label={`${entry.anime.title_es} — ${entry.status}`}
            >
              <div className="wl-list-img">
                <Image src={entry.anime.cover_url} alt="" fill sizes="48px" className="wl-img" aria-hidden="true" />
              </div>
              <div className="wl-list-info">
                <span className="wl-list-title">{entry.anime.title_es}</span>
                {entry.progress && (
                  <div className="wl-list-progress-bar">
                    <div
                      className="wl-list-progress-fill"
                      style={{
                        width: `${Math.min(100, (entry.progress.current_episode / (entry.progress.total_episodes || 1)) * 100)}%`,
                        background: STATUS_DOT[entry.status],
                      }}
                    />
                  </div>
                )}
                <span className="wl-list-eps">
                  {entry.progress ? `${entry.progress.current_episode}/${entry.progress.total_episodes ?? '?'} eps` : entry.status}
                </span>
              </div>
              <div className="wl-list-right">
                <span className="wl-list-status" style={{ color: STATUS_DOT[entry.status] }}>
                  <span className="wl-status-dot" style={{ background: STATUS_DOT[entry.status] }} aria-hidden="true" />
                  {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                </span>
                {entry.personal_rating && (
                  <span className="wl-list-rating" aria-label={`${entry.personal_rating} estrellas`}>
                    {'★'.repeat(entry.personal_rating)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .watchlist-tab { display: flex; flex-direction: column; gap: 1.25rem; }

        /* Resumen */
        .watchlist-summary {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .summary-item { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; }
        .summary-value { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; line-height: 1; }
        .summary-label { font-family: var(--font-display); font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }

        /* Status tabs */
        .watchlist-controls { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
        .watchlist-status-tabs { display: flex; gap: 0.375rem; overflow-x: auto; scrollbar-width: none; }
        .watchlist-status-tabs::-webkit-scrollbar { display: none; }

        .status-tab {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.3rem 0.75rem;
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          cursor: pointer;
          white-space: nowrap;
          transition: all var(--transition-fast);
        }
        .status-tab:hover { color: var(--text-secondary); }
        .status-tab--active { background: var(--bg-overlay); }
        .status-tab-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .status-tab-count { font-weight: 400; opacity: 0.7; }

        /* View toggle */
        .view-toggle { display: flex; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; }
        .view-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.4rem 0.625rem;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .view-btn:hover { color: var(--text-secondary); background: var(--bg-overlay); }
        .view-btn--active { color: var(--text-primary); background: var(--bg-elevated); }

        /* Empty */
        .watchlist-empty { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 3rem 1rem; text-align: center; color: var(--text-muted); }
        .watchlist-empty span { font-size: 2.5rem; }
        .watchlist-empty p { margin: 0; font-size: 0.9375rem; }

        /* Loading */
        .watchlist-loading { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.75rem; }

        /* Grid view */
        .watchlist-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.875rem; }
        .wl-grid-card { display: flex; flex-direction: column; gap: 0.375rem; text-decoration: none; transition: transform var(--transition-normal); }
        .wl-grid-card:hover { transform: translateY(-3px); }
        .wl-grid-img { position: relative; aspect-ratio: 2/3; border-radius: var(--radius-lg); overflow: hidden; background: var(--bg-elevated); }
        .wl-img { object-fit: cover; }
        .wl-status-dot { position: absolute; top: 0.375rem; right: 0.375rem; width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--bg-base); }
        .wl-grid-title { font-family: var(--font-display); font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3; }
        .wl-grid-rating { font-size: 0.625rem; color: var(--amber); letter-spacing: 0.05em; }

        /* List view */
        .watchlist-list { display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: var(--radius-xl); overflow: hidden; background: var(--bg-surface); }
        .wl-list-row { display: flex; align-items: center; gap: 0.875rem; padding: 0.75rem 1rem; text-decoration: none; border-bottom: 1px solid var(--border); transition: background var(--transition-fast); }
        .wl-list-row:last-child { border-bottom: none; }
        .wl-list-row:hover { background: var(--bg-elevated); }
        .wl-list-img { position: relative; width: 40px; height: 56px; border-radius: var(--radius-md); overflow: hidden; background: var(--bg-elevated); flex-shrink: 0; }
        .wl-list-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.3rem; }
        .wl-list-title { font-family: var(--font-display); font-size: 0.875rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .wl-list-progress-bar { height: 3px; background: var(--bg-overlay); border-radius: var(--radius-full); overflow: hidden; }
        .wl-list-progress-fill { height: 100%; border-radius: var(--radius-full); transition: width 0.5s ease; }
        .wl-list-eps { font-size: 0.75rem; color: var(--text-muted); }
        .wl-list-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; flex-shrink: 0; }
        .wl-list-status { display: flex; align-items: center; gap: 0.3rem; font-family: var(--font-display); font-size: 0.75rem; font-weight: 600; }
        .wl-list-rating { font-size: 0.75rem; color: var(--amber); }
      `}</style>
    </div>
  )
}
