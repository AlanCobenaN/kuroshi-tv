'use client'
// app/u/[username]/tabs/CommunitiesTab.tsx
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { usersApi } from '@/lib/api'

interface CommunityEntry {
  id: string
  slug: string
  name: string
  avatar_url?: string
  type: 'oficial' | 'no_oficial'
  members_count: number
  role: 'creador' | 'moderador' | 'miembro'
}

const ROLE_LABEL: Record<string, string> = {
  creador:   'Creador',
  moderador: 'Moderador',
  miembro:   'Miembro',
}

export function CommunitiesTab({ username }: { username: string }) {
  const [communities, setCommunities] = useState<CommunityEntry[]>([])
  const [isLoading, setIsLoading]    = useState(true)

  useEffect(() => {
    setIsLoading(true)
    usersApi.getUserCommunities(username)
      .then((data: any) => {
        const items: CommunityEntry[] = Array.isArray(data) ? data : data.data ?? []
        setCommunities(items)
      })
      .catch(() => setCommunities([]))
      .finally(() => setIsLoading(false))
  }, [username])

  if (isLoading) {
    return (
      <div className="comm-skeleton">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />
        ))}
        <style>{`
          .comm-skeleton { display: flex; flex-direction: column; gap: 0.75rem; }
        `}</style>
      </div>
    )
  }

  if (communities.length === 0) {
    return (
      <div className="comm-empty">
        <span aria-hidden="true">🏘️</span>
        <p>No pertenece a ninguna comunidad aún.</p>
        <Link href="/comunidades" className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
          Explorar comunidades
        </Link>
        <style>{`
          .comm-empty { display: flex; flex-direction: column; align-items: center; gap: 0.875rem; padding: 3rem; text-align: center; color: var(--text-muted); }
          .comm-empty span { font-size: 2rem; }
          .comm-empty p { margin: 0; }
        `}</style>
      </div>
    )
  }

  return (
    <div className="comm-list">
      {communities.map(c => (
        <Link key={c.id} href={`/comunidad/${c.slug}`} className="comm-row">
          <div className="comm-img-wrapper">
            {c.avatar_url ? (
              <Image src={c.avatar_url} alt={c.name} fill sizes="48px" className="comm-img" />
            ) : (
              <div className="comm-img-fallback">{c.name[0]}</div>
            )}
          </div>
          <div className="comm-info">
            <div className="comm-info-top">
              <span className="comm-name">{c.name}</span>
              {c.type === 'oficial' && (
                <span className="comm-official-badge">Oficial</span>
              )}
            </div>
            <span className="comm-meta">{c.members_count.toLocaleString('es')} miembros</span>
          </div>
          <span className="comm-role">{ROLE_LABEL[c.role]}</span>
        </Link>
      ))}

      <style>{`
        .comm-list { display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: var(--radius-xl); overflow: hidden; background: var(--bg-surface); }
        .comm-row { display: flex; align-items: center; gap: 0.875rem; padding: 0.875rem 1rem; text-decoration: none; border-bottom: 1px solid var(--border); transition: background var(--transition-fast); }
        .comm-row:last-child { border-bottom: none; }
        .comm-row:hover { background: var(--bg-elevated); }
        .comm-img-wrapper { position: relative; width: 48px; height: 48px; border-radius: var(--radius-lg); overflow: hidden; background: var(--bg-elevated); flex-shrink: 0; }
        .comm-img { object-fit: cover; }
        .comm-img-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: var(--accent); color: #fff; font-family: var(--font-display); font-size: 1.125rem; font-weight: 800; }
        .comm-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.2rem; }
        .comm-info-top { display: flex; align-items: center; gap: 0.5rem; }
        .comm-name { font-family: var(--font-display); font-size: 0.9375rem; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .comm-official-badge { font-family: var(--font-display); font-size: 0.5625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #60a5fa; background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.2); border-radius: var(--radius-full); padding: 0.1rem 0.4rem; flex-shrink: 0; }
        .comm-meta { font-size: 0.75rem; color: var(--text-muted); }
        .comm-role { font-family: var(--font-display); font-size: 0.75rem; font-weight: 600; color: var(--text-muted); flex-shrink: 0; }
      `}</style>
    </div>
  )
}
