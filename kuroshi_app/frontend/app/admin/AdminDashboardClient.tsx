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

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="mb-track">
      <div className="mb-bar" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
    </div>
  )
}

export function AdminDashboardClient({ accessToken, role }: Props) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [animes, setAnimes] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [genres, setGenres] = useState<any[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const token = accessToken
    async function load() {
      try {
        const [d, s, a, u, g] = await Promise.all([
          adminApi.getDashboard(token) as Promise<DashboardData>,
          adminApi.getStats(token, 'ano').catch(() => null),
          adminApi.getAnimes(token, 1, undefined, 20).catch(() => null),
          adminApi.getUsers(token, 1, '').catch(() => null),
          adminApi.getGenres(token).catch(() => null),
        ])
        setData(d)
        setStats(s)
        setAnimes((a as any)?.data ?? [])
        setUsers((u as any)?.data ?? [])
        setGenres(Array.isArray(g) ? g : [])
      } catch (e: any) {
        setError('Error: ' + (e?.message ?? ''))
      }
    }
    load()
  }, [accessToken])

  if (error) return <div className="ad-error">⚠️ {error}</div>
  if (!data) return <div className="ad-loading"><div className="ad-spinner" />Cargando dashboard...</div>

  const t = data.totals
  const rt = data.realtime
  const topAnimes = (stats?.top_animes ?? []).slice(0, 6)
  const activeCommunities = (stats?.active_communities ?? []).slice(0, 5)

  const animeStatusDist = animes.reduce((acc: Record<string, number>, a: any) => {
    const s = a.status ?? 'desconocido'
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const roleDist = users.reduce((acc: Record<string, number>, u: any) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const reportContentTypes = data.recent_reports.reduce((acc: Record<string, number>, r: any) => {
    const ct = r.content_type ?? 'otro'
    acc[ct] = (acc[ct] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const statusColors: Record<string, string> = {
    en_emision: '#10b981', finalizado: '#6366f1', proximamente: '#f59e0b', desconocido: '#6b7280',
  }
  const statusLabels: Record<string, string> = {
    en_emision: 'Emisión', finalizado: 'Finalizado', proximamente: 'Próximo',
  }
  const roleLabels: Record<string, string> = {
    owner: 'Owner', moderador: 'Mod', usuario: 'User', visitante: 'Visit',
  }
  const ctLabels: Record<string, string> = {
    post: 'Posts', comentario: 'Coment', usuario: 'Usuario', episodio: 'Episodio', mensaje: 'Mensaje',
  }

  return (
    <div className="ad">
      {/* ── Header ── */}
      <div className="ad-header">
        <div>
          <h1 className="ad-title">Panel de Administración</h1>
          <p className="ad-subtitle">
            {new Date().toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            <span className="ad-badge" style={{ marginLeft: 8 }}>{role}</span>
          </p>
        </div>
        <Link href="/" className="ad-btn-outline">↩ Volver al sitio</Link>
      </div>

      {/* ── Fila 1: Métricas principales ── */}
      <div className="ad-metrics">
        <div className="ad-metric" style={{ '--g': 'linear-gradient(135deg,#6366f1,#8b5cf6)' } as any}>
          <div className="ad-metric-hd"><span>👥</span><span className="ad-metric-num"><CountUp value={t.users} /></span></div>
          <div className="ad-metric-lbl">Usuarios</div>
          <div className="ad-metric-sub">{t.active_users_7d} activos (7d) · {rt.new_users_today} hoy</div>
          <MiniBar pct={t.users > 0 ? (t.active_users_7d / t.users) * 100 : 0} color="#8b5cf6" />
        </div>
        <div className="ad-metric" style={{ '--g': 'linear-gradient(135deg,#ec4899,#f43f5e)' } as any}>
          <div className="ad-metric-hd"><span>🎬</span><span className="ad-metric-num"><CountUp value={t.animes} /></span></div>
          <div className="ad-metric-lbl">Animes</div>
          <div className="ad-metric-sub">{t.visible_animes} visibles · {t.hidden_animes} ocultos</div>
          <MiniBar pct={t.animes > 0 ? (t.visible_animes / t.animes) * 100 : 0} color="#f43f5e" />
        </div>
        <div className="ad-metric" style={{ '--g': 'linear-gradient(135deg,#f59e0b,#ef4444)' } as any}>
          <div className="ad-metric-hd"><span>📽️</span><span className="ad-metric-num"><CountUp value={t.episodes} /></span></div>
          <div className="ad-metric-lbl">Episodios</div>
          <div className="ad-metric-sub"><CountUp value={t.total_views} /> reproducciones totales</div>
          <MiniBar pct={t.episodes > 0 ? Math.min(100, t.total_views / t.episodes / 10) : 0} color="#ef4444" />
        </div>
        <div className="ad-metric" style={{ '--g': 'linear-gradient(135deg,#10b981,#059669)' } as any}>
          <div className="ad-metric-hd"><span>🏘️</span><span className="ad-metric-num"><CountUp value={t.communities} /></span></div>
          <div className="ad-metric-lbl">Comunidades</div>
          <div className="ad-metric-sub">{t.posts} posts publicados</div>
          <MiniBar pct={t.communities > 0 ? Math.min(100, (t.posts / t.communities) * 5) : 0} color="#10b981" />
        </div>
        <div className="ad-metric" style={{ '--g': 'linear-gradient(135deg,#3b82f6,#06b6d4)' } as any}>
          <div className="ad-metric-hd"><span>💬</span><span className="ad-metric-num"><CountUp value={t.comments} /></span></div>
          <div className="ad-metric-lbl">Comentarios</div>
          <div className="ad-metric-sub">en episodios</div>
        </div>
        <div className="ad-metric" style={{ '--g': 'linear-gradient(135deg,#f97316,#dc2626)' } as any}>
          <div className="ad-metric-hd"><span>🚨</span><span className="ad-metric-num" style={rt.pending_reports > 0 ? { color: '#fca5a5' } : {}}><CountUp value={rt.pending_reports} /></span></div>
          <div className="ad-metric-lbl">Reportes</div>
          <div className="ad-metric-sub">pendientes de revisión</div>
        </div>
      </div>

      {/* ── Fila 2: Distribuciones + Top ── */}
      <div className="ad-two-col">
        {/* Col izquierda: distribuciones */}
        <div className="ad-card">
          <h3 className="ad-card-title">Animes por estado</h3>
          <div className="ad-dist">
            {Object.entries(animeStatusDist).map(([k, v]) => (
              <div key={k} className="ad-dist-row">
                <span className="ad-dist-lbl">
                  <span className="ad-dot" style={{ background: statusColors[k] ?? '#6b7280' }} />
                  {statusLabels[k] ?? k}
                </span>
                <span className="ad-dist-val">{v}</span>
                <MiniBar pct={(v / t.animes) * 100} color={statusColors[k] ?? '#6b7280'} />
              </div>
            ))}
          </div>

          <h3 className="ad-card-title" style={{ marginTop: '1.25rem' }}>Usuarios por rol</h3>
          <div className="ad-dist">
            {Object.entries(roleDist).map(([k, v]) => (
              <div key={k} className="ad-dist-row">
                <span className="ad-dist-lbl"><span className="ad-dot" style={{ background: k === 'owner' ? '#f59e0b' : k === 'moderador' ? '#6366f1' : '#6b7280' }} />{roleLabels[k] ?? k}</span>
                <span className="ad-dist-val">{v}</span>
                <MiniBar pct={(v / users.length) * 100} color={k === 'owner' ? '#f59e0b' : k === 'moderador' ? '#6366f1' : '#6b7280'} />
              </div>
            ))}
          </div>

          <h3 className="ad-card-title" style={{ marginTop: '1.25rem' }}>Reportes por tipo</h3>
          <div className="ad-dist">
            {Object.entries(reportContentTypes).map(([k, v]) => (
              <div key={k} className="ad-dist-row">
                <span className="ad-dist-lbl"><span className="ad-dot" style={{ background: '#ef4444' }} />{ctLabels[k] ?? k}</span>
                <span className="ad-dist-val">{v}</span>
              </div>
            ))}
            {Object.keys(reportContentTypes).length === 0 && <div className="ad-muted">Sin reportes</div>}
          </div>

          <h3 className="ad-card-title" style={{ marginTop: '1.25rem' }}>Géneros</h3>
          <div className="ad-muted">{genres.length} géneros registrados</div>
        </div>

        {/* Col derecha: Top animes + comunidades activas */}
        <div className="ad-card">
          <h3 className="ad-card-title">Top animes más vistos</h3>
          <table className="ad-table">
            <thead><tr><th>#</th><th>Anime</th><th>Rating</th><th>Visitas</th></tr></thead>
            <tbody>
              {topAnimes.map((a: any, i: number) => (
                <tr key={a.id ?? i}>
                  <td className="ad-rank">#{i + 1}</td>
                  <td>
                    <div className="ad-cell-with-img">
                      {a.cover_url && <img src={a.cover_url} alt="" className="ad-thumb" />}
                      <span className="ad-cell-title">{a.title_es ?? a.title}</span>
                    </div>
                  </td>
                  <td>{a.mal_rating?.toFixed(1) ?? '—'}</td>
                  <td className="ad-num">{(a.total_views ?? 0).toLocaleString('es')}</td>
                </tr>
              ))}
              {topAnimes.length === 0 && <tr><td colSpan={4} className="ad-muted" style={{ textAlign: 'center' }}>Sin datos</td></tr>}
            </tbody>
          </table>

          <h3 className="ad-card-title" style={{ marginTop: '1.25rem' }}>Comunidades más activas</h3>
          <table className="ad-table">
            <thead><tr><th>Nombre</th><th>Tipo</th><th>Miembros</th><th>Posts</th></tr></thead>
            <tbody>
              {activeCommunities.map((c: any) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td><span className="ad-tag">{c.type}</span></td>
                  <td className="ad-num">{c.members_count}</td>
                  <td className="ad-num">{c._count?.posts ?? 0}</td>
                </tr>
              ))}
              {activeCommunities.length === 0 && <tr><td colSpan={4} className="ad-muted" style={{ textAlign: 'center' }}>Sin datos</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Fila 3: Animes recientes + Actividad ── */}
      <div className="ad-two-col">
        <div className="ad-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
            <h3 className="ad-card-title" style={{ margin: 0 }}>Últimos animes añadidos</h3>
            <Link href="/admin/anime" className="ad-link">Ver todos →</Link>
          </div>
          <table className="ad-table">
            <thead><tr><th>Anime</th><th>Estado</th><th>Temp</th><th>Visible</th></tr></thead>
            <tbody>
              {animes.slice(0, 8).map((a: any) => (
                <tr key={a.id}>
                  <td>
                    <div className="ad-cell-with-img">
                      {a.cover_url && <img src={a.cover_url} alt="" className="ad-thumb" />}
                      <span className="ad-cell-title">{a.title_es}</span>
                    </div>
                  </td>
                  <td><span className={`ad-tag ad-tag--${a.status}`}>{statusLabels[a.status] ?? a.status}</span></td>
                  <td className="ad-num">{a._count?.seasons ?? 0}</td>
                  <td>{a.is_visible ? '✅' : '❌'}</td>
                </tr>
              ))}
              {animes.length === 0 && <tr><td colSpan={4} className="ad-muted" style={{ textAlign: 'center' }}>Sin animes</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="ad-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
            <h3 className="ad-card-title" style={{ margin: 0 }}>Actividad reciente</h3>
            <Link href="/admin/reportes" className="ad-link">Todos →</Link>
          </div>
          <div className="ad-timeline">
            {[
              ...(data.recent_users ?? []).map(u => ({
                time: new Date(u.created_at),
                text: <><strong>{u.username}</strong> se registró</>,
                type: 'user' as const,
              })),
              ...(data.recent_reports ?? []).map(r => ({
                time: new Date(r.created_at),
                text: <><strong>{r.reporter?.username ?? 'Alguien'}</strong> reportó <span className="ad-tag">{r.content_type}</span></>,
                type: 'report' as const,
              })),
            ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 10).map((a, i) => (
              <div key={i} className="ad-tl-item">
                <div className={`ad-tl-dot ad-tl-dot--${a.type}`} />
                <div className="ad-tl-body">
                  <div className="ad-tl-text">{a.text}</div>
                  <div className="ad-tl-time">{a.time.toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            ))}
            {data.recent_users.length === 0 && data.recent_reports.length === 0 && <div className="ad-muted" style={{ padding: '1rem', textAlign: 'center' }}>Sin actividad reciente</div>}
          </div>
        </div>
      </div>

      {/* ── Fila 4: Acciones rápidas ── */}
      <div className="ad-card">
        <h3 className="ad-card-title">Acciones rápidas</h3>
        <div className="ad-actions">
          {[
            { h: '/admin/anime', l: 'Añadir anime', i: '➕', d: 'Importar desde MAL o manual' },
            { h: '/admin/episodios', l: 'Episodios', i: '📹', d: 'Servidores, sincronizar MAL' },
            { h: '/admin/reportes', l: 'Reportes', i: '🚨', d: `${rt.pending_reports} pendientes` },
            { h: '/admin/usuarios', l: 'Usuarios', i: '👥', d: 'Roles, bans, advertencias' },
            { h: '/admin/comunidades', l: 'Comunidades', i: '🏘️', d: 'Promover a oficial' },
            { h: '/admin/estadisticas', l: 'Estadísticas', i: '📈', d: 'Informes detallados' },
            { h: '/admin/generos', l: 'Géneros', i: '🏷️', d: `${genres.length} registrados` },
            { h: '/admin/configuracion', l: 'Configuración', i: '⚙️', d: 'SEO, anuncios, registro' },
          ].map(a => (
            <Link key={a.h} href={a.h} className="ad-action">
              <span className="ad-action-icon">{a.i}</span>
              <div><div className="ad-action-lbl">{a.l}</div><div className="ad-action-desc">{a.d}</div></div>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        .ad { display: flex; flex-direction: column; gap: 1.25rem; }
        .ad-error { display: flex; align-items: center; gap: .5rem; padding: 1rem; background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.3); border-radius: var(--radius-lg); color: #fca5a5; font-size: .875rem; }
        .ad-loading { display: flex; align-items: center; justify-content: center; gap: .75rem; padding: 4rem 0; color: var(--text-muted); }
        .ad-spinner { width: 24px; height: 24px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: ad-spin .8s linear infinite; }
        @keyframes ad-spin { to { transform: rotate(360deg); } }
        .ad-muted { font-size: .8125rem; color: var(--text-muted); }

        /* Header */
        .ad-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
        .ad-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0; }
        .ad-subtitle { font-size: .8125rem; color: var(--text-muted); margin: .25rem 0 0; text-transform: capitalize; }
        .ad-btn-outline { display: inline-flex; align-items: center; gap: .375rem; padding: .5rem 1rem; font-family: var(--font-display); font-size: .8125rem; font-weight: 600; color: var(--text-secondary); background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); text-decoration: none; transition: all .15s; }
        .ad-btn-outline:hover { color: var(--text-primary); border-color: var(--text-muted); }
        .ad-link { font-family: var(--font-display); font-size: .75rem; font-weight: 600; color: var(--accent); text-decoration: none; }
        .ad-link:hover { text-decoration: underline; }
        .ad-badge { display: inline-block; font-family: var(--font-display); font-size: .6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; padding: .125rem .5rem; border-radius: var(--radius-full); background: var(--bg-overlay); color: var(--text-muted); }

        /* Two column layout */
        .ad-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        @media (max-width: 960px) { .ad-two-col { grid-template-columns: 1fr; } }

        /* Card */
        .ad-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.25rem; }
        .ad-card-title { font-family: var(--font-display); font-size: .9375rem; font-weight: 700; color: var(--text-primary); margin: 0 0 .75rem; }

        /* Metrics row */
        .ad-metrics { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: .875rem; }
        .ad-metric { position: relative; overflow: hidden; border-radius: var(--radius-lg); padding: 1rem 1.125rem; background: var(--bg-surface); border: 1px solid var(--border); transition: transform .2s, box-shadow .2s; }
        .ad-metric:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,.3); }
        .ad-metric::before { content: ''; position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: var(--g); opacity: .06; border-radius: 0 0 0 100%; }
        .ad-metric-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: .25rem; }
        .ad-metric-num { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-primary); line-height: 1.2; }
        .ad-metric-lbl { font-family: var(--font-display); font-size: .75rem; font-weight: 600; color: var(--text-muted); }
        .ad-metric-sub { font-size: .6875rem; color: var(--text-muted); opacity: .7; margin-top: .125rem; }

        /* Mini bar */
        .mb-track { margin-top: .5rem; height: 3px; background: var(--bg-elevated); border-radius: 99px; overflow: hidden; }
        .mb-bar { height: 100%; border-radius: 99px; transition: width 1s ease; }

        /* Distribution lists */
        .ad-dist { display: flex; flex-direction: column; gap: .375rem; }
        .ad-dist-row { display: flex; align-items: center; gap: .5rem; font-size: .8125rem; }
        .ad-dist-lbl { display: flex; align-items: center; gap: .375rem; color: var(--text-secondary); min-width: 0; flex: 1; }
        .ad-dist-val { font-family: var(--font-display); font-weight: 700; color: var(--text-primary); min-width: 24px; text-align: right; }
        .ad-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .ad-dist .mb-track { flex: 1; margin: 0; max-width: 100px; }

        /* Tables */
        .ad-table { width: 100%; border-collapse: collapse; font-size: .8125rem; }
        .ad-table th { text-align: left; padding: .5rem .5rem; font-family: var(--font-display); font-size: .6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); border-bottom: 1px solid var(--border); }
        .ad-table td { padding: .5rem; color: var(--text-secondary); border-bottom: 1px solid var(--border); }
        .ad-table tr:last-child td { border-bottom: none; }
        .ad-num { font-family: var(--font-display); font-weight: 700; text-align: right; }
        .ad-rank { font-family: var(--font-display); font-weight: 800; color: var(--text-muted); width: 28px; }
        .ad-cell-with-img { display: flex; align-items: center; gap: .5rem; }
        .ad-thumb { width: 28px; height: 40px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
        .ad-cell-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; display: block; }

        /* Tags */
        .ad-tag { display: inline-block; font-family: var(--font-display); font-size: .625rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; padding: .1rem .4rem; border-radius: var(--radius-full); background: var(--bg-overlay); color: var(--text-muted); }
        .ad-tag--en_emision { background: rgba(16,185,129,.15); color: #34d399; }
        .ad-tag--finalizado { background: rgba(99,102,241,.15); color: #818cf8; }
        .ad-tag--proximamente { background: rgba(245,158,11,.15); color: #fbbf24; }

        /* Timeline */
        .ad-timeline { display: flex; flex-direction: column; }
        .ad-tl-item { display: flex; gap: .625rem; padding: .5rem 0; }
        .ad-tl-item + .ad-tl-item { border-top: 1px solid var(--border); }
        .ad-tl-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; margin-top: .35rem; background: var(--bg-elevated); border: 2px solid var(--border); }
        .ad-tl-dot--user { background: #6366f1; border-color: #6366f166; }
        .ad-tl-dot--report { background: #ef4444; border-color: #ef444466; }
        .ad-tl-body { flex: 1; min-width: 0; }
        .ad-tl-text { font-size: .8125rem; color: var(--text-secondary); line-height: 1.4; }
        .ad-tl-text strong { color: var(--text-primary); font-weight: 600; }
        .ad-tl-time { font-size: .6875rem; color: var(--text-muted); margin-top: .125rem; }

        /* Actions grid */
        .ad-actions { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: .5rem; }
        .ad-action { display: flex; align-items: center; gap: .75rem; padding: .75rem; border-radius: var(--radius-lg); background: var(--bg-elevated); border: 1px solid var(--border); text-decoration: none; transition: all .15s; }
        .ad-action:hover { border-color: var(--text-muted); transform: translateY(-1px); }
        .ad-action-icon { font-size: 1.125rem; flex-shrink: 0; }
        .ad-action-lbl { font-family: var(--font-display); font-size: .8125rem; font-weight: 600; color: var(--text-primary); }
        .ad-action-desc { font-size: .6875rem; color: var(--text-muted); margin-top: .125rem; }
      `}</style>
    </div>
  )
}