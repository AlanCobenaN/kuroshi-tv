'use client'
import Link from 'next/link'
import Image from 'next/image'
import { SectionHeader } from '@/components/ui/SectionHeader'

interface ContinueWatchingItem {
  anime: {
    id: string
    slug: string
    title_es: string
    title_jp: string
    cover_url: string
    total_episodes: number
    status: string
  }
  episode: {
    id: string
    number: number
    title: string
    season_number: number
  }
  last_minute: number
  watched_at: string
}

interface Props {
  items: ContinueWatchingItem[]
}

export function ContinueWatchingSection({ items }: Props) {
  if (!items?.length) return null

  return (
    <section className="home-section" aria-labelledby="continue-title">
      <div>
        <SectionHeader
          title="Continuar viendo"
          subtitle="Sigue desde donde lo dejaste"
        />

        <div className="continue-grid">
          {items.map((item) => (
            <Link
              key={`${item.anime.id}-${item.episode.id}`}
              href={`/anime/${item.anime.slug}/episodio/${item.episode.number}`}
              className="continue-card"
            >
              <div className="continue-img-wrapper">
                <Image
                  src={item.anime.cover_url}
                  alt={item.anime.title_es}
                  fill
                  sizes="200px"
                  className="continue-img"
                />
                <div className="continue-episode-badge">
                  Ep. {item.episode.number}
                </div>
              </div>
              <div className="continue-info">
                <h3 className="continue-title">{item.anime.title_es}</h3>
                <p className="continue-episode-title">
                  {item.episode.title || `Episodio ${item.episode.number}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        .continue-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 1rem;
        }
        .continue-card {
          display: flex;
          flex-direction: column;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          transition: all var(--transition-fast);
          text-decoration: none;
        }
        .continue-card:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
        }
        .continue-img-wrapper {
          position: relative;
          aspect-ratio: 16 / 9;
          overflow: hidden;
        }
        .continue-img {
          object-fit: cover;
        }
        .continue-episode-badge {
          position: absolute;
          bottom: 0.375rem;
          left: 0.375rem;
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-full);
          background: var(--accent);
          color: #000;
        }
        .continue-info {
          padding: 0.625rem;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        .continue-title {
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .continue-episode-title {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </section>
  )
}
