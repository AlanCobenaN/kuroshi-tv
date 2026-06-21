'use client'
// app/anime/CatalogGrid.tsx
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { AnimeCard } from '@/components/anime/AnimeCard'
import { AnimeSummary } from '@/types'

interface Meta {
  page: number
  total: number
  total_pages: number
  limit: number
}

interface Props {
  animes: (AnimeSummary & { total_episodes?: number; year?: number })[]
  meta: Meta
  currentPage: number
  currentFilters: Record<string, string | undefined>
}

export function CatalogGrid({ animes, meta, currentPage, currentFilters }: Props) {
  const router   = useRouter()
  const pathname = usePathname()

  const goToPage = (page: number) => {
    const params = new URLSearchParams()
    Object.entries(currentFilters).forEach(([k, v]) => {
      if (v && k !== 'page') params.set(k, v)
    })
    params.set('page', String(page))
    router.push(`${pathname}?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (animes.length === 0) {
    return (
      <div className="catalog-empty">
        <span className="catalog-empty-icon" aria-hidden="true">🔍</span>
        <h3 className="catalog-empty-title">Sin resultados</h3>
        <p className="catalog-empty-sub">
          No encontramos anime con los filtros seleccionados.
        </p>
        <Link href="/anime" className="btn-secondary">
          Limpiar filtros
        </Link>

        <style>{`
          .catalog-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            padding: 4rem 2rem;
            text-align: center;
          }
          .catalog-empty-icon { font-size: 2.5rem; }
          .catalog-empty-title {
            font-family: var(--font-display);
            font-size: 1.125rem;
            color: var(--text-primary);
            margin: 0;
          }
          .catalog-empty-sub { color: var(--text-muted); font-size: 0.875rem; margin: 0; }
        `}</style>
      </div>
    )
  }

  return (
    <div>
      {/* Grid */}
      <ol className="catalog-grid stagger" role="list" aria-label="Catálogo de anime">
        {animes.map((anime, i) => (
          <li key={anime.id} className="animate-fade-in">
            <AnimeCard
              anime={anime}
              priority={i < 4}
            />
          </li>
        ))}
      </ol>

      {/* Paginación */}
      {meta.total_pages > 1 && (
        <nav className="catalog-pagination" aria-label="Páginas del catálogo">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="page-btn page-btn-prev"
            aria-label="Página anterior"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Anterior
          </button>

          <div className="page-numbers" role="list">
            {buildPageNumbers(currentPage, meta.total_pages).map((item, i) =>
              item === '…' ? (
                <span key={`ellipsis-${i}`} className="page-ellipsis" aria-hidden="true">…</span>
              ) : (
                <button
                  key={item}
                  onClick={() => goToPage(item as number)}
                  className={`page-number ${currentPage === item ? 'page-number--active' : ''}`}
                  aria-label={`Página ${item}`}
                  aria-current={currentPage === item ? 'page' : undefined}
                >
                  {item}
                </button>
              )
            )}
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= meta.total_pages}
            className="page-btn page-btn-next"
            aria-label="Página siguiente"
          >
            Siguiente
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </nav>
      )}

      {/* Info de paginación */}
      <p className="catalog-count" aria-live="polite">
        Mostrando {((currentPage - 1) * meta.limit) + 1}–{Math.min(currentPage * meta.limit, meta.total)} de {meta.total.toLocaleString('es')} títulos
      </p>

      <style>{`
        .catalog-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1rem;
          list-style: none;
          margin-bottom: 2.5rem;
        }

        @media (max-width: 1200px) { .catalog-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 900px)  { .catalog-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 600px)  { .catalog-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; } }

        /* Paginación */
        .catalog-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .page-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.875rem;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .page-btn:hover:not(:disabled) {
          color: var(--text-primary);
          border-color: var(--border-hover);
          background: var(--bg-elevated);
        }
        .page-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .page-numbers {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .page-number {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .page-number:hover { color: var(--text-primary); border-color: var(--border-hover); background: var(--bg-elevated); }
        .page-number--active {
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
        }

        .page-ellipsis {
          width: 36px;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .catalog-count {
          text-align: center;
          font-size: 0.8125rem;
          color: var(--text-muted);
          margin: 0;
        }

        @media (max-width: 640px) {
          .catalog-grid { gap: 0.5rem; }
          .page-btn { padding: 0.375rem 0.625rem; font-size: 0.75rem; }
          .page-number { width: 32px; height: 32px; font-size: 0.75rem; }
          .page-ellipsis { width: 28px; }
        }
      `}</style>
    </div>
  )
}

/** Genera el array de páginas con ellipsis */
function buildPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '…')[] = []
  const delta = 1

  const range = {
    start: Math.max(2, current - delta),
    end:   Math.min(total - 1, current + delta),
  }

  pages.push(1)
  if (range.start > 2) pages.push('…')
  for (let i = range.start; i <= range.end; i++) pages.push(i)
  if (range.end < total - 1) pages.push('…')
  pages.push(total)

  return pages
}
