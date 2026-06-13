'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Community, PaginatedResponse } from '@/types'
import { communitiesApi } from '@/lib/api'

interface Props {
  initialCommunities: Community[]
  initialMeta: PaginatedResponse<Community>['meta']
  selectedSlug: string | null
  onSelect: (slug: string | null) => void
  removedSlugs?: string[]
}

export function LeftSidebar({ initialCommunities, initialMeta, selectedSlug, onSelect, removedSlugs }: Props) {
  const [communities, setCommunities] = useState(initialCommunities.filter(c => !removedSlugs?.includes(c.slug)))
  const [meta, setMeta] = useState(initialMeta)
  const [loading, setLoading] = useState(false)

  const loadMore = useCallback(async () => {
    if (loading || meta.page >= meta.total_pages) return
    setLoading(true)
    try {
      const nextPage = meta.page + 1
      const data = await communitiesApi.getAll({ limit: 10, page: nextPage, order: 'miembros' }) as any
      const newItems: Community[] = data.data ?? []
      setCommunities(prev => [...prev, ...newItems])
      setMeta(data.meta)
    } catch {}
    finally { setLoading(false) }
  }, [loading, meta])

  return (
    <aside className="hub-left">
      <div className="hub-left-header">
        <h2 className="hub-left-title">Comunidades</h2>
        <span className="hub-left-count">{meta.total}</span>
      </div>

      <nav className="hub-left-nav" aria-label="Lista de comunidades">
        <button
          onClick={() => onSelect(null)}
          className={`hub-left-item ${selectedSlug === null ? 'hub-left-item--active' : ''}`}
        >
          <div className="hub-left-item-avatar hub-left-item-avatar--all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <span className="hub-left-item-name">Feed General</span>
        </button>

        {communities.map(c => (
          <button
            key={c.id}
            onClick={() => onSelect(c.slug)}
            className={`hub-left-item ${selectedSlug === c.slug ? 'hub-left-item--active' : ''}`}
          >
            <div className="hub-left-item-avatar">
              {c.avatar_url ? (
                <Image src={c.avatar_url} alt="" width={32} height={32} className="hub-left-item-img" />
              ) : (
                <span className="hub-left-item-fallback">{c.name[0]}</span>
              )}
            </div>
            <span className="hub-left-item-name">{c.name}</span>
            {c.type === 'oficial' && (
              <svg className="hub-left-item-badge" width="10" height="10" viewBox="0 0 24 24" fill="#60a5fa" aria-label="Oficial">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            )}
          </button>
        ))}
      </nav>

      {meta.page < meta.total_pages && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="hub-left-more"
        >
          {loading ? 'Cargando...' : `Ver más (${meta.total - communities.length} restantes)`}
        </button>
      )}

      <style>{`
        .hub-left {
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          border-right: 1px solid var(--border);
          max-height: calc(100dvh - var(--total-nav));
        }
        .hub-left-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 0.75rem;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .hub-left-title {
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          margin: 0;
        }
        .hub-left-count {
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--text-muted);
          background: var(--bg-overlay);
          padding: 0.125rem 0.5rem;
          border-radius: var(--radius-full);
        }
        .hub-left-nav {
          display: flex;
          flex-direction: column;
          gap: 1px;
          padding: 0.5rem;
          flex: 1;
          overflow-y: auto;
        }
        .hub-left-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.625rem;
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          cursor: pointer;
          text-align: left;
          width: 100%;
          font-family: var(--font-body);
          font-size: 0.875rem;
          transition: all var(--transition-fast);
        }
        .hub-left-item:hover {
          background: var(--bg-overlay);
          color: var(--text-primary);
        }
        .hub-left-item--active {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }
        .hub-left-item-avatar {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          overflow: hidden;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-overlay);
        }
        .hub-left-item-avatar--all {
          background: var(--accent-glow);
          color: var(--accent);
        }
        .hub-left-item-img {
          width: 32px;
          height: 32px;
          object-fit: cover;
        }
        .hub-left-item-fallback {
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .hub-left-item-name {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .hub-left-item-badge {
          flex-shrink: 0;
        }
        .hub-left-more {
          margin: 0.5rem;
          padding: 0.5rem;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-muted);
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }
        .hub-left-more:hover:not(:disabled) {
          border-color: var(--border-hover);
          color: var(--text-secondary);
        }
        .hub-left-more:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </aside>
  )
}
