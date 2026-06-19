'use client'
// app/notificaciones/NotificationsClient.tsx
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useNotifications } from '@/hooks/useNotifications'
import { Notification, NotificationType } from '@/types'

interface Props {
  initialNotifications: Notification[]
  initialUnread: number
  userId: string
  accessToken: string
  currentUsername: string
}

// ─── Configuración visual de cada tipo ───────────────────────

const NOTIF_CONFIG: Record<NotificationType, {
  label: string
  icon: React.ReactNode
  color: string
  getLink: (meta: any) => string | undefined
}> = {
  nuevo_ep: {
    label: 'Nuevo episodio',
    color: 'var(--accent)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
    getLink: (meta) => meta?.anime_id
      ? `/anime/${meta.anime_id}/episodio/${meta.episode_number}`
      : undefined,
  },
  like_post: {
    label: 'Like en tu post',
    color: 'var(--accent)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    getLink: (meta) => meta?.community_slug
      ? `/comunidad/${meta.community_slug}`
      : undefined,
  },
  like_comment: {
    label: 'Like en tu comentario',
    color: 'var(--accent)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    getLink: (meta) => meta?.episode_slug
      ? `/anime/${meta.episode_slug}`
      : undefined,
  },
  amistad_recibida: {
    label: 'Solicitud de amistad',
    color: '#60a5fa',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
    getLink: (meta) => meta?.username ? `/u/${meta.username}` : undefined,
  },
  amistad_enviada: {
    label: 'Solicitud enviada',
    color: '#60a5fa',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    getLink: (meta) => meta?.targetUsername ? `/u/${meta.targetUsername}` : undefined,
  },
  amistad_aceptada: {
    label: 'Amistad aceptada',
    color: '#4ade80',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <polyline points="16 11 18 13 22 9" />
      </svg>
    ),
    getLink: (meta) => meta?.username ? `/u/${meta.username}` : undefined,
  },
  logro_desbloqueado: {
    label: 'Logro desbloqueado',
    color: 'var(--amber)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
      </svg>
    ),
    getLink: () => undefined,
  },
  comunidad_promovida: {
    label: 'Comunidad oficial',
    color: '#60a5fa',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    getLink: (meta) => meta?.community_slug
      ? `/comunidad/${meta.community_slug}`
      : undefined,
  },
  retoma_anime: {
    label: 'Retomaste un anime',
    color: '#4ade80',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" />
      </svg>
    ),
    getLink: () => undefined,
  },
  respuesta_post: {
    label: 'Respuesta en tu publicación',
    color: 'var(--accent)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    getLink: (meta) => meta?.community_slug && meta?.post_id
      ? `/comunidad/${meta.community_slug}?post=${meta.post_id}`
      : undefined,
  },
  respuesta_comment: {
    label: 'Respuesta a tu comentario',
    color: 'var(--accent)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    getLink: (meta) => meta?.community_slug && meta?.post_id
      ? `/comunidad/${meta.community_slug}?post=${meta.post_id}`
      : undefined,
  },
  anuncio_comunidad: {
    label: 'Anuncio',
    color: 'var(--amber)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4Z" />
      </svg>
    ),
    getLink: (meta) => meta?.community_slug
      ? `/comunidades?slug=${meta.community_slug}`
      : undefined,
  },
}

type FilterType = 'todas' | 'anime' | 'social' | 'comunidades'

const FILTER_TYPES: { id: FilterType; label: string }[] = [
  { id: 'todas',       label: 'Todas' },
  { id: 'anime',       label: 'Anime' },
  { id: 'social',      label: 'Social' },
  { id: 'comunidades', label: 'Comunidades' },
]

