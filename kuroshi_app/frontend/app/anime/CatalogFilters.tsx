'use client'
// app/anime/CatalogFilters.tsx
import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { genresApi } from '@/lib/api'

const STATUSES = [
  { value: 'en_emision',   label: 'En emisión' },
  { value: 'finalizado',   label: 'Finalizado' },
  { value: 'proximamente', label: 'Próximamente' },
]

const SEASONS = [
  { value: 'invierno', label: 'Invierno' },
  { value: 'primavera', label: 'Primavera' },
  { value: 'verano',    label: 'Verano' },
  { value: 'otono',     label: 'Otoño' },
]

const ORDERS = [
  { value: 'popular',      label: 'Más populares' },
  { value: 'weekly',       label: 'Ranking semanal' },
  { value: 'rating',       label: 'Mejor valorados (MAL)' },
  { value: 'recent',       label: 'Más recientes' },
  { value: 'alphabetical', label: 'Alfabético (A–Z)' },
]

const YEARS = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i)

interface Props {
  currentFilters: {
    genre?: string
    status?: string
    season?: string
    year?: string
    order?: string
  }
}

export function CatalogFilters({ currentFilters }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const [genres, setGenres] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    genresApi.getAll()
      .then((data: any) => setGenres(data ?? []))
      .catch(() => {})
  }, [])

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams()

      // Conservar todos los filtros actuales
      Object.entries(currentFilters).forEach(([k, v]) => {
        if (v && k !== key && k !== 'page') params.set(k, v)
      })

      // Aplicar el nuevo valor (si existe)
      if (value) params.set(key, value)

      router.push(`${pathname}?${params.toString()}`)
    },
    [currentFilters, pathname, router]
  )

  const clearAll = useCallback(() => {
    router.push(pathname)
  }, [pathname, router])

  const hasFilters = !!(
    currentFilters.genre ||
    currentFilters.status ||
    currentFilters.season ||
    currentFilters.year
  )

  return (
    <div className="filters">
      {/* Encabezado */}
      <div className="filters-header">
        <h2 className="filters-title">Filtros</h2>
        {hasFilters && (
          <button onClick={clearAll} className="filters-clear">
            Limpiar todo
          </button>
        )}
      </div>

      {/* Ordenar por */}
      <FilterGroup title="Ordenar por">
        <div className="filter-radio-group">
          {ORDERS.map(o => (
            <label key={o.value} className="filter-radio-label">
              <input
                type="radio"
                name="order"
                value={o.value}
                checked={(currentFilters.order ?? 'popular') === o.value}
                onChange={() => updateFilter('order', o.value)}
                className="filter-radio-input"
              />
              <span className="filter-radio-text">{o.label}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      {/* Estado */}
      <FilterGroup title="Estado">
        <div className="filter-radio-group">
          {STATUSES.map(s => (
            <label key={s.value} className="filter-radio-label">
              <input
                type="radio"
                name="status"
                value={s.value}
                checked={currentFilters.status === s.value}
                onChange={() =>
                  updateFilter('status', currentFilters.status === s.value ? undefined : s.value)
                }
                className="filter-radio-input"
              />
              <span className="filter-radio-text">{s.label}</span>
            </label>
          ))}
        </div>
      </FilterGroup>

      {/* Géneros */}
      <FilterGroup title="Género">
        <div className="filter-tags">
          {genres.map(g => {
            const val = g.name.toLowerCase().replace(/ /g, '_')
            const active = currentFilters.genre === val
            return (
              <button
                key={g.id}
                onClick={() => updateFilter('genre', active ? undefined : val)}
                className={`filter-tag ${active ? 'filter-tag--active' : ''}`}
                aria-pressed={active}
              >
                {g.name}
              </button>
            )
          })}
        </div>
      </FilterGroup>

      {/* Temporada */}
      <FilterGroup title="Temporada">
        <div className="filter-tags">
          {SEASONS.map(s => {
            const active = currentFilters.season === s.value
            return (
              <button
                key={s.value}
                onClick={() => updateFilter('season', active ? undefined : s.value)}
                className={`filter-tag ${active ? 'filter-tag--active' : ''}`}
                aria-pressed={active}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </FilterGroup>

      {/* Año */}
      <FilterGroup title="Año">
        <select
          value={currentFilters.year ?? ''}
          onChange={e => updateFilter('year', e.target.value || undefined)}
          className="filter-select"
          aria-label="Filtrar por año"
        >
          <option value="">Todos los años</option>
          {YEARS.map(y => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
      </FilterGroup>

      <style>{`
        .filters {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .filters-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .filters-title {
          font-family: var(--font-display);
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .filters-clear {
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--accent);
          padding: 0;
          transition: opacity var(--transition-fast);
        }
        .filters-clear:hover { opacity: 0.75; }

        /* Radio group */
        .filter-radio-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .filter-radio-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        .filter-radio-input {
          accent-color: var(--accent);
          width: 14px;
          height: 14px;
          flex-shrink: 0;
          cursor: pointer;
        }
        .filter-radio-text {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          transition: color var(--transition-fast);
        }
        .filter-radio-label:has(.filter-radio-input:checked) .filter-radio-text {
          color: var(--text-primary);
        }

        /* Tag buttons */
        .filter-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }

        .filter-tag {
          padding: 0.25rem 0.65rem;
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: var(--text-secondary);
          background: var(--bg-overlay);
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        .filter-tag:hover {
          color: var(--text-primary);
          border-color: var(--border-hover);
          background: var(--bg-hover);
        }
        .filter-tag--active {
          color: var(--accent);
          background: var(--accent-glow);
          border-color: rgba(230, 57, 70, 0.3);
        }

        /* Select */
        .filter-select {
          width: 100%;
          padding: 0.5rem 0.75rem;
          background: var(--bg-overlay);
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.8125rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 7L11 1' stroke='%234e4d5c' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          padding-right: 2rem;
        }
        .filter-select:focus { border-color: var(--border-focus); }
      `}</style>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="filter-group">
      <h3 className="filter-group-title">{title}</h3>
      {children}

      <style>{`
        .filter-group { display: flex; flex-direction: column; gap: 0.625rem; }
        .filter-group-title {
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin: 0;
        }
      `}</style>
    </div>
  )
}
