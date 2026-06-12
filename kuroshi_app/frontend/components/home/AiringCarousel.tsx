'use client'
// components/home/AiringCarousel.tsx
import Link from 'next/link'
import Image from 'next/image'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { AnimeSummary } from '@/types'

interface AiringAnime extends AnimeSummary {
  latest_episode?: {
    number: number
    air_date: string
  }
}

interface Props {
  animes: AiringAnime[]
}

export function AiringCarousel({ animes }: Props) {
  const today = new Date()

  const isToday = (dateStr?: string) => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    return d.toDateString() === today.toDateString()
  }

  return (
    <div className="airing-section">
      <SectionHeader
        title="En emisión ahora"
        subtitle="Nuevos episodios cada semana"
        href="/anime?status=en_emision"
        hrefLabel="Ver todos"
      />

      <div className="airing-scroll-wrapper">
        <ul className="airing-list" role="list">
          {animes.map((anime, i) => {
            const hasNewToday = isToday(anime.latest_episode?.air_date)

            return (
              <li key={anime.id} className="airing-item">
                <Link
                  href={`/anime/${anime.slug}`}
                  className="airing-card"
                  aria-label={`${anime.title_es}${hasNewToday ? ' — nuevo episodio hoy' : ''}`}
                >
                  <div className="airing-img-wrapper">
                    <Image
                      src={anime.cover_url}
                      alt={anime.title_es}
                      fill
                      sizes="140px"
                      className="airing-img"
                      priority={i < 6}
                    />
                    {hasNewToday && (
                      <span className="airing-new-badge">
                        <span className="airing-new-dot" aria-hidden="true" />
                        Nuevo ep hoy
                      </span>
                    )}
                    <div className="airing-overlay" aria-hidden="true" />
                  </div>

                  <div className="airing-info">
                    <h3 className="airing-title">{anime.title_es}</h3>
                    {anime.latest_episode && (
                      <span className="airing-ep">
                        Ep {anime.latest_episode.number}
                      </span>
                    )}
                    {anime.mal_rating && (
                      <span className="airing-rating">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        {anime.mal_rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      <style>{`
        .airing-section { width: 100%; }

        .airing-scroll-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          margin: 0 -1rem;
          padding: 0 1rem;
        }
        .airing-scroll-wrapper::-webkit-scrollbar { display: none; }

        .airing-list {
          display: flex;
          gap: 0.875rem;
          list-style: none;
          padding: 0.5rem 0;
          min-width: max-content;
        }

        .airing-item { flex-shrink: 0; }

        .airing-card {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 130px;
          text-decoration: none;
          transition: transform var(--transition-normal);
        }
        .airing-card:hover { transform: translateY(-3px); }
        .airing-card:hover .airing-overlay { opacity: 1; }
        .airing-card:hover .airing-img { transform: scale(1.05); }

        .airing-img-wrapper {
          position: relative;
          aspect-ratio: 2 / 3;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--bg-elevated);
        }

        .airing-img {
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .airing-overlay {
          position: absolute;
          inset: 0;
          background: rgba(230, 57, 70, 0.15);
          opacity: 0;
          transition: opacity var(--transition-normal);
        }

        .airing-new-badge {
          position: absolute;
          bottom: 0.375rem;
          left: 0;
          right: 0;
          margin: 0 0.375rem;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          justify-content: center;
          background: rgba(10,10,15,0.85);
          backdrop-filter: blur(8px);
          color: #4ade80;
          font-family: var(--font-display);
          font-size: 0.5625rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-full);
        }

        .airing-new-dot {
          width: 6px;
          height: 6px;
          background: #4ade80;
          border-radius: 50%;
          animation: pulse-accent 1.5s ease infinite;
          flex-shrink: 0;
        }

        .airing-info {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .airing-title {
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .airing-ep {
          font-size: 0.6875rem;
          color: var(--text-muted);
        }

        .airing-rating {
          display: flex;
          align-items: center;
          gap: 0.2rem;
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--amber);
        }
      `}</style>
    </div>
  )
}