const FILTER_MAP: Record<FilterType, NotificationType[]> = {
  todas:       ['nuevo_ep', 'like_post', 'like_comment', 'amistad_recibida', 'amistad_enviada', 'amistad_aceptada', 'logro_desbloqueado', 'comunidad_promovida', 'retoma_anime', 'respuesta_post', 'respuesta_comment', 'anuncio_comunidad'],
  anime:       ['nuevo_ep', 'retoma_anime', 'logro_desbloqueado'],
  social:      ['like_post', 'like_comment', 'amistad_recibida', 'amistad_enviada', 'amistad_aceptada', 'respuesta_post', 'respuesta_comment', 'anuncio_comunidad'],
  comunidades: ['comunidad_promovida', 'anuncio_comunidad'],
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Ahora'
  if (m < 60) return `Hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7)  return `Hace ${d}d`
  return new Date(dateStr).toLocaleDateString('es-LA', { day: 'numeric', month: 'short' })
}

export function NotificationsClient({ initialNotifications, initialUnread, userId, accessToken, currentUsername }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('todas')
  const [isPending, startTransition]    = useTransition()

  const { notifications, unreadCount, markAllRead, markAsRead } = useNotifications({
    userId,
    accessToken,
  })

  // Usar notificaciones del hook (incluye las en tiempo real) o las iniciales como fallback
  const allNotifs = notifications.length > 0 ? notifications : initialNotifications
  const currentUnread = notifications.length > 0 ? unreadCount : initialUnread

  const filtered = allNotifs.filter(n =>
    FILTER_MAP[activeFilter].includes(n.type)
  )

  const handleMarkAll = () => {
    startTransition(() => markAllRead())
  }

  return (
    <div className="notif-page">
      {/* Header */}
      <div className="notif-header">
        <div className="notif-header-left">
          <h1 className="notif-title">Notificaciones</h1>
          {currentUnread > 0 && (
            <span className="notif-unread-badge" aria-label={`${currentUnread} sin leer`}>
              {currentUnread}
            </span>
          )}
        </div>
        {currentUnread > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={isPending}
            className="notif-mark-all"
            aria-label="Marcar todas como leídas"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="notif-filters" role="tablist" aria-label="Filtrar notificaciones">
        {FILTER_TYPES.map(f => (
          <button
            key={f.id}
            role="tab"
            aria-selected={activeFilter === f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`notif-filter ${activeFilter === f.id ? 'notif-filter--active' : ''}`}
          >
            {f.label}
            {f.id === 'todas' && currentUnread > 0 && (
              <span className="notif-filter-dot" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>

      {/* Lista de notificaciones */}
      {filtered.length === 0 ? (
        <div className="notif-empty">
          <span aria-hidden="true">🔔</span>
          <h3>Sin notificaciones</h3>
          <p>
            {activeFilter === 'todas'
              ? 'Cuando haya actividad en tu cuenta aparecerá aquí.'
              : `No tienes notificaciones de tipo "${FILTER_TYPES.find(f => f.id === activeFilter)?.label}".`}
          </p>
        </div>
      ) : (
        <div className="notif-list" role="list">
          {filtered.map((notif, i) => (
            <NotificationItem
              key={notif.id}
              notif={notif}
              index={i}
              currentUsername={currentUsername}
              onMarkRead={markAsRead}
            />
          ))}
        </div>
      )}

      <style>{`
        .notif-page {
          max-width: 680px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Header */
        .notif-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .notif-header-left { display: flex; align-items: center; gap: 0.75rem; }
        .notif-title {
          font-family: var(--font-display);
          font-size: clamp(1.5rem, 3vw, 2rem);
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          margin: 0;
        }
        .notif-unread-badge {
          background: var(--accent);
          color: #fff;
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 800;
          min-width: 24px;
          height: 24px;
          border-radius: var(--radius-full);
          padding: 0 0.4rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notif-mark-all {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          background: none;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 0.4rem 0.875rem;
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .notif-mark-all:hover { color: var(--text-primary); border-color: var(--border-hover); }
        .notif-mark-all:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Filtros */
        .notif-filters {
          display: flex;
          gap: 0.375rem;
          border-bottom: 1px solid var(--border);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .notif-filters::-webkit-scrollbar { display: none; }
        .notif-filter {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.625rem 1rem;
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
        .notif-filter:hover { color: var(--text-secondary); }
        .notif-filter--active { color: var(--text-primary); }
        .notif-filter--active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent);
          border-radius: var(--radius-full);
        }
        .notif-filter-dot {
          width: 6px;
          height: 6px;
          background: var(--accent);
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* Empty */
        .notif-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 4rem 2rem;
          text-align: center;
        }
        .notif-empty span { font-size: 2.5rem; }
        .notif-empty h3 { font-family: var(--font-display); font-size: 1.125rem; color: var(--text-secondary); margin: 0; }
        .notif-empty p { color: var(--text-muted); font-size: 0.9375rem; max-width: 320px; margin: 0; }

        /* Lista */
        .notif-list {
          display: flex;
          flex-direction: column;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

/* ─── Item individual de notificación ────────────────────────── */

function NotificationItem({ notif, index, currentUsername, onMarkRead }: { notif: Notification; index: number; currentUsername: string; onMarkRead: (id: string) => void }) {
  const config = NOTIF_CONFIG[notif.type]
  let link = config?.getLink(notif.metadata)
  if (notif.type === 'amistad_recibida') {
    link = `/u/${currentUsername}?tab=amigos`
  }

  const handleClickWrapper = () => {
    if (!notif.is_read) onMarkRead(notif.id)
    if (link) window.location.href = link
  }

  const content = (
    <div
      className={`notif-item ${!notif.is_read ? 'notif-item--unread' : ''} animate-fade-in`}
      style={{ animationDelay: `${index * 0.04}s` }}
      onClick={handleClickWrapper}
      onKeyDown={e => { if (e.key === 'Enter') handleClickWrapper() }}
      role={link ? 'link' : undefined}
      tabIndex={0}
      aria-label={`${notif.is_read ? '' : 'Sin leer — '}${notif.title}`}
    >
      {/* Icono de tipo */}
      <div
        className="notif-icon"
        style={{ color: config?.color ?? 'var(--text-muted)', background: (config?.color ?? 'var(--text-muted)') + '15' }}
        aria-hidden="true"
      >
        {config?.icon}
      </div>

      {/* Contenido */}
      <div className="notif-content">
        <p className="notif-notif-title">{notif.title}</p>
        <p className="notif-body">{notif.body}</p>
        <div className="notif-meta">
          <span className="notif-type-label">{config?.label}</span>
          <span className="notif-time">{timeAgo(notif.created_at)}</span>
        </div>
      </div>

      {/* Stacked count */}
      {notif.stacked_count > 1 && (
        <div className="notif-stacked-badge" aria-label={`${notif.stacked_count} notificaciones agrupadas`}>
          +{notif.stacked_count - 1}
        </div>
      )}

      {/* Indicador de no leída */}
      {!notif.is_read && (
        <div className="notif-unread-dot" aria-hidden="true" />
      )}

      <style>{`
        .notif-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border);
          transition: background var(--transition-fast);
          text-decoration: none;
          cursor: ${link ? 'pointer' : 'default'};
        }
        .notif-item:last-child { border-bottom: none; }
        .notif-item:hover { background: var(--bg-elevated); }
        .notif-item--unread { background: rgba(230, 57, 70, 0.03); }

        .notif-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notif-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.25rem; }
        .notif-notif-title {
          font-family: var(--font-display);
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.3;
        }
        .notif-body { font-size: 0.875rem; color: var(--text-secondary); margin: 0; line-height: 1.5; }
        .notif-meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .notif-type-label {
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
        }
        .notif-time { font-size: 0.75rem; color: var(--text-muted); }

        .notif-unread-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
          flex-shrink: 0;
          margin-top: 4px;
        }

        .notif-stacked-badge {
          font-size: 0.625rem;
          font-weight: 800;
          font-family: var(--font-display);
          color: var(--accent);
          background: rgba(230,57,70,0.12);
          border-radius: var(--radius-full);
          padding: 0.1rem 0.4rem;
          flex-shrink: 0;
          margin-top: 2px;
        }
      `}</style>
    </div>
  )

  return link ? (
    <Link href={link} style={{ textDecoration: 'none', display: 'block' }} role="listitem">
      {content}
    </Link>
  ) : (
    <div role="listitem">{content}</div>
  )
}
