'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut, getSession } from 'next-auth/react'
import Image from 'next/image'
import { usersApi, authApi } from '@/lib/api'
import { userNotificationsChannel } from '@/lib/supabase'
import { WsNotification } from '@/types'

export function Header() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [notifCount, setNotifCount] = useState(0)
  const [freshAvatar, setFreshAvatar] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    if (!session?.accessToken) return
    usersApi.getNotifications({ page: 1 }, session.accessToken)
      .then((data: any) => {
        const items: any[] = Array.isArray(data) ? data : data.data ?? []
        setNotifCount(items.filter((n: any) => !n.is_read).length)
      })
      .catch(() => {})
  }, [session?.accessToken])

  // Suscripción en tiempo real a nuevas notificaciones
  useEffect(() => {
    if (!session?.user?.id) return

    const channel = userNotificationsChannel(session.user.id)
    if (!channel) return

    channel
      .on('broadcast', { event: 'notification' }, ({ payload }: { payload: WsNotification }) => {
        setNotifCount(prev => prev + 1)
      })
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [session?.user?.id])

  // Sync fresh avatar from API when session exists
  useEffect(() => {
    if (!session?.accessToken) {
      setFreshAvatar(undefined)
      return
    }
    authApi.me(session.accessToken)
      .then((data: any) => {
        const url = data?.avatarUrl ?? data?.avatar_url ?? null
        setFreshAvatar(url)
        // If session has a different avatar, update it
        const current = session.user?.avatar_url ?? session.user?.image ?? null
        if (url && url !== current) {
          update({ avatar_url: url, image: url })
        }
      })
      .catch(() => {})
  }, [session?.accessToken])

  const resolveAvatar = (user: { avatar_url?: string | null; image?: string | null } | null | undefined): string | null => {
    return freshAvatar ?? user?.avatar_url ?? user?.image ?? null
  }
  const [query, setQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const mobileSearchBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-focus search input when mobile search opens
  useEffect(() => {
    if (mobileSearchOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [mobileSearchOpen])

  // Close mobile search on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && mobileSearchOpen) {
        setMobileSearchOpen(false)
        setQuery('')
        searchRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileSearchOpen])

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = query.trim()
      if (trimmed.length < 2) return
      router.push(`/buscar?q=${encodeURIComponent(trimmed)}`)
      setQuery('')
      setMobileSearchOpen(false)
      searchRef.current?.blur()
    },
    [query, router]
  )

  const openMobileSearch = () => {
    setMobileSearchOpen(true)
  }

  return (
    <header className="kuroshi-header">
      {/* Logo — hidden on mobile when search is open */}
      <Link
        href="/"
        className={`kuroshi-logo ${mobileSearchOpen ? 'logo-hidden-mobile' : ''}`}
        aria-label="Kuroshi.lat — inicio"
      >
        <span className="logo-kuro">kuro</span>
        <span className="logo-shi">shi</span>
        <span className="logo-tv">.lat</span>
      </Link>

      {/* Buscador central */}
      <form
        onSubmit={handleSearch}
        className={`kuroshi-search-form ${isSearchFocused ? 'focused' : ''} ${mobileSearchOpen ? 'mobile-open' : ''}`}
        role="search"
      >
        <svg
          className="search-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={(e) => {
            setIsSearchFocused(false)
            // On mobile, close search if empty and focus leaves
            if (window.innerWidth < 640 && !query.trim()) {
              // Delay to allow click on search icon to register
              setTimeout(() => {
                if (!e.currentTarget.value) setMobileSearchOpen(false)
              }, 150)
            }
          }}
          placeholder="Buscar anime, comunidades..."
          className="search-input"
          minLength={2}
          aria-label="Buscar en Kuroshi.lat"
        />
        {query.length >= 2 && (
          <kbd className="search-hint search-hint-desktop">Enter ↵</kbd>
        )}
        {/* Close button on mobile */}
        <button
          type="button"
          className="mobile-search-close"
          onClick={() => {
            setMobileSearchOpen(false)
            setQuery('')
            searchRef.current?.blur()
          }}
          aria-label="Cerrar búsqueda"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </form>

      {/* Acciones de la derecha */}
      <div className={`header-actions ${mobileSearchOpen ? 'actions-hidden-mobile' : ''}`}>
        {/* Mobile search trigger */}
        <button
          ref={mobileSearchBtnRef}
          className="icon-btn mobile-search-trigger"
          onClick={openMobileSearch}
          aria-label="Buscar"
          title="Buscar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </button>

        {session ? (
          <>
            {/* Buscar usuarios */}
            <Link
              href="/buscar?tab=usuarios"
              className="icon-btn"
              aria-label="Buscar usuarios"
              title="Buscar usuarios"
            >
              <UserSearchIcon />
            </Link>

            {/* Notificaciones */}
            <Link
              href="/notificaciones"
              className="icon-btn notif-bell"
              aria-label={`Notificaciones${notifCount > 0 ? ` (${notifCount} sin leer)` : ''}`}
              title="Notificaciones"
            >
              <BellIcon />
              {notifCount > 0 && (
                <span className="notif-bell-badge" aria-hidden="true">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </Link>

            {/* Avatar + menú */}
            <div ref={menuRef} className="user-menu-wrapper">
              <button
                onClick={() => setShowUserMenu(v => !v)}
                className="avatar-btn"
                aria-expanded={showUserMenu}
                aria-haspopup="menu"
                aria-label={`Menú de ${session.user.username}`}
              >
                {resolveAvatar(session.user) ? (
                  <Image
                    src={resolveAvatar(session.user)!}
                    alt={session.user.username}
                    width={32}
                    height={32}
                    className="avatar-img"
                  />
                ) : (
                  <span className="avatar-fallback">
                    {session.user.username[0].toUpperCase()}
                  </span>
                )}
                <ChevronIcon open={showUserMenu} />
              </button>

              {showUserMenu && (
                <nav className="user-dropdown" role="menu">
                  <div className="dropdown-user-info">
                    {resolveAvatar(session.user) ? (
                      <Image src={resolveAvatar(session.user)!} alt="" width={40} height={40} className="dropdown-avatar" />
                    ) : (
                      <span className="dropdown-avatar-fallback">{session.user.username[0].toUpperCase()}</span>
                    )}
                    <div className="dropdown-user-text">
                      <span className="dropdown-username">{session.user.username}</span>
                      <span className="dropdown-role">{session.user.role}</span>
                    </div>
                  </div>
                  <hr className="dropdown-divider" />
                  <Link
                    href={`/u/${session.user.username}`}
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Mi perfil
                  </Link>
                  <Link
                    href="/notificaciones"
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Notificaciones
                  </Link>
                  <Link
                    href="/configuracion"
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Configuración
                  </Link>
                  {(session.user.role === 'owner' || session.user.role === 'moderador') && (
                    <Link
                      href="/admin"
                      className="dropdown-item dropdown-item-accent"
                      role="menuitem"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Panel admin
                    </Link>
                  )}
                  <hr className="dropdown-divider" />
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      signOut({ callbackUrl: '/' })
                    }}
                    className="dropdown-item dropdown-item-danger"
                    role="menuitem"
                  >
                    Cerrar sesión
                  </button>
                </nav>
              )}
            </div>
          </>
        ) : (
          <>
            <Link href="/login" className="btn-secondary btn-sm">
              Iniciar sesión
            </Link>
            <Link href="/registro" className="btn-primary btn-sm">
              Registrarse
            </Link>
          </>
        )}
      </div>

      <style>{`
        .kuroshi-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          height: var(--header-height);
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 0 1.5rem;
          background: rgba(10, 10, 15, 0.55);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .kuroshi-logo {
          flex-shrink: 0;
          font-family: var(--font-display);
          font-size: 1.375rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1;
          transition: opacity 0.25s ease, transform 0.25s ease;
        }
        .logo-kuro { color: var(--text-primary); }
        .logo-shi  { color: var(--accent); }
        .logo-tv   { color: var(--text-muted); font-size: 1rem; font-weight: 400; }

        .kuroshi-search-form {
          flex: 1;
          max-width: 520px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0 0.875rem;
          height: 36px;
          background: var(--bg-overlay);
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          transition: border-color var(--transition-fast), background var(--transition-fast);
        }
        .kuroshi-search-form.focused {
          border-color: var(--border-focus);
          background: var(--bg-elevated);
        }
        .search-icon {
          flex-shrink: 0;
          color: var(--text-muted);
        }
        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.875rem;
          -webkit-appearance: none;
          min-width: 0;
        }
        .search-input::placeholder { color: var(--text-muted); }
        .search-input::-webkit-search-cancel-button { display: none; }
        .search-hint {
          flex-shrink: 0;
          font-size: 0.6875rem;
          color: var(--text-muted);
          background: var(--bg-base);
          border: 1px solid var(--border-hover);
          border-radius: 4px;
          padding: 0.1rem 0.35rem;
          font-family: monospace;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-left: auto;
          flex-shrink: 0;
          transition: opacity 0.25s ease, transform 0.25s ease;
        }

        .icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          transition: color var(--transition-fast), background var(--transition-fast);
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .icon-btn:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }

        .notif-bell { position: relative; }
        .notif-bell-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          min-width: 16px;
          height: 16px;
          padding: 0 3px;
          border-radius: var(--radius-full);
          background: var(--accent);
          color: #fff;
          font-family: var(--font-display);
          font-size: 0.625rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          pointer-events: none;
        }

        .btn-sm {
          padding: 0.4rem 0.875rem;
          font-size: 0.8125rem;
          height: 34px;
        }
        @media (max-width: 640px) {
          .btn-sm {
            padding: 0.35rem 0.6rem;
            font-size: 0.75rem;
            height: 30px;
          }
        }

        .avatar-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem;
          background: transparent;
          border: none;
          cursor: pointer;
          border-radius: var(--radius-md);
          transition: background var(--transition-fast);
        }
        .avatar-btn:hover { background: var(--bg-hover); }
        .avatar-img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid var(--border-hover);
        }
        .avatar-fallback {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--accent);
          color: #fff;
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .user-menu-wrapper { position: relative; }
        .user-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 200px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-hover);
          border-radius: var(--radius-lg);
          padding: 0.5rem;
          box-shadow: var(--shadow-lg);
          animation: fade-in-fast 0.15s ease;
        }
        .dropdown-user-info {
          padding: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .dropdown-user-text {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        .dropdown-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid var(--border-hover);
        }
        .dropdown-avatar-fallback {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--accent);
          color: #fff;
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .dropdown-username {
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .dropdown-role {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: capitalize;
        }
        .dropdown-divider {
          border: none;
          border-top: 1px solid var(--border);
          margin: 0.25rem 0;
        }
        .dropdown-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          border-radius: var(--radius-md);
          border: none;
          background: transparent;
          cursor: pointer;
          transition: color var(--transition-fast), background var(--transition-fast);
          font-family: var(--font-body);
          text-decoration: none;
        }
        .dropdown-item:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }
        .dropdown-item-accent { color: var(--amber); }
        .dropdown-item-accent:hover { background: rgba(244, 162, 97, 0.1); }
        .dropdown-item-danger { color: var(--accent); }
        .dropdown-item-danger:hover { background: var(--accent-glow); }

        /* ── Mobile search ───────────────────────────────── */
        .mobile-search-trigger { display: none; }
        .mobile-search-close { display: none; }

        @media (max-width: 640px) {
          .kuroshi-header { gap: 0.35rem; padding: 0 0.5rem; }

          /* Logo hidden when search is open */
          .logo-hidden-mobile {
            opacity: 0;
            transform: scale(0.8);
            pointer-events: none;
            width: 0;
            overflow: hidden;
          }

          /* Search form: hidden by default, full-width when open */
          .kuroshi-search-form {
            display: none;
          }
          .kuroshi-search-form.mobile-open {
            display: flex;
            flex: 1;
            max-width: 100%;
          }

          .search-hint-desktop { display: none; }

          .mobile-search-trigger { display: flex; }
          .mobile-search-close {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            flex-shrink: 0;
            border: none;
            background: transparent;
            color: var(--text-muted);
            cursor: pointer;
            border-radius: var(--radius-md);
            transition: color var(--transition-fast);
          }
          .mobile-search-close:hover { color: var(--text-primary); }

          .header-actions { gap: 0.25rem; }

          /* Hide actions (login/register/avatar) when search is open on mobile */
          .actions-hidden-mobile {
            opacity: 0;
            transform: scale(0.8);
            pointer-events: none;
            width: 0;
            overflow: hidden;
            margin: 0;
          }
        }
      `}</style>
    </header>
  )
}

function UserSearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <path d="m21 21-4.35-4.35" />
      <path d="M10 7v6M7 10h6" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{
        color: 'var(--text-muted)',
        transform: open ? 'rotate(180deg)' : 'none',
        transition: 'transform var(--transition-fast)',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
