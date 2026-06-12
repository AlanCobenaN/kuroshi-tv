// app/anime/[slug]/RelatedAnimes.tsx (Server Component)
import Link from 'next/link'
import Image from 'next/image'
import { Anime, AnimeSummary } from '@/types'

interface Props {
  currentAnime: Anime
}

// En producción esto vendría de un endpoint /anime/:slug/related
// Por ahora filtramos del catálogo por género compartido
export async function RelatedAnimes({ currentAnime }: Props) {
  let related: AnimeSummary[] = []

  try {
    const genre = currentAnime.genres?.[0]?.name?.toLowerCase().replace(/ /g, '_')
    if (genre) {
      const res = await fetch(
        `${process.env.INTERNAL_API_URL}/anime?genre=${genre}&limit=8`,
        { next: { revalidate: 3600 } }
      )
      if (res.ok) {
        const data = await res.json()
        const items: AnimeSummary[] = Array.isArray(data) ? data : data.data ?? []
        related = items.filter(a => a.slug !== currentAnime.slug).slice(0, 8)
      }
    }
  } catch {
    // Si falla, no mostramos la sección
  }

  if (related.length === 0) return null

  return (
    <section className="related-section" aria-labelledby="related-title">
      <div className="related-header">
        <h2 className="related-title" id="related-title">Anime relacionado</h2>
        {currentAnime.genres?.[0] && (
          <Link
            href={`/anime?genre=${currentAnime.genres[0].name.toLowerCase().replace(/ /g, '_')}`}
            className="related-more"
          >
            Ver más de {currentAnime.genres[0].name}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      <div className="related-scroll">
        <ul className="related-list" role="list">
          {related.map((anime, i) => (
            <li key={anime.id} className="related-item">
              <Link href={`/anime/${anime.slug}`} className="related-card" aria-label={anime.title_es}>
                <div className="related-img-wrapper">
                  <Image
                    src={anime.cover_url}
                    alt={anime.title_es}
                    fill
                    sizes="120px"
                    className="related-img"
                    priority={i < 4}
                  />
                  {anime.mal_rating && (
                    <span className="related-rating">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {anime.mal_rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <span className="related-name">{anime.title_es}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .related-section { margin-top: 1rem; }

        .related-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }
        .related-title {
          font-family: var(--font-display);
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .related-more {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--accent);
          text-decoration: none;
          transition: gap var(--transition-fast);
        }
        .related-more:hover { gap: 0.55rem; }

        .related-scroll {
          overflow-x: auto;
          scrollbar-width: none;
          margin: 0 -1rem;
          padding: 0.375rem 1rem;
        }
        .related-scroll::-webkit-scrollbar { display: none; }

        .related-list {
          display: flex;
          gap: 0.875rem;
          list-style: none;
          min-width: max-content;
        }

        .related-item { flex-shrink: 0; }

        .related-card {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 120px;
          text-decoration: none;
          transition: transform var(--transition-normal);
        }
        .related-card:hover { transform: translateY(-3px); }
        .related-card:hover .related-img { transform: scale(1.05); }

        .related-img-wrapper {
          position: relative;
          aspect-ratio: 2 / 3;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--bg-elevated);
        }
        .related-img {
          object-fit: cover;
          transition: transform 0.35s ease;
        }
        .related-rating {
          position: absolute;
          top: 0.375rem;
          right: 0.375rem;
          display: flex;
          align-items: center;
          gap: 0.2rem;
          background: rgba(10,10,15,0.75);
          backdrop-filter: blur(8px);
          color: var(--amber);
          font-family: var(--font-display);
          font-size: 0.625rem;
          font-weight: 700;
          padding: 0.15rem 0.4rem;
          border-radius: var(--radius-full);
        }
        .related-name {
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.3;
          transition: color var(--transition-fast);
        }
        .related-card:hover .related-name { color: var(--text-primary); }
      `}</style>
    </section>
  )
}
