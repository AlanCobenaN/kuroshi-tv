'use client'
// app/u/[username]/ProfileBanner.tsx
import Image from 'next/image'
import Link from 'next/link'
import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { UserPublicProfile } from '@/types'
import { usersApi } from '@/lib/api'
import { useFriendshipRealtime, FriendshipUpdatePayload } from '@/hooks/useFriendshipRealtime'

interface Props {
  profile: UserPublicProfile
  isOwnProfile: boolean
  isLoggedIn: boolean
  currentUserId?: string
}

export function ProfileBanner({ profile, isOwnProfile, isLoggedIn, currentUserId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [friendshipStatus, setFriendshipStatus] = useState<string | null | undefined>(
    profile.friendship_status
  )
  const router = useRouter()
  const bannerUrl = profile.favorite_anime?.banner_url ?? profile.favorite_anime?.cover_url

  // Sincronizar cuando cambie el perfil (navegación entre usuarios)
  useEffect(() => {
    setFriendshipStatus(profile.friendship_status)
  }, [profile.id, profile.friendship_status])

  // Escuchar actualizaciones en tiempo real del estado de amistad
  const handleFriendshipUpdate = useCallback((payload: FriendshipUpdatePayload) => {
    if (payload.other_user_id === profile.id) {
      setFriendshipStatus(payload.status)
    }
  }, [profile.id])

  useFriendshipRealtime(currentUserId, handleFriendshipUpdate)

  const handleFriendRequest = () => {
    const token = (window as any).__kuroshi_token__ as string | undefined
    if (!token) return
    startTransition(async () => {
      try {
        await usersApi.sendFriendRequest(profile.username, token)
        setFriendshipStatus('pendiente')
        router.refresh()
      } catch {}
    })
  }

  // Formato "Se unió desde Junio 2024"
  const joinDate = profile.created_at ? new Date(profile.created_at) : null
  const validDate = joinDate && !isNaN(joinDate.getTime())
  const joinLabel = validDate ? joinDate.toLocaleDateString('es-LA', { month: 'long', year: 'numeric' }) : 'siempre'

  const ROLE_BADGE: Record<string, { label: string; color: string }> = {
    owner:     { label: 'Owner',     color: 'var(--accent)' },
    moderador: { label: 'Moderador', color: 'var(--amber)' },
    usuario:   { label: '',          color: '' },
  }
  const roleBadge = ROLE_BADGE[profile.role]

  return (
    <div className="profile-banner-wrapper">
      {/* Banner a sangre */}
      <div className="profile-banner">
        {bannerUrl ? (
          <Image
            src={bannerUrl}
            alt=""
            fill
            sizes="100vw"
            className="profile-banner-img"
            priority
            aria-hidden="true"
          />
        ) : (
          <div className="profile-banner-fallback" aria-hidden="true" />
        )}
        <div className="profile-banner-grad" aria-hidden="true" />
      </div>

      {/* Contenido del perfil */}
      <div className="profile-header container">
        {/* Avatar */}
        <div className="profile-avatar-wrapper">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={`Avatar de ${profile.username}`}
              width={96}
              height={96}
              className="profile-avatar-img"
              priority
            />
          ) : (
            <div className="profile-avatar-fallback" aria-hidden="true">
              {profile.username[0].toUpperCase()}
            </div>
          )}
          {/* Indicador de rango */}
          {profile.rank && (
            <div className="profile-rank-badge" title={`Rango: ${profile.rank.name}`}>
              <span>{profile.rank.name[0]}</span>
            </div>
          )}
        </div>

        {/* Info principal */}
        <div className="profile-identity">
          <div className="profile-identity-top">
            <h1 className="profile-username">{profile.username}</h1>
            {profile.email_verified && (
              <span className="profile-verified-badge" title="Email verificado">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Verificado
              </span>
            )}
            {roleBadge?.label && (
              <span
                className="profile-role-badge"
                style={{ color: roleBadge.color, borderColor: roleBadge.color, background: roleBadge.color + '18' }}
              >
                {roleBadge.label}
              </span>
            )}
          </div>

          {profile.bio && (
            <p className="profile-bio">{profile.bio}</p>
          )}

          <p className="profile-since">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            Se unió desde {joinLabel}
          </p>

          {profile.rank && (
            <div className="profile-xp-bar" aria-label={`XP: ${profile.xp}`}>
              <div className="profile-xp-label">
                <span className="profile-rank-name">{profile.rank.name}</span>
                <span className="profile-xp-value">{profile.xp.toLocaleString('es')} XP</span>
              </div>
              <div className="profile-xp-track">
                <div
                  className="profile-xp-fill"
                  style={{
                    width: `${Math.min(100, (profile.xp / (profile.rank.xp_required || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="profile-actions">
          {isOwnProfile ? (
            <Link href="/configuracion" className="profile-action-btn profile-action-btn--ghost">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Editar perfil
            </Link>
          ) : isLoggedIn ? (
            <>
              {friendshipStatus === 'aceptada' ? (
                <span className="profile-action-btn profile-action-btn--sent" style={{ cursor: 'default' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Amigos
                </span>
              ) : friendshipStatus === 'pendiente' ? (
                <span className="profile-action-btn profile-action-btn--sent" style={{ cursor: 'default' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Solicitud enviada
                </span>
              ) : (
                <button
                  onClick={handleFriendRequest}
                  disabled={isPending || friendshipStatus === 'pendiente'}
                  className="profile-action-btn profile-action-btn--primary"
                  aria-label="Enviar solicitud de amistad"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                  Agregar amigo
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>

      <style>{`
        .profile-banner-wrapper {
          position: relative;
          /* Solapar con el nav */
          margin-top: calc(var(--total-nav) * -1);
          padding-top: var(--total-nav);
          margin-bottom: 0;
        }

        /* Banner */
        .profile-banner {
          position: relative;
          height: 240px;
        }
        .profile-banner-img {
          object-fit: cover;
          object-position: center 25%;
          filter: brightness(0.5) saturate(1.2);
        }
        .profile-banner-fallback {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-overlay) 100%);
        }
        .profile-banner-grad {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, var(--bg-base) 0%, rgba(10,10,15,0.2) 60%, transparent 100%);
        }

        /* Header del perfil */
        .profile-header {
          position: relative;
          margin-top: -56px;
          display: flex;
          align-items: flex-end;
          gap: 1.5rem;
          flex-wrap: wrap;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        /* Avatar */
        .profile-avatar-wrapper {
          position: relative;
          flex-shrink: 0;
        }
        .profile-avatar-img {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid var(--bg-base);
          background: var(--bg-elevated);
        }
        .profile-avatar-fallback {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: var(--accent);
          color: #fff;
          font-family: var(--font-display);
          font-size: 2.25rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid var(--bg-base);
        }
        .profile-rank-badge {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 24px;
          height: 24px;
          background: var(--amber);
          border-radius: 50%;
          border: 2px solid var(--bg-base);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 0.625rem;
          font-weight: 800;
          color: var(--bg-base);
        }

        /* Identidad */
        .profile-identity {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding-bottom: 0.25rem;
        }
        .profile-identity-top {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          flex-wrap: wrap;
        }
        .profile-username {
          font-family: var(--font-display);
          font-size: clamp(1.375rem, 3vw, 1.875rem);
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          margin: 0;
        }
        .profile-role-badge {
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 0.2rem 0.625rem;
          border-radius: var(--radius-full);
          border: 1px solid;
        }
        .profile-bio {
          font-size: 0.9375rem;
          color: var(--text-secondary);
          line-height: 1.55;
          margin: 0;
          max-width: 480px;
        }
        .profile-since {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          margin: 0;
        }

        /* XP bar */
        .profile-xp-bar { display: flex; flex-direction: column; gap: 0.3rem; max-width: 260px; }
        .profile-xp-label { display: flex; justify-content: space-between; align-items: center; }
        .profile-rank-name {
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--amber);
          letter-spacing: 0.04em;
        }
        .profile-xp-value {
          font-family: var(--font-display);
          font-size: 0.6875rem;
          color: var(--text-muted);
        }
        .profile-xp-track {
          height: 4px;
          background: var(--bg-overlay);
          border-radius: var(--radius-full);
          overflow: hidden;
        }
        .profile-xp-fill {
          height: 100%;
          background: linear-gradient(to right, var(--amber), var(--accent));
          border-radius: var(--radius-full);
          transition: width 0.8s ease;
        }

        /* Acciones */
        .profile-actions { margin-left: auto; padding-bottom: 0.25rem; flex-shrink: 0; }
        .profile-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1.125rem;
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: var(--radius-md);
          cursor: pointer;
          border: 1px solid;
          text-decoration: none;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        .profile-action-btn--primary {
          background: var(--accent);
          color: #fff;
          border-color: var(--accent);
        }
        .profile-action-btn--primary:hover {
          background: var(--accent-dim);
          transform: translateY(-1px);
        }
        .profile-action-btn--ghost {
          background: transparent;
          color: var(--text-secondary);
          border-color: var(--border-hover);
        }
        .profile-action-btn--ghost:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }
        .profile-action-btn--sent {
          background: transparent;
          color: #4ade80;
          border-color: rgba(74,222,128,0.3);
          cursor: default;
        }
        .profile-action-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .profile-verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.2rem 0.625rem;
          background: rgba(74,222,128,0.1);
          border: 1px solid rgba(74,222,128,0.25);
          border-radius: var(--radius-full);
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 700;
          color: #4ade80;
          white-space: nowrap;
          line-height: 1.4;
        }

        @media (max-width: 640px) {
          .profile-header { flex-direction: column; align-items: flex-start; gap: 1rem; margin-top: -48px; }
          .profile-actions { margin-left: 0; }
          .profile-avatar-img, .profile-avatar-fallback { width: 80px; height: 80px; }
        }
      `}</style>
    </div>
  )
}
