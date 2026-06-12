'use client'
// app/buscar/SearchClient.tsx
import { useState, useEffect, useCallback, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { searchApi } from '@/lib/api'
import { AdBanner } from '@/components/ads/AdBanner'
import { AnimeSummary, Community, UserPublicProfile } from '@/types'

type TabId = 'anime' | 'comunidades' | 'usuarios'

interface SearchResults {
  anime?: AnimeSummary[]
  communities?: Community[]
  users?: UserPublicProfile[]
  meta?: { total: number; total_pages: number; page: number }
}

interface Props {
  query: string
  initialResults: SearchResults
  initialTab: TabId
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'anime',       label: 'Anime' },
  { id: 'comunidades', label: 'Comunidades' },
  { id: 'usuarios',    label: 'Usuarios' },
]

export function SearchClient({ query, initialResults, initialTab }: Props) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab]   = useState<TabId>(initialTab)
  const [localQuery, setLocalQuery] = useState(query)
  const [results, setResults]       = useState<SearchResults>(initialResults)
  const [isSearching, startTransition] = useTransition()

  // Sincronizar con la URL
  useEffect(() => {
    setLocalQuery(query)
    setResults(initialResults)
  }, [query, initialResults])

  const handleSearch = useCallback((q: string) => {
    if (q.trim().length < 2) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('q', q.trim())
    params.set('tab', activeTab)
    router.push(`/buscar?${params.toString()}`)
  }, [activeTab, router, searchParams])

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    if (localQuery) params.set('q', localQuery)
    router.push(`/buscar?${params.toString()}`)
  }

  const hasQuery = query.trim().length >= 2

  const countByTab = (tab: TabId) => {
    if (tab === 'anime')       return results.anime?.length ?? 0
    if (tab === 'comunidades') return results.communities?.length ?? 0
    if (tab === 'usuarios')    return results.users?.length ?? 0
    return 0
  }

  return (
    <div className="search-page">
      {/* Header + buscador */}
      <div className="search-header">
        <h1 className="search-title">
          {hasQuery ? (
            <>Resultados para <span className="search-query-highlight">"{query}"</span></>
          ) : (
            'Buscar en Kuroshi.tv'
          )}
        </h1>

        <form
          onSubmit={e => { e.preventDefault(); handleSearch(localQuery) }}
          className="search-form"
          role="search"
        >
          <div className="search-input-wrapper">
            <svg className="search-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="search"
              value={localQuery}
              onChange={e => setLocalQuery(e.target.value)}
              placeholder="Buscar anime, comunidades, usuarios..."
              className="search-input"
              minLength={2}
              aria-label="Buscar en Kuroshi.tv"
              autoFocus={!hasQuery}
            />
            {localQuery.length >= 2 && (
              <button type="submit" className="search-submit" aria-label="Buscar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </form>
      </div>

      <AdBanner />

      {/* Sin query */}
      {!hasQuery && (
        <div className="search-empty-state">
          <div className="search-hint-grid">
            {[
              { icon: '🎌', label: 'Busca por título', example: 'Attack on Titan' },
              { icon: '🎭', label: 'Busca por género', example: 'Isekai romance' },
              { icon: '🏘️', label: 'Encuentra comunidades', example: 'Naruto fans' },
              { icon: '👤', label: 'Encuentra usuarios', example: '@otaku_san' },
            ].map(h => (
              <button
                key={h.example}
                onClick={() => { setLocalQuery(h.example); handleSearch(h.example) }}
                className="search-hint-card"
                aria-label={`Buscar ${h.example}`}
              >
                <span className="hint-icon" aria-hidden="true">{h.icon}</span>
                <span className="hint-label">{h.label}</span>
                <span className="hint-example">{h.example}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resultados */}
      {hasQuery && (
        <>
          {/* Tabs */}
          <div className="search-tabs" role="tablist" aria-label="Tipo de resultado">
            {TABS.map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`search-tab ${activeTab === tab.id ? 'search-tab--active' : ''}`}
              >
                {tab.label}
                <span className="search-tab-count">{countByTab(tab.id)}</span>
              </button>
            ))}
          </div>

          {/* Contenido del tab */}
          <div
            role="tabpanel"
            aria-label={`Resultados de ${activeTab}`}
            className="search-results"
          >
            {isSearching ? (
              <SearchSkeleton />
            ) : (
              <>
                {activeTab === 'anime' && (
                  <AnimeResults animes={results.anime ?? []} query={query} />
                )}
                {activeTab === 'comunidades' && (
                  <CommunityResults communities={results.communities ?? []} query={query} />
                )}
                {activeTab === 'usuarios' && (
                  <UserResults users={results.users ?? []} query={query} />
                )}
              </>
            )}
          </div>
        </>
      )}

      <style>{`
        .search-page {
          max-width: 860px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        /* Header */
        .search-header { display: flex; flex-direction: column; gap: 1.25rem; }
        .search-title {
          font-family: var(--font-display);
          font-size: clamp(1.5rem, 3.5vw, 2rem);
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          margin: 0;
        }
        .search-query-highlight { color: var(--accent); }

        /* Formulario de búsqueda */
        .search-form { width: 100%; }
        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--bg-surface);
          border: 1px solid var(--border-hover);
          border-radius: var(--radius-full);
          transition: border-color var(--transition-fast);
        }
        .search-input-wrapper:focus-within { border-color: var(--border-focus); }
        .search-input-icon {
          position: absolute;
          left: 1.25rem;
          color: var(--text-muted);
          flex-shrink: 0;
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3.25rem;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 1rem;
          -webkit-appearance: none;
        }
        .search-input::placeholder { color: var(--text-muted); }
        .search-input::-webkit-search-cancel-button { display: none; }
        .search-submit {
          position: absolute;
          right: 0.75rem;
          width: 36px;
          height: 36px;
          background: var(--accent);
          border: none;
          border-radius: 50%;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background var(--transition-fast), transform var(--transition-fast);
        }
        .search-submit:hover { background: var(--accent-dim); transform: scale(1.05); }

        /* Estado vacío */
        .search-empty-state { padding: 1rem 0; }
        .search-hint-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.875rem;
        }
        .search-hint-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.375rem;
          padding: 1.25rem;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          cursor: pointer;
          text-align: left;
          transition: all var(--transition-fast);
        }
        .search-hint-card:hover { border-color: var(--border-hover); background: var(--bg-elevated); transform: translateY(-2px); }
        .hint-icon { font-size: 1.5rem; }
        .hint-label { font-family: var(--font-display); font-size: 0.8125rem; font-weight: 700; color: var(--text-secondary); }
        .hint-example { font-family: var(--font-display); font-size: 0.75rem; color: var(--text-muted); }

        /* Tabs */
        .search-tabs {
          display: flex;
          gap: 0;
          border-bottom: 1px solid var(--border);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .search-tabs::-webkit-scrollbar { display: none; }
        .search-tab {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          transition: color var(--transition-fast);
        }
        .search-tab:hover { color: var(--text-secondary); }
        .search-tab--active { color: var(--text-primary); }
        .search-tab--active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent);
          border-radius: var(--radius-full);
        }
        .search-tab-count {
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--text-muted);
          background: var(--bg-overlay);
          border-radius: var(--radius-full);
          padding: 0.1rem 0.45rem;
        }
        .search-tab--active .search-tab-count { color: var(--accent); background: var(--accent-glow); }

        .search-results { animation: fade-in 0.2s ease; }

        @media (max-width: 540px) {
          .search-hint-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}

/* ─── Resultados de anime ─────────────────────────────────── */

function AnimeResults({ animes, query }: { animes: AnimeSummary[]; query: string }) {
  if (animes.length === 0) return <EmptyResults tab="anime" query={query} />

  return (
    <div className="anime-results">
      {animes.map((anime, i) => (
        <Link
          key={anime.id}
          href={`/anime/${anime.slug}`}
          className="anime-result-row animate-fade-in"
          style={{ animationDelay: `${i * 0.04}s` }}
          aria-label={anime.title_es}
        >
          <div className="result-img-wrapper">
            <Image src={anime.cover_url} alt="" fill sizes="64px" className="result-img" aria-hidden="true" />
          </div>
          <div className="result-info">
            <h3 className="result-title">{highlight(anime.title_es, query)}</h3>
            {anime.title_jp && (
              <p className="result-subtitle">{anime.title_jp}</p>
            )}
            <div className="result-meta">
              {anime.genres?.slice(0, 3).map(g => (
                <span key={g.id} className="result-tag">{g.name}</span>
              ))}
              {anime.mal_rating && (
                <span className="result-rating">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--amber)' }} aria-hidden="true">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  {anime.mal_rating.toFixed(1)}
                </span>
              )}
              <span className={`result-status result-status--${anime.status}`}>
                {anime.status === 'en_emision' ? 'En emisión' : anime.status === 'finalizado' ? 'Finalizado' : 'Próximamente'}
              </span>
            </div>
          </div>
          <svg className="result-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      ))}

      <style>{`
        .anime-results {
          display: flex;
          flex-direction: column;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          overflow: hidden;
        }
        .anime-result-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.875rem 1.25rem;
          border-bottom: 1px solid var(--border);
          text-decoration: none;
          transition: background var(--transition-fast);
        }
        .anime-result-row:last-child { border-bottom: none; }
        .anime-result-row:hover { background: var(--bg-elevated); }
        .anime-result-row:hover .result-arrow { color: var(--accent); transform: translateX(3px); }

        .result-img-wrapper { position: relative; width: 48px; height: 68px; border-radius: var(--radius-md); overflow: hidden; background: var(--bg-elevated); flex-shrink: 0; }
        .result-img { object-fit: cover; }
        .result-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.3rem; }
        .result-title { font-family: var(--font-display); font-size: 0.9375rem; font-weight: 700; color: var(--text-primary); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .result-subtitle { font-size: 0.8125rem; color: var(--text-muted); font-style: italic; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .result-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 0.375rem; }
        .result-tag { font-family: var(--font-display); font-size: 0.625rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); background: var(--bg-overlay); border-radius: var(--radius-full); padding: 0.15rem 0.5rem; }
        .result-rating { display: flex; align-items: center; gap: 0.2rem; font-family: var(--font-display); font-size: 0.75rem; font-weight: 700; color: var(--amber); }
        .result-status { font-family: var(--font-display); font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-radius: var(--radius-full); padding: 0.15rem 0.5rem; }
        .result-status--en_emision { color: #4ade80; background: rgba(74,222,128,0.1); }
        .result-status--finalizado { color: var(--text-muted); background: var(--bg-overlay); }
        .result-status--proximamente { color: var(--amber); background: rgba(244,162,97,0.1); }
        .result-arrow { color: var(--text-muted); flex-shrink: 0; transition: color var(--transition-fast), transform var(--transition-fast); }
      `}</style>
    </div>
  )
}

/* ─── Resultados de comunidades ──────────────────────────── */

function CommunityResults({ communities, query }: { communities: Community[]; query: string }) {
  if (communities.length === 0) return <EmptyResults tab="comunidades" query={query} />

  return (
    <div className="comm-results">
      {communities.map((c, i) => (
        <Link
          key={c.id}
          href={`/comunidad/${c.slug}`}
          className="comm-result-row animate-fade-in"
          style={{ animationDelay: `${i * 0.04}s` }}
          aria-label={c.name}
        >
          <div className="comm-result-img">
            {c.avatar_url ? (
              <Image src={c.avatar_url} alt="" fill sizes="48px" className="result-img" aria-hidden="true" />
            ) : (
              <span className="comm-result-fallback" aria-hidden="true">{c.name[0]}</span>
            )}
          </div>
          <div className="result-info">
            <div className="comm-result-name-row">
              <h3 className="result-title">{highlight(c.name, query)}</h3>
              {c.type === 'oficial' && <span className="comm-result-official">Oficial</span>}
            </div>
            {c.description && (
              <p className="comm-result-desc">{c.description}</p>
            )}
            <span className="comm-result-members">{c.members_count.toLocaleString('es')} miembros</span>
          </div>
          <button className="comm-result-join" aria-label={`Unirse a ${c.name}`}>
            Unirse
          </button>
        </Link>
      ))}

      <style>{`
        .comm-results { display: flex; flex-direction: column; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl); overflow: hidden; }
        .comm-result-row { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); text-decoration: none; transition: background var(--transition-fast); }
        .comm-result-row:last-child { border-bottom: none; }
        .comm-result-row:hover { background: var(--bg-elevated); }
        .comm-result-img { position: relative; width: 48px; height: 48px; border-radius: var(--radius-lg); overflow: hidden; background: var(--accent); flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .comm-result-fallback { font-family: var(--font-display); font-size: 1.125rem; font-weight: 800; color: #fff; }
        .comm-result-name-row { display: flex; align-items: center; gap: 0.5rem; }
        .comm-result-official { font-family: var(--font-display); font-size: 0.5625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #60a5fa; background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.2); border-radius: var(--radius-full); padding: 0.15rem 0.45rem; }
        .comm-result-desc { font-size: 0.8125rem; color: var(--text-muted); margin: 0; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .comm-result-members { font-family: var(--font-display); font-size: 0.75rem; font-weight: 600; color: var(--text-muted); }
        .comm-result-join { padding: 0.375rem 0.875rem; background: var(--accent); color: #fff; font-family: var(--font-display); font-size: 0.8125rem; font-weight: 700; border: none; border-radius: var(--radius-md); cursor: pointer; flex-shrink: 0; transition: background var(--transition-fast); }
        .comm-result-join:hover { background: var(--accent-dim); }
      `}</style>
    </div>
  )
}

/* ─── Resultados de usuarios ─────────────────────────────── */

function UserResults({ users, query }: { users: UserPublicProfile[]; query: string }) {
  if (users.length === 0) return <EmptyResults tab="usuarios" query={query} />

  return (
    <div className="user-results">
      {users.map((user, i) => (
        <Link
          key={user.id}
          href={`/u/${user.username}`}
          className="user-result-row animate-fade-in"
          style={{ animationDelay: `${i * 0.04}s` }}
          aria-label={`Perfil de ${user.username}`}
        >
          <div className="user-result-avatar">
            {user.avatar_url ? (
              <Image src={user.avatar_url} alt="" width={48} height={48} className="user-result-img" aria-hidden="true" />
            ) : (
              <span className="user-result-fallback" aria-hidden="true">{user.username[0].toUpperCase()}</span>
            )}
          </div>
          <div className="result-info">
            <h3 className="result-title">{highlight(user.username, query)}</h3>
            {user.bio && <p className="user-result-bio">{user.bio}</p>}
            <div className="result-meta">
              <span className="result-tag">{user.stats.episodes_watched} eps vistos</span>
              <span className="result-tag">{user.stats.friends_count} amigos</span>
            </div>
          </div>
          <svg className="result-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      ))}

      <style>{`
        .user-results { display: flex; flex-direction: column; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl); overflow: hidden; }
        .user-result-row { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); text-decoration: none; transition: background var(--transition-fast); }
        .user-result-row:last-child { border-bottom: none; }
        .user-result-row:hover { background: var(--bg-elevated); }
        .user-result-row:hover .result-arrow { color: var(--accent); transform: translateX(3px); }
        .user-result-avatar { position: relative; width: 48px; height: 48px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: var(--accent); display: flex; align-items: center; justify-content: center; }
        .user-result-img { width: 48px; height: 48px; object-fit: cover; border-radius: 50%; }
        .user-result-fallback { font-family: var(--font-display); font-size: 1.125rem; font-weight: 800; color: #fff; }
        .user-result-bio { font-size: 0.8125rem; color: var(--text-muted); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .result-arrow { color: var(--text-muted); flex-shrink: 0; transition: color var(--transition-fast), transform var(--transition-fast); }
      `}</style>
    </div>
  )
}

/* ─── Sin resultados ─────────────────────────────────────── */

function EmptyResults({ tab, query }: { tab: TabId; query: string }) {
  const labels = { anime: 'anime', comunidades: 'comunidades', usuarios: 'usuarios' }
  return (
    <div className="empty-results">
      <span aria-hidden="true">🔍</span>
      <h3>Sin resultados</h3>
      <p>No encontramos {labels[tab]} que coincidan con <strong>"{query}"</strong>.</p>
      <style>{`
        .empty-results { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 4rem 2rem; text-align: center; color: var(--text-muted); }
        .empty-results span { font-size: 2.5rem; }
        .empty-results h3 { font-family: var(--font-display); font-size: 1.125rem; color: var(--text-secondary); margin: 0; }
        .empty-results p { font-size: 0.9375rem; margin: 0; }
        .empty-results strong { color: var(--text-primary); }
      `}</style>
    </div>
  )
}

/* ─── Skeleton de carga ──────────────────────────────────── */

function SearchSkeleton() {
  return (
    <div className="search-skeleton">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="search-sk-row">
          <div className="skeleton search-sk-img" />
          <div className="search-sk-content">
            <div className="skeleton search-sk-title" style={{ width: `${40 + i * 10}%` }} />
            <div className="skeleton search-sk-sub" style={{ width: `${25 + i * 7}%` }} />
          </div>
        </div>
      ))}
      <style>{`
        .search-skeleton { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl); overflow: hidden; }
        .search-sk-row { display: flex; align-items: center; gap: 1rem; padding: 0.875rem 1.25rem; border-bottom: 1px solid var(--border); }
        .search-sk-row:last-child { border-bottom: none; }
        .search-sk-img { width: 48px; height: 68px; border-radius: var(--radius-md); flex-shrink: 0; }
        .search-sk-content { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
        .search-sk-title { height: 16px; border-radius: 4px; }
        .search-sk-sub { height: 13px; border-radius: 3px; }
      `}</style>
    </div>
  )
}

/* ─── Highlight helper ───────────────────────────────────── */
// Resalta la query dentro del texto con un span coloreado

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts  = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} style={{ background: 'var(--accent-glow)', color: 'var(--accent)', borderRadius: 2, padding: '0 1px' }}>{part}</mark>
          : part
      )}
    </>
  )
}
