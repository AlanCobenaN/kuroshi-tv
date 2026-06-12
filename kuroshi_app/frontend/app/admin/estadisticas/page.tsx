'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { adminApi } from '@/lib/api'

export default function AdminStatsPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<any>(null)
  const [period, setPeriod] = useState('mes')
  const [error, setError] = useState('')

  const fetchStats = () => {
    if (!session?.accessToken) return
    adminApi.getStats(session.accessToken, period)
      .then(setStats)
      .catch(() => setError('Error al cargar estadísticas'))
  }

  useEffect(() => { fetchStats() }, [session, period])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="admin-title">Estadísticas</h1>
        <select value={period} onChange={e => setPeriod(e.target.value)} className="input" style={{ maxWidth: 160 }}>
          <option value="hoy">Hoy</option>
          <option value="semana">Esta semana</option>
          <option value="mes">Este mes</option>
          <option value="ano">Este año</option>
        </select>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {!stats && !error && <p className="admin-loading">Cargando estadísticas...</p>}

      {stats && (
        <>
          <div className="admin-cards">
        <div className="admin-card">
          <span className="admin-card-value">{stats.new_users}</span>
          <span className="admin-card-label">Nuevos usuarios</span>
        </div>
        <div className="admin-card">
          <span className="admin-card-value">{stats.total_comments}</span>
          <span className="admin-card-label">Comentarios en episodios</span>
        </div>
          </div>

          <div className="admin-sections">
            <div className="admin-section">
              <h2>Top 10 Animes más vistos</h2>
              <table className="admin-table">
                <thead>
                  <tr><th>#</th><th>Anime</th><th>Rating MAL</th><th>Visitas</th></tr>
                </thead>
                <tbody>
                  {stats.top_animes?.map((a: any, i: number) => (
                    <tr key={a.id}>
                      <td>{i + 1}</td>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {a.cover_url && <img src={a.cover_url} alt="" style={{ width: 32, height: 48, objectFit: 'cover', borderRadius: 4 }} />}
                        <span>{a.title_es}</span>
                      </td>
                      <td>{a.mal_rating?.toFixed(1) ?? '-'}</td>
                      <td>{a.total_views}</td>
                    </tr>
                  ))}
                  {(!stats.top_animes || stats.top_animes.length === 0) && (
                    <tr><td colSpan={4} style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Sin datos</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-section">
              <h2>Comunidades más activas</h2>
              <table className="admin-table">
                <thead>
                  <tr><th>Nombre</th><th>Tipo</th><th>Miembros</th><th>Posts</th></tr>
                </thead>
                <tbody>
                  {stats.active_communities?.map((c: any) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td><span className="admin-badge">{c.type}</span></td>
                      <td>{c.members_count}</td>
                      <td>{c._count?.posts ?? 0}</td>
                    </tr>
                  ))}
                  {(!stats.active_communities || stats.active_communities.length === 0) && (
                    <tr><td colSpan={4} style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Sin datos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <style>{`
        .admin-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0; }
        .admin-error { color: var(--accent); }
        .admin-loading { color: var(--text-muted); }
        .admin-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; margin-bottom: 2rem; }
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
      `}</style>
    </div>
  )
}
