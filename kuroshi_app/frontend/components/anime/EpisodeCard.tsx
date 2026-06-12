'use client'
// components/anime/EpisodeCard.tsx
import Link from 'next/link'
import Image from 'next/image'

interface Props {
  anime: {
    slug: string
    title_es: string
    cover_url: string
    mal_rating?: number
    genres?: { id: string; name: string }[]
  }
  episode: {
    number: number
    title?: string
    thumbnail_url?: string
    air_date?: string
  }
  priority?: boolean
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `Hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `Hace ${days}d`
}

export function EpisodeCard({ anime, episode, priority = false }: Props) {
  const href = `/anime/${anime.slug}/episodio/${episode.number}`
  const thumbnail = episode.thumbnail_url ?? anime.cover_url

  return (
    <Link href={href} className="ep-card" aria-label={`${anime.title_es} — Episodio ${episode.number}`}>
      <div className="ep-thumbnail">
        <Image
          src={thumbnail}
          alt={`Ep ${episode.number} de ${anime.title_es}`}
          fill
          sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 22vw"
          className="ep-img"
          priority={priority}
        />
        {/* Overlay de hover */}
        <div className="ep-play-overlay" aria-hidden="true">
          <div className="ep-play-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
        {/* Badge del episodio */}
        <span className="ep-num-badge">EP {episode.number}</span>
      </div>

      {/* Info */}
      <div className="ep-info">
        <h3 className="ep-anime-title">{anime.title_es}</h3>
        <p className="ep-title">
          {episode.title ?? `Episodio ${episode.number}`}
        </p>
        <div className="ep-meta">
          {episode.air_date && (
            <span className="ep-time">{timeAgo(episode.air_date)}</span>
          )}
          {anime.mal_rating && (
            <span className="ep-rating">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {anime.mal_rating.toFixed(1)}
            </span>
          )}
        </div>
        {/* Géneros en hover (solo desktop) */}
        {anime.genres && anime.genres.length > 0 && (
          <div className="ep-genres">
            {anime.genres.slice(0, 2).map(g => (
              <span key={g.id} className="ep-genre">{g.name}</span>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .ep-card {
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: 0.875rem;
          padding: 0.75rem;
          border-radius: var(--radius-lg);
          background: var(--bg-surface);
          border: 1px solid var(--border);
          text-decoration: none;
          transition: border-color var(--transition-fast), background var(--transition-fast), transform var(--transition-fast);
        }
        .ep-card:hover {
          border-color: var(--border-hover);
          background: var(--bg-elevated);
          transform: translateY(-2px);
        }
        .ep-card:hover .ep-play-overlay { opacity: 1; }
        .ep-card:hover .ep-img { transform: scale(1.05); }

        .ep-thumbnail {
          position: relative;
          aspect-ratio: 16 / 9;
          border-radius: var(--radius-md);
          overflow: hidden;
          background: var(--bg-elevated);
          flex-shrink: 0;
        }

        .ep-img {
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .ep-play-overlay {
          position: absolute;
          inset: 0;
          background: rgba(10,10,15,0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity var(--transition-fast);
        }

        .ep-play-btn {
          width: 40px;
          height: 40px;
          background: var(--accent);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }

        .ep-num-badge {
          position: absolute;
          bottom: 0.375rem;
          left: 0.375rem;
          font-family: var(--font-display);
          font-size: 0.625rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          background: rgba(10,10,15,0.8);
          backdrop-filter: blur(8px);
          color: var(--text-secondary);
          padding: 0.15rem 0.45rem;
          border-radius: var(--radius-full);
        }

        .ep-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          justify-content: center;
          overflow: hidden;
        }

        .ep-anime-title {
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ep-title {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.4;
        }

        .ep-meta {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          margin-top: 0.125rem;
        }

        .ep-time {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .ep-rating {
          display: flex;
          align-items: center;
          gap: 0.2rem;
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--amber);
        }

        .ep-genres {
          display: flex;
          gap: 0.3rem;
          margin-top: 0.25rem;
        }

        .ep-genre {
          font-size: 0.625rem;
          font-family: var(--font-display);
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--text-muted);
          background: var(--bg-overlay);
          border-radius: var(--radius-full);
          padding: 0.15rem 0.45rem;
        }

        @media (max-width: 480px) {
          .ep-card { grid-template-columns: 100px 1fr; gap: 0.625rem; padding: 0.625rem; }
        }
      `}</style>
    </Link>
  )
}
