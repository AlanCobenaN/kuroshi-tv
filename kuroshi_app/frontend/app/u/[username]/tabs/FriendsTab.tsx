'use client'
// app/u/[username]/tabs/FriendsTab.tsx
import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Friendship } from '@/types'
import { usersApi } from '@/lib/api'

interface Props {
  username: string
  isOwnProfile: boolean
  accessToken?: string
}

export function FriendsTab({ username, isOwnProfile, accessToken }: Props) {
  const [friends, setFriends] = useState<Friendship[]>([])
  const [pending, setPending] = useState<Friendship[]>([])
  const [isLoading, setIsLoading]    = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setIsLoading(true)
    usersApi.getFriends(username, accessToken)
      .then((data: any) => {
        const items: Friendship[] = Array.isArray(data) ? data : data.data ?? []
        setFriends(items)
      })
      .catch(() => setFriends([]))
      .finally(() => setIsLoading(false))
  }, [username, accessToken])

  const handleRespond = (id: string, action: 'aceptada' | 'rechazada') => {
    if (!accessToken) return
    startTransition(async () => {
      try {
        await usersApi.respondFriendRequest(id, action, accessToken)
        setPending(prev => prev.filter(f => f.id !== id))
        if (action === 'aceptada') {
          // Refrescar lista de amigos
        }
      } catch {}
    })
  }

  if (isLoading) {
    return (
      <div className="friends-skeleton">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12 }} />
        ))}
        <style>{`
          .friends-skeleton { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem; }
        `}</style>
      </div>
    )
  }

  return (
    <div className="friends-tab">
      {/* Solicitudes pendientes — solo en perfil propio */}
      {isOwnProfile && pending.length > 0 && (
        <div className="friends-pending">
          <h3 className="friends-section-title">
            Solicitudes pendientes
            <span className="friends-pending-count">{pending.length}</span>
          </h3>
          <div className="friends-pending-list">
            {pending.map(req => (
              <div key={req.id} className="pending-row">
                <div className="friend-avatar-wrapper">
                  {req.user?.avatar_url ? (
                    <Image src={req.user.avatar_url} alt={req.user.username ?? ''} width={40} height={40} className="friend-avatar" />
                  ) : (
                    <div className="friend-avatar-fallback">{req.user?.username?.[0]?.toUpperCase()}</div>
                  )}
                </div>
                <div className="friend-info">
                  <span className="friend-name">{req.user?.username}</span>
                  <span className="friend-meta">quiere ser tu amigo</span>
                </div>
                <div className="pending-actions">
                  <button
                    onClick={() => handleRespond(req.id, 'aceptada')}
                    disabled={isPending}
                    className="pending-btn pending-btn--accept"
                    aria-label="Aceptar solicitud"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </button>
                  <button
                    onClick={() => handleRespond(req.id, 'rechazada')}
                    disabled={isPending}
                    className="pending-btn pending-btn--reject"
                    aria-label="Rechazar solicitud"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de amigos */}
      {friends.length === 0 ? (
        <div className="friends-empty">
          <span aria-hidden="true">👥</span>
          <p>{isOwnProfile ? 'Aún no tienes amigos. ¡Busca usuarios para agregar!' : 'Este usuario no tiene amigos visibles.'}</p>
        </div>
      ) : (
        <div className="friends-grid">
          {friends.map(f => {
            const friend = f.user
            if (!friend) return null
            return (
              <Link key={f.id} href={`/u/${friend.username}`} className="friend-card">
                <div className="friend-avatar-wrapper">
                  {friend.avatar_url ? (
                    <Image src={friend.avatar_url} alt={friend.username} width={48} height={48} className="friend-avatar" />
                  ) : (
                    <div className="friend-avatar-fallback">{friend.username[0].toUpperCase()}</div>
                  )}
                </div>
                <div className="friend-info">
                  <span className="friend-name">{friend.username}</span>
                  {friend.bio && <span className="friend-bio">{friend.bio}</span>}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <style>{`
        .friends-tab { display: flex; flex-direction: column; gap: 1.5rem; }

        /* Pendientes */
        .friends-pending { display: flex; flex-direction: column; gap: 0.75rem; }
        .friends-section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .friends-pending-count {
          background: var(--accent);
          color: #fff;
          font-size: 0.625rem;
          font-weight: 800;
          min-width: 18px;
          height: 18px;
          border-radius: var(--radius-full);
          padding: 0 0.3rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .friends-pending-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .pending-row {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.75rem;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
        }
        .pending-actions { display: flex; gap: 0.375rem; margin-left: auto; }
        .pending-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }
        .pending-btn--accept { background: rgba(74,222,128,0.15); color: #4ade80; }
        .pending-btn--accept:hover { background: rgba(74,222,128,0.25); }
        .pending-btn--reject { background: var(--accent-glow); color: var(--accent); }
        .pending-btn--reject:hover { background: rgba(230,57,70,0.2); }
        .pending-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Avatar compartido */
        .friend-avatar-wrapper { position: relative; flex-shrink: 0; }
        .friend-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
        .friend-avatar-fallback {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--bg-overlay);
          color: var(--text-secondary);
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .friend-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.15rem; }
        .friend-name { font-family: var(--font-display); font-size: 0.875rem; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .friend-meta { font-size: 0.75rem; color: var(--text-muted); }
        .friend-bio { font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Grid de amigos */
        .friends-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.75rem; }
        .friend-card {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.875rem;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          text-decoration: none;
          transition: all var(--transition-fast);
        }
        .friend-card:hover { border-color: var(--border-hover); background: var(--bg-elevated); transform: translateY(-1px); }
        .friend-card .friend-avatar { width: 48px; height: 48px; }
        .friend-card .friend-avatar-fallback { width: 48px; height: 48px; }

        /* Empty */
        .friends-empty { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 3rem; text-align: center; color: var(--text-muted); }
        .friends-empty span { font-size: 2rem; }
        .friends-empty p { margin: 0; max-width: 300px; }
      `}</style>
    </div>
  )
}
