'use client'
// components/anime/AnimeCard.tsx
import Link from 'next/link'
import Image from 'next/image'
import { AnimeSummary, AnimeStatus } from '@/types'

interface Props {
  anime: AnimeSummary & {
    total_episodes?: number
    year?: number
    community_rating?: number
  }
  priority?: boolean
  showNewBadge?: boolean
}

const STATUS_LABEL: Record<AnimeStatus, string> = {
  en_emision: 'En emisión',
  finalizado: 'Finalizado',
  proximamente: 'Próximamente',
}

export function AnimeCard({ anime, priority = false, showNewBadge }: Props) {
  return (
    <Link href={`/anime/${anime.slug}`} className="anime-card" aria-label={anime.title_es}>
      <div className="anime-card-img-wrapper">
        <Image
          src={anime.cover_url}
          alt={anime.title_es}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
          className="anime-card-img"
          priority={priority}
        />

        {/* Overlay en hover */}
        <div className="anime-card-overlay" aria-hidden="true">
          <div className="anime-card-overlay-content">
            {anime.genres?.slice(0, 3).map(g => (
              <span key={g.id} className="anime-card-genre">{g.name}</span>
            ))}
          </div>
          <div className="anime-card-play">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Ver ahora
          </div>
        </div>

        {/* Badges */}
        <div className="anime-card-badges">
          {showNewBadge && (
            <span className="badge badge-new">Nuevo ep</span>
          )}
          {anime.status === 'en_emision' && !showNewBadge && (
            <span className="badge badge-accent">En emisión</span>
          )}
        </div>

        {/* Rating MAL */}
        {anime.mal_rating && (
          <div className="anime-card-rating">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {anime.mal_rating.toFixed(1)}
          </div>
        )}
      </div>

      <div className="anime-card-info">
        <h3 className="anime-card-title">{anime.title_es}</h3>
        {anime.title_jp && (
          <p className="anime-card-title-jp">{anime.title_jp}</p>
        )}
        <div className="anime-card-meta">
          {anime.year && <span>{anime.year}</span>}
          {anime.total_episodes && (
            <span>{anime.total_episodes} eps</span>
          )}
        </div>
      </div>

      <style>{`
        .anime-card {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          text-decoration: none;
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: transform var(--transition-normal);
        }
        .anime-card:hover { transform: translateY(-4px); }
        .anime-card:hover .anime-card-overlay { opacity: 1; }
        .anime-card:hover .anime-card-img { transform: scale(1.04); }

        .anime-card-img-wrapper {
          position: relative;
          aspect-ratio: 2 / 3;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--bg-elevated);
        }

        .anime-card-img {
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        /* Overlay */
        .anime-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.4) 60%, transparent 100%);
          opacity: 0;
          transition: opacity var(--transition-normal);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 0.875rem;
          gap: 0.5rem;
        }

        .anime-card-overlay-content {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .anime-card-genre {
          font-family: var(--font-display);
          font-size: 0.625rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-secondary);
          background: rgba(255,255,255,0.08);
          border-radius: var(--radius-full);
          padding: 0.15rem 0.5rem;
        }

        .anime-card-play {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--text-primary);
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 700;
          background: var(--accent);
          border-radius: var(--radius-md);
          padding: 0.4rem 0.75rem;
          width: fit-content;
        }

        /* Badges en esquina */
        .anime-card-badges {
          position: absolute;
          top: 0.5rem;
          left: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        /* Rating en esquina */
        .anime-card-rating {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.2rem;
          background: rgba(10,10,15,0.75);
          backdrop-filter: blur(8px);
          color: var(--amber);
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 0.2rem 0.45rem;
          border-radius: var(--radius-full);
        }

        /* Info bajo la imagen */
        .anime-card-info {
          padding: 0 0.125rem;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .anime-card-title {
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .anime-card-title-jp {
          font-size: 0.6875rem;
          color: var(--text-muted);
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .anime-card-meta {
          display: flex;
          gap: 0.5rem;
          font-size: 0.6875rem;
          color: var(--text-muted);
        }
      `}</style>
    </Link>
  )
}
