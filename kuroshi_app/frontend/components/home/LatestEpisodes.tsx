'use client'
// components/home/LatestEpisodes.tsx
import { useEffect, useState } from 'react'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EpisodeCard } from '@/components/anime/EpisodeCard'
import { animeApi } from '@/lib/api'

// Tipo local — lo que devuelve el endpoint /anime/latest-episodes
interface LatestEpisodeItem {
  anime: {
    id: string
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
}

function EpisodeCardSkeleton() {
  return (
    <div className="ep-skeleton">
      <div className="skeleton ep-sk-thumb" />
      <div className="ep-sk-info">
        <div className="skeleton ep-sk-title" />
        <div className="skeleton ep-sk-sub" />
      </div>
      <style>{`
        .ep-skeleton {
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: 0.875rem;
          padding: 0.75rem;
          border-radius: var(--radius-lg);
          background: var(--bg-surface);
          border: 1px solid var(--border);
        }
        .ep-sk-thumb {
          aspect-ratio: 16 / 9;
          border-radius: var(--radius-md);
        }
        .ep-sk-info { display: flex; flex-direction: column; gap: 0.5rem; justify-content: center; }
        .ep-sk-title { height: 14px; width: 80%; border-radius: 3px; }
        .ep-sk-sub { height: 12px; width: 55%; border-radius: 3px; }
      `}</style>
    </div>
  )
}

export function LatestEpisodes() {
  const [episodes, setEpisodes] = useState<LatestEpisodeItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    animeApi.getLatestEpisodes()
      .then((data: any) => {
        const items: LatestEpisodeItem[] = Array.isArray(data) ? data : []
        setEpisodes(items)
      })
      .catch(() => setEpisodes([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <SectionHeader
        title="Últimos episodios"
        subtitle="Actualizados al instante"
        href="/anime"
        hrefLabel="Ver catálogo"
      />

      <div className="latest-grid">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <EpisodeCardSkeleton key={i} />)
          : episodes.map((item, i) => (
              <EpisodeCard
                key={`${item.anime.slug}-${item.episode.number}`}
                anime={item.anime}
                episode={item.episode}
                priority={i < 4}
              />
            ))}
      </div>

      <style>{`
        .latest-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }
        @media (max-width: 768px) {
          .latest-grid { grid-template-columns: 1fr; }
        }
        @media (min-width: 1280px) {
          .latest-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </div>
  )
}
