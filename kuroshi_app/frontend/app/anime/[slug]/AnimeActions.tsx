'use client'
// app/anime/[slug]/AnimeActions.tsx
import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { Anime, WatchStatus } from '@/types'
import { usersApi, animeApi } from '@/lib/api'

interface Props {
  anime: Anime
  isLoggedIn: boolean
  favoriteAnimeId?: string
}

const WATCH_STATUSES: { value: WatchStatus; label: string; color: string }[] = [
  { value: 'viendo',     label: 'Viendo',     color: '#4ade80' },
  { value: 'completado', label: 'Completado',  color: '#60a5fa' },
  { value: 'pendiente',  label: 'Pendiente',   color: '#94a3b8' },
  { value: 'abandonado', label: 'Abandonado',  color: 'var(--accent)' },
]

export function AnimeActions({ anime, isLoggedIn, favoriteAnimeId }: Props) {
  const { data: session } = useSession()
  const [isPending, startTransition] = useTransition()

  const userEntry  = anime.user_watchlist
  const progress   = anime.user_progress
  const [status, setStatus]       = useState<WatchStatus | null>(userEntry?.status ?? null)
  const [showStatuses, setShowStatuses] = useState(false)
  const [userRating, setUserRating]     = useState<number>(0)
  const [ratingHover, setRatingHover]   = useState<number>(0)

  // Favorito
  const [isFavorite, setIsFavorite] = useState(anime.id === favoriteAnimeId)
  useEffect(() => {
    setIsFavorite(anime.id === favoriteAnimeId)
  }, [anime.id, favoriteAnimeId])

  // Determinar el primer episodio con progreso o el primero
  const continueEpisode = progress
    ? `episodio/${anime.seasons?.[0]?.episodes?.[0]?.number ?? 1}`
    : null

  const handleStatusChange = (newStatus: WatchStatus) => {
    if (!session?.accessToken) return
    setStatus(newStatus)
    setShowStatuses(false)

    startTransition(async () => {
      try {
        if (userEntry) {
          await usersApi.updateWatchlistEntry(anime.id, { status: newStatus }, session.accessToken)
        } else {
          await usersApi.addToWatchlist({ animeId: anime.id, status: newStatus }, session.accessToken)
        }
      } catch {
        setStatus(userEntry?.status ?? null)
      }
    })
  }

  const handleRemove = () => {
    if (!session?.accessToken) return
    setStatus(null)
    startTransition(async () => {
      try {
        await usersApi.removeFromWatchlist(anime.id, session.accessToken)
      } catch {
        setStatus(userEntry?.status ?? null)
      }
    })
  }

  const handleToggleFavorite = () => {
    if (!session?.accessToken) return
    const newFav = !isFavorite
    setIsFavorite(newFav)
    startTransition(async () => {
      try {
        await usersApi.updateMe(
          { favoriteAnimeId: newFav ? anime.id : null },
          session.accessToken
        )
      } catch {
        setIsFavorite(!newFav)
      }
    })
  }

  const handleRate = (stars: number) => {
    if (!session?.accessToken) return
    setUserRating(stars)
    startTransition(async () => {
      try {
        await animeApi.rateAnime(anime.slug, stars, session.accessToken)
      } catch {
        setUserRating(0)
      }
    })
  }

  const currentStatusConfig = WATCH_STATUSES.find(s => s.value === status)

  return (
    <div className="anime-actions">
      {/* Cover */}
      <div className="anime-cover-wrapper">
        <Image
          src={anime.cover_url}
          alt={anime.title_es}
          fill
          sizes="220px"
          className="anime-cover-img"
          priority
        />
      </div>

      {/* Botones de reproducción */}
      <div className="anime-watch-btns">
        {continueEpisode && progress ? (
          <>
            <Link
              href={`/anime/${anime.slug}/${continueEpisode}`}
              className="action-btn action-btn--primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Continuar
            </Link>
            <Link
              href={`/anime/${anime.slug}/episodio/1`}
              className="action-btn action-btn--ghost"
            >
              Desde el inicio
            </Link>
          </>
        ) : (
          <Link
            href={`/anime/${anime.slug}/episodio/1`}
            className="action-btn action-btn--primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Ver desde el inicio
          </Link>
        )}
      </div>

      {/* Mi lista */}
      {isLoggedIn ? (
        <div className="anime-list-section">
          <div className="relative">
            <button
              onClick={() => setShowStatuses(v => !v)}
              disabled={isPending}
              className={`action-btn action-btn--list ${status ? 'action-btn--listed' : ''}`}
              aria-expanded={showStatuses}
              aria-label={status ? `En mi lista: ${currentStatusConfig?.label}` : 'Añadir a mi lista'}
            >
              {status ? (
                <>
                  <span
                    className="status-dot"
                    style={{ background: currentStatusConfig?.color }}
                    aria-hidden="true"
                  />
                  {currentStatusConfig?.label}
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Añadir a mi lista
                </>
              )}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginLeft: 'auto', opacity: 0.5 }}>
                <polyline points={showStatuses ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
              </svg>
            </button>

            {showStatuses && (
              <div className="status-dropdown" role="menu">
                {WATCH_STATUSES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => handleStatusChange(s.value)}
                    className={`status-option ${status === s.value ? 'status-option--active' : ''}`}
                    role="menuitem"
                  >
                    <span className="status-dot" style={{ background: s.color }} aria-hidden="true" />
                    {s.label}
                  </button>
                ))}
                {status && (
                  <>
                    <div className="status-divider" aria-hidden="true" />
                    <button
                      onClick={handleRemove}
                      className="status-option status-option--remove"
                      role="menuitem"
                    >
                      Quitar de mi lista
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <Link href="/login" className="action-btn action-btn--ghost">
          Iniciar sesión para guardar
        </Link>
      )}

      {/* Favorito */}
      {isLoggedIn && (
        <div className="anime-favorite-section">
          <button
            onClick={handleToggleFavorite}
            disabled={isPending}
            className={`action-btn action-btn--favorite ${isFavorite ? 'action-btn--favorited' : ''}`}
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {isFavorite ? 'Favorito' : 'Marcar como favorito'}
          </button>
          {isFavorite && (
            <p className="anime-favorite-hint">Este anime es tu favorito</p>
          )}
        </div>
      )}

      {/* Rating de Kuroshi — solo si está logueado */}
      {isLoggedIn && (
        <div className="anime-rating-section">
          <p className="anime-rating-label">Tu valoración</p>
          <div
            className="anime-stars"
            role="group"
            aria-label="Califica este anime del 1 al 5"
            onMouseLeave={() => setRatingHover(0)}
          >
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => handleRate(star)}
                onMouseEnter={() => setRatingHover(star)}
                className={`star-btn ${star <= (ratingHover || userRating) ? 'star-btn--active' : ''}`}
                aria-label={`${star} estrella${star !== 1 ? 's' : ''}`}
                disabled={isPending}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .anime-actions {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        /* Cover */
        .anime-cover-wrapper {
          position: relative;
          aspect-ratio: 2 / 3;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--bg-elevated);
          box-shadow: var(--shadow-lg);
        }
        .anime-cover-img { object-fit: cover; }

        /* Botones */
        .anime-watch-btns { display: flex; flex-direction: column; gap: 0.5rem; }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.625rem 1rem;
          border-radius: var(--radius-md);
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          text-decoration: none;
          border: none;
          justify-content: center;
          text-align: center;
        }

        .action-btn--primary {
          background: var(--accent);
          color: #fff;
        }
        .action-btn--primary:hover {
          background: var(--accent-dim);
          transform: translateY(-1px);
          box-shadow: var(--shadow-accent);
        }

        .action-btn--ghost {
          background: var(--bg-overlay);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }
        .action-btn--ghost:hover {
          color: var(--text-primary);
          border-color: var(--border-hover);
          background: var(--bg-hover);
        }

        .action-btn--list {
          background: var(--bg-surface);
          color: var(--text-secondary);
          border: 1px solid var(--border);
          justify-content: flex-start;
        }
        .action-btn--list:hover {
          border-color: var(--border-hover);
          background: var(--bg-elevated);
          color: var(--text-primary);
        }
        .action-btn--listed {
          color: var(--text-primary);
        }

        /* Status dot */
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* Dropdown de estados */
        .relative { position: relative; }
        .status-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: var(--bg-elevated);
          border: 1px solid var(--border-hover);
          border-radius: var(--radius-lg);
          overflow: hidden;
          z-index: 20;
          box-shadow: var(--shadow-lg);
          animation: fade-in-fast 0.15s ease;
        }
        .status-option {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          width: 100%;
          padding: 0.625rem 1rem;
          font-family: var(--font-body);
          font-size: 0.875rem;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background var(--transition-fast), color var(--transition-fast);
        }
        .status-option:hover { background: var(--bg-hover); color: var(--text-primary); }
        .status-option--active { color: var(--text-primary); background: var(--bg-overlay); }
        .status-option--remove { color: var(--accent); }
        .status-option--remove:hover { background: var(--accent-glow); }
        .status-divider { height: 1px; background: var(--border); margin: 0.25rem 0; }

        /* Rating de usuario */
        .anime-rating-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0.875rem;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
        }
        .anime-rating-label {
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin: 0;
        }
        .anime-stars {
          display: flex;
          gap: 0.25rem;
        }
        .star-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.125rem;
          color: var(--bg-hover);
          transition: color var(--transition-fast), transform var(--transition-fast);
        }
        .star-btn:hover { transform: scale(1.15); }
        .star-btn--active { color: var(--amber); }
        .star-btn:disabled { cursor: not-allowed; opacity: 0.6; }

        /* Favorito */
        .anime-favorite-section {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .action-btn--favorite {
          background: var(--bg-surface);
          color: var(--text-secondary);
          border: 1px solid var(--border);
          justify-content: flex-start;
          transition: all var(--transition-fast);
        }
        .action-btn--favorite:hover {
          border-color: var(--border-hover);
          background: var(--bg-elevated);
          color: var(--text-primary);
        }
        .action-btn--favorited {
          background: rgba(244, 63, 94, 0.08);
          border-color: rgba(244, 63, 94, 0.25);
          color: #f43f5e;
        }
        .action-btn--favorited:hover {
          background: rgba(244, 63, 94, 0.15);
          border-color: rgba(244, 63, 94, 0.4);
          color: #f43f5e;
        }
        .action-btn--favorited svg {
          filter: drop-shadow(0 0 6px rgba(244, 63, 94, 0.5));
        }
        .anime-favorite-hint {
          font-family: var(--font-body);
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: 0;
          text-align: center;
        }

        @media (max-width: 768px) {
          .anime-cover-wrapper { max-width: 180px; margin: 0 auto; }
        }
      `}</style>
    </div>
  )
}
