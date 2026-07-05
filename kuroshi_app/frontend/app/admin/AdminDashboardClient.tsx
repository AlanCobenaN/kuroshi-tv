'use client'
import { useEffect, useState, ReactNode } from 'react'
import { adminApi } from '@/lib/api'
import Link from 'next/link'

interface Props {
  accessToken: string
  role: string
}

interface DashboardData {
  realtime: { pending_reports: number; new_users_today: number }
  totals: {
    users: number; active_users_7d: number
    animes: number; visible_animes: number; hidden_animes: number
    episodes: number; communities: number; posts: number
    comments: number; total_views: number
  }
  recent_users: { id: string; username: string; email: string; role: string; created_at: string }[]
  recent_reports: { id: string; content_type: string; reasons: string[]; created_at: string; reporter: { username: string } }[]
}

function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const steps = Math.min(60, value)
    const increment = value / steps
    const timer = setInterval(() => {
      start += increment
      if (start >= value) { setDisplay(value); clearInterval(timer) }
      else setDisplay(Math.floor(start))
    }, 20)
    return () => clearInterval(timer)
  }, [value])
  return <>{display.toLocaleString('es')}{suffix}</>
}

export function AdminDashboardClient({ accessToken, role }: Props) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.getDashboard(accessToken)
      .then((res: any) => setData(res as DashboardData))
      .catch((e: Error) => setError('Error: ' + e.message))
  }, [accessToken])

  if (error) return (
    <div className="ad-error">
      <span className="ad-error-icon">⚠️</span>
      <span>{error}</span>
    </div>
  )

  if (!data) return (
    <div className="ad-loading">
      <div className="ad-spinner" />
      <span>Cargando dashboard...</span>
    </div>
  )

  const t = data.totals
  const rt = data.realtime

  const metrics = [
    {
      label: 'Usuarios', value: t.users, icon: '👥',
      sub: `${t.active_users_7d} activos (7d) · ${rt.new_users_today} hoy`,
      gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      progress: t.users > 0 ? (t.active_users_7d / t.users) * 100 : 0,
    },
    {
      label: 'Animes', value: t.animes, icon: '🎬',
      sub: `${t.visible_animes} visibles · ${t.hidden_animes} ocultos`,
      gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
      progress: t.animes > 0 ? (t.visible_animes / t.animes) * 100 : 0,
    },
    {
      label: 'Episodios', value: t.episodes, icon: '📽️',
      sub: `${t.total_views.toLocaleString('es')} reproducciones`,
      gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    },
    {
      label: 'Comunidades', value: t.communities, icon: '🏘️',
      sub: `${t.posts} posts publicados`,
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
    },
    {
      label: 'Comentarios', value: t.comments, icon: '💬',
      sub: 'en episodios',
      gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    },
    {
      label: 'Reportes', value: rt.pending_reports, icon: '🚨',
      sub: 'pendientes de revisión',
      gradient: 'linear-gradient(135deg, #f97316, #dc2626)',
      alert: rt.pending_reports > 0,
    },
  ]

  const quickActions = [
    { href: '/admin/anime', label: 'Añadir anime', icon: '➕', desc: 'Importar desde MAL o crear manual' },
    { href: '/admin/episodios', label: 'Gestionar episodios', icon: '📹', desc: 'Subir servidores, sincronizar' },
    { href: '/admin/reportes', label: 'Reportes', icon: '🚨', desc: `${rt.pending_reports} pendientes` },
    { href: '/admin/usuarios', label: 'Usuarios', icon: '👥', desc: 'Gestionar roles, bans' },
    { href: '/admin/comunidades', label: 'Comunidades', icon: '🏘️', desc: 'Promover, moderar' },
    { href: '/admin/configuracion', label: 'Configuración', icon: '⚙️', desc: 'SEO, anuncios, registro' },
  ]

  const activity: { time: Date; text: ReactNode; type: 'user' | 'report' }[] = [
    ...(data.recent_users ?? []).map(u => ({
      time: new Date(u.created_at),
      text: <><strong>{u.username}</strong> se registró como <span className="ad-role-badge">{u.role}</span></>,
      type: 'user' as const,
    })),
    ...(data.recent_reports ?? []).map(r => ({
      time: new Date(r.created_at),
      text: <><strong>{r.reporter?.username ?? 'Alguien'}</strong> reportó <span className="ad-content-badge">{r.content_type}</span></>,
      type: 'report' as const,
    })),
  ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 8)

  return (
    <div className="ad">
      {/* Header */}
      <div className="ad-header">
        <div>
          <h1 className="ad-title">Dashboard</h1>
          <p className="ad-subtitle">
            {new Date().toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            <span className="ad-role-badge" style={{ marginLeft: 8 }}>{role}</span>
          </p>
        </div>
        <div className="ad-header-actions">
          <Link href="/" className="ad-btn-outline">↩ Volver al sitio</Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="ad-metrics">
        {metrics.map(m => (
          <div key={m.label} className="ad-metric-card" style={{ '--card-gradient': m.gradient } as React.CSSProperties}>
            <div className="ad-metric-bg" />
            <div className="ad-metric-body">
              <div className="ad-metric-top">
                <span className="ad-metric-icon">{m.icon}</span>
                {m.alert && <span className="ad-metric-pulse" />}
              </div>
              <div className="ad-metric-value">
                <CountUp value={m.value} />
              </div>
              <div className="ad-metric-label">{m.label}</div>
              <div className="ad-metric-sub">{m.sub}</div>
              {m.progress !== undefined && (
                <div className="ad-progress-track">
                  <div className="ad-progress-bar" style={{ width: `${Math.min(100, m.progress)}%` }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom section */}
      <div className="ad-bottom">
        {/* Quick actions */}
        <div className="ad-section">
          <h2 className="ad-section-title">Acciones rápidas</h2>
          <div className="ad-actions">
            {quickActions.map(a => (
              <Link key={a.href} href={a.href} className="ad-action-card">
                <span className="ad-action-icon">{a.icon}</span>
                <div>
                  <div className="ad-action-label">{a.label}</div>
                  <div className="ad-action-desc">{a.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="ad-section">
          <h2 className="ad-section-title">Actividad reciente</h2>
          <div className="ad-timeline">
            {activity.map((a, i) => (
              <div key={i} className="ad-timeline-item">
                <div className={`ad-timeline-dot ad-timeline-dot--${a.type}`} />
                <div className="ad-timeline-body">
                  <div className="ad-timeline-text">{a.text}</div>
                  <div className="ad-timeline-time">
                    {a.time.toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {activity.length === 0 && <div className="ad-empty">Sin actividad reciente</div>}
          </div>
        </div>
      </div>

      <style>{`
        .ad { display: flex; flex-direction: column; gap: 1.5rem; }
        .ad-error { display: flex; align-items: center; gap: .5rem; padding: 1rem; background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3); border-radius: var(--radius-lg); color: #fca5a5; }
        .ad-error-icon { font-size: 1.25rem; }
        .ad-loading { display: flex; align-items: center; justify-content: center; gap: .75rem; padding: 4rem 0; color: var(--text-muted); }
        .ad-spinner { width: 24px; height: 24px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: ad-spin .8s linear infinite; }
        @keyframes ad-spin { to { transform: rotate(360deg); } }

        /* Header */
        .ad-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
        .ad-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0; }
        .ad-subtitle { font-size: .8125rem; color: var(--text-muted); margin: .25rem 0 0; text-transform: capitalize; }
        .ad-header-actions { display: flex; gap: .5rem; }
        .ad-btn-outline { display: inline-flex; align-items: center; gap: .375rem; padding: .5rem 1rem; font-family: var(--font-display); font-size: .8125rem; font-weight: 600; color: var(--text-secondary); background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); text-decoration: none; transition: all .15s; }
        .ad-btn-outline:hover { color: var(--text-primary); border-color: var(--text-muted); }

        /* Metrics grid */
        .ad-metrics { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }

        .ad-metric-card {
          position: relative; overflow: hidden;
          border-radius: var(--radius-lg); padding: 1.25rem;
          background: var(--bg-surface); border: 1px solid var(--border);
          transition: transform .2s, box-shadow .2s;
        }
        .ad-metric-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,.3); }

        .ad-metric-bg {
          position: absolute; top: 0; right: 0; width: 120px; height: 120px;
          background: var(--card-gradient); opacity: .08;
          border-radius: 0 0 0 100%;
          transition: opacity .3s;
        }
        .ad-metric-card:hover .ad-metric-bg { opacity: .15; }

        .ad-metric-body { position: relative; z-index: 1; display: flex; flex-direction: column; gap: .25rem; }
        .ad-metric-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: .25rem; }
        .ad-metric-icon { font-size: 1.5rem; line-height: 1; }
        .ad-metric-pulse { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; animation: ad-pulse 2s infinite; }
        @keyframes ad-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }

        .ad-metric-value { font-family: var(--font-display); font-size: 1.75rem; font-weight: 800; color: var(--text-primary); line-height: 1.2; }
        .ad-metric-label { font-family: var(--font-display); font-size: .8125rem; font-weight: 600; color: var(--text-muted); }
        .ad-metric-sub { font-size: .6875rem; color: var(--text-muted); opacity: .7; }

        .ad-progress-track { margin-top: .5rem; height: 3px; background: var(--bg-elevated); border-radius: 99px; overflow: hidden; }
        .ad-progress-bar { height: 100%; background: var(--card-gradient); border-radius: 99px; transition: width 1s ease; }

        /* Bottom grid */
        .ad-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        @media (max-width: 900px) { .ad-bottom { grid-template-columns: 1fr; } }

        .ad-section { display: flex; flex-direction: column; gap: .75rem; }
        .ad-section-title { font-family: var(--font-display); font-size: 1.0625rem; font-weight: 700; color: var(--text-primary); margin: 0; }

        /* Quick actions */
        .ad-actions { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
        .ad-action-card {
          display: flex; align-items: center; gap: .75rem;
          padding: .875rem; border-radius: var(--radius-lg);
          background: var(--bg-surface); border: 1px solid var(--border);
          text-decoration: none; transition: all .15s;
        }
        .ad-action-card:hover { border-color: var(--text-muted); background: var(--bg-elevated); transform: translateY(-1px); }
        .ad-action-icon { font-size: 1.25rem; flex-shrink: 0; }
        .ad-action-label { font-family: var(--font-display); font-size: .8125rem; font-weight: 600; color: var(--text-primary); }
        .ad-action-desc { font-size: .6875rem; color: var(--text-muted); margin-top: .125rem; }

        /* Timeline */
        .ad-timeline { display: flex; flex-direction: column; gap: 0; }
        .ad-timeline-item { display: flex; gap: .75rem; padding: .625rem 0; position: relative; }
        .ad-timeline-item + .ad-timeline-item { border-top: 1px solid var(--border); }

        .ad-timeline-dot {
          width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
          margin-top: .375rem;
          background: var(--bg-elevated); border: 2px solid var(--border);
        }
        .ad-timeline-dot--user { background: #6366f1; border-color: #6366f166; }
        .ad-timeline-dot--report { background: #ef4444; border-color: #ef444466; }

        .ad-timeline-body { flex: 1; min-width: 0; }
        .ad-timeline-text { font-size: .8125rem; color: var(--text-secondary); line-height: 1.4; }
        .ad-timeline-text strong { color: var(--text-primary); font-weight: 600; }
        .ad-timeline-time { font-size: .6875rem; color: var(--text-muted); margin-top: .125rem; }

        .ad-empty { font-size: .8125rem; color: var(--text-muted); padding: 1rem 0; text-align: center; }

        .ad-role-badge { display: inline-block; font-family: var(--font-display); font-size: .6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; padding: .125rem .5rem; border-radius: var(--radius-full); background: var(--bg-overlay); color: var(--text-muted); }
        .ad-content-badge { display: inline-block; font-family: var(--font-display); font-size: .625rem; font-weight: 700; text-transform: uppercase; padding: .1rem .4rem; border-radius: var(--radius-full); background: rgba(59,130,246,.15); color: #60a5fa; }
      `}</style>
    </div>
  )
}