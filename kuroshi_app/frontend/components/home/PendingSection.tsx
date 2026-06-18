'use client'
import Link from 'next/link'
import Image from 'next/image'
import { SectionHeader } from '@/components/ui/SectionHeader'

interface PendingAnime {
  anime: {
    slug: string
    title_es: string
    cover_url: string
    total_episodes: number
    status: string
  }
  personal_rating?: number
}

interface Props {
  items: PendingAnime[]
  username?: string
}

export function PendingSection({ items, username }: Props) {
  if (!items?.length) return null

  return (
    <section className="home-section" aria-labelledby="pending-title">
      <div>
        <SectionHeader
          title="Pendientes"
          subtitle="Animes que tenés en tu lista por ver"
          href={username ? `/u/${username}?tab=lista` : undefined}
          hrefLabel="Ver todos"
        />

        <div className="pending-grid">
          {items.slice(0, 12).map((item) => (
            <Link
              key={item.anime.slug}
              href={`/anime/${item.anime.slug}`}
              className="pending-card"
            >
              <div className="pending-img-wrapper">
                <Image
                  src={item.anime.cover_url}
                  alt={item.anime.title_es}
                  fill
                  sizes="140px"
                  className="pending-img"
                />
              </div>
              <div className="pending-info">
                <h3 className="pending-title">{item.anime.title_es}</h3>
                {item.anime.total_episodes && (
                  <span className="pending-episodes">{item.anime.total_episodes} ep.</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        .pending-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 0.875rem;
        }
        .pending-card {
          display: flex;
          flex-direction: column;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          transition: all var(--transition-fast);
          text-decoration: none;
        }
        .pending-card:hover {
          border-color: var(--accent);
          transform: translateY(-2px);
        }
        .pending-img-wrapper {
          position: relative;
          aspect-ratio: 3 / 4;
          overflow: hidden;
        }
        .pending-img {
          object-fit: cover;
        }
        .pending-info {
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        .pending-title {
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pending-episodes {
          font-size: 0.6875rem;
          color: var(--text-muted);
        }
      `}</style>
    </section>
  )
}
