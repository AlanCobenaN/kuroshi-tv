'use client'
import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'

interface Props {
  accessToken: string
  role: string
}

interface DashboardData {
  realtime: { pending_reports: number; new_users_today: number }
  totals: { users: number; animes: number; episodes: number; communities: number; posts: number }
  recent_users: { id: string; username: string; email: string; role: string; created_at: string }[]
  recent_reports: { id: string; content_type: string; reason: string; created_at: string; reporter: { username: string } }[]
}

export function AdminDashboardClient({ accessToken, role }: Props) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.getDashboard(accessToken)
      .then((res: any) => setData(res as DashboardData))
      .catch((e: Error) => setError('Error: ' + e.message))
  }, [accessToken])

  if (error) return <p className="admin-error">{error}</p>
  if (!data) return <p className="admin-loading">Cargando dashboard...</p>

  return (
    <div className="admin-dashboard">
      <h1 className="admin-title">Dashboard</h1>

      <div className="admin-cards">
        <div className="admin-card">
          <span className="admin-card-value">{data.totals?.users ?? 0}</span>
          <span className="admin-card-label">Usuarios</span>
        </div>
        <div className="admin-card">
          <span className="admin-card-value">{data.totals?.animes ?? 0}</span>
          <span className="admin-card-label">Animes</span>
        </div>
        <div className="admin-card">
          <span className="admin-card-value">{data.totals?.episodes ?? 0}</span>
          <span className="admin-card-label">Episodios</span>
        </div>
        <div className="admin-card">
          <span className="admin-card-value">{data.totals?.communities ?? 0}</span>
          <span className="admin-card-label">Comunidades</span>
        </div>
        <div className="admin-card">
          <span className="admin-card-value">{data.totals?.posts ?? 0}</span>
          <span className="admin-card-label">Posts</span>
        </div>
        <div className="admin-card">
          <span className="admin-card-value">{data.realtime.pending_reports}</span>
          <span className="admin-card-label">Reportes pendientes</span>
        </div>
        <div className="admin-card">
          <span className="admin-card-value">{data.realtime.new_users_today}</span>
          <span className="admin-card-label">Nuevos hoy</span>
        </div>
      </div>

      <div className="admin-sections">
        <div className="admin-section">
          <h2>Usuarios recientes</h2>
          <table className="admin-table">
            <thead>
              <tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Registro</th></tr>
            </thead>
            <tbody>
              {(data.recent_users ?? []).map(u => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td><span className="admin-badge">{u.role}</span></td>
                  <td>{new Date(u.created_at).toLocaleDateString('es')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-section">
          <h2>Reportes recientes</h2>
          <table className="admin-table">
            <thead>
              <tr><th>Reportado por</th><th>Tipo</th><th>Motivo</th><th>Fecha</th></tr>
            </thead>
            <tbody>
              {(data.recent_reports ?? []).map(r => (
                <tr key={r.id}>
                  <td>{r.reporter?.username ?? '-'}</td>
                  <td><span className="admin-badge">{r.content_type}</span></td>
                  <td>{r.reason}</td>
                  <td>{new Date(r.created_at).toLocaleDateString('es')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .admin-dashboard { display: flex; flex-direction: column; gap: 1.5rem; }
        .admin-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0; }
        .admin-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.75rem; }
        .admin-card { display: flex; flex-direction: column; gap: 0.25rem; padding: 1.25rem; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); }
        .admin-card-value { font-family: var(--font-display); font-size: 1.75rem; font-weight: 800; color: var(--text-primary); }
        .admin-card-label { font-size: 0.8125rem; color: var(--text-muted); }
        .admin-sections { display: flex; flex-direction: column; gap: 2rem; }
        .admin-section h2 { font-family: var(--font-display); font-size: 1.125rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.75rem; }
        .admin-table { width: 100%; border-collapse: collapse; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
        .admin-table th, .admin-table td { text-align: left; padding: 0.625rem 0.875rem; font-size: 0.875rem; border-bottom: 1px solid var(--border); }
        .admin-table th { font-family: var(--font-display); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); background: var(--bg-elevated); }
        .admin-table td { color: var(--text-secondary); }
        .admin-badge { font-family: var(--font-display); font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.15rem 0.5rem; border-radius: var(--radius-full); background: var(--bg-overlay); color: var(--text-muted); }
        .admin-error { color: var(--accent); }
        .admin-loading { color: var(--text-muted); }
      `}</style>
    </div>
  )
}
