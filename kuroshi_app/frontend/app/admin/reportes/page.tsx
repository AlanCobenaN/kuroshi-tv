'use client'
import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import { useSession } from 'next-auth/react'

export default function AdminReportsPage() {
  const { data: session } = useSession()
  const [reports, setReports] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pendingCount, setPendingCount] = useState(0)

  const fetchReports = () => {
    if (!session?.accessToken) return
    adminApi.getReports(session.accessToken, page, filter || undefined)
      .then((res: any) => {
        setReports(res.data ?? [])
        setTotal(res.meta?.total ?? 0)
        if (res.pending_count !== undefined) setPendingCount(res.pending_count)
      })
      .catch(() => setError('Error al cargar reportes'))
  }

  useEffect(() => { fetchReports() }, [session, page])

  const handleReview = async (reportId: string, status: string) => {
    if (!session?.accessToken) return
    const note = status === 'desestimado' ? prompt('Motivo de desestimación (opcional):') ?? '' : ''
    try {
      await adminApi.reviewReport(reportId, status, note, session.accessToken)
      setMessage(`Reporte marcado como ${status}`)
      fetchReports()
    } catch { setError('Error al revisar reporte') }
  }

  const handleDeleteContent = async (contentType: string, contentId: string) => {
    if (!session?.accessToken || !confirm(`¿Eliminar este ${contentType}?`)) return
    try {
      await adminApi.deleteContent(contentType, contentId, session.accessToken)
      setMessage('Contenido eliminado')
      fetchReports()
    } catch { setError('Error al eliminar contenido') }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 className="admin-title">Reportes</h1>
        {pendingCount > 0 && (
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent)' }}>
            {pendingCount} pendientes
          </span>
        )}
      </div>

      {error && <p className="admin-error">{error}</p>}
      {message && <p className="admin-success">{message}</p>}

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }} className="input" style={{ maxWidth: 200 }}>
          <option value="">Pendientes</option>
          <option value="todos">Todos</option>
          <option value="comentario">Comentarios</option>
          <option value="post">Posts</option>
          <option value="mensaje">Mensajes</option>
          <option value="usuario">Usuarios</option>
        </select>
        <button onClick={fetchReports} className="btn-secondary">Filtrar</button>
      </div>

      <table className="admin-table">
        <thead>
          <tr><th>Reportado por</th><th>Tipo</th><th>Motivo</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {reports.map((r: any) => (
            <tr key={r.id}>
              <td>{r.reporter?.username ?? 'Desconocido'}</td>
              <td><span className="admin-badge">{r.content_type}</span></td>
              <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.reason}</td>
              <td><span className={`admin-badge admin-badge--${r.status}`}>{r.status}</span></td>
              <td>{new Date(r.created_at).toLocaleDateString('es')}</td>
              <td>
                {r.status === 'pendiente' && (
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    <button onClick={() => handleReview(r.id, 'revisado')} className="btn-action" title="Marcar como revisado">✅</button>
                    <button onClick={() => handleReview(r.id, 'desestimado')} className="btn-action" title="Desestimar">❌</button>
                    <button onClick={() => handleDeleteContent(r.content_type, r.content_id)} className="btn-action" title="Eliminar contenido">🗑️</button>
                  </div>
                )}
                {r.status !== 'pendiente' && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {r.reviewed_by?.username ?? 'Revisado'}
                  </span>
                )}
              </td>
            </tr>
          ))}
          {reports.length === 0 && (
            <tr><td colSpan={6} style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No hay reportes</td></tr>
          )}
        </tbody>
      </table>

      <div className="admin-pagination">
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary">Anterior</button>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Página {page} — {total} total</span>
        <button disabled={reports.length < 20} onClick={() => setPage(p => p + 1)} className="btn-secondary">Siguiente</button>
      </div>

      <style>{`
        .admin-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0; }
        .admin-error { color: var(--accent); }
        .admin-success { color: var(--success, #22c55e); font-size: 0.875rem; margin-bottom: 1rem; }
        .admin-table { width: 100%; border-collapse: collapse; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
        .admin-table th, .admin-table td { text-align: left; padding: 0.625rem 0.875rem; font-size: 0.875rem; border-bottom: 1px solid var(--border); }
        .admin-table th { font-family: var(--font-display); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); background: var(--bg-elevated); }
        .admin-table td { color: var(--text-secondary); }
        .admin-badge { font-family: var(--font-display); font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.15rem 0.5rem; border-radius: var(--radius-full); background: var(--bg-overlay); color: var(--text-muted); }
        .admin-pagination { display: flex; align-items: center; gap: 1rem; justify-content: center; margin-top: 1.5rem; }
        .btn-secondary, .btn-action { font-family: var(--font-display); font-size: 0.8125rem; font-weight: 600; padding: 0.5rem 1rem; border-radius: var(--radius-lg); border: none; cursor: pointer; transition: all var(--transition-fast); }
        .btn-secondary { background: var(--bg-overlay); color: var(--text-primary); }
        .btn-action { background: var(--bg-elevated); padding: 0.2rem 0.35rem; font-size: 0.875rem; border-radius: var(--radius-md); cursor: pointer; border: none; }
        .input { background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-primary); padding: 0.5rem 0.75rem; border-radius: var(--radius-lg); font-size: 0.875rem; width: 100%; }
      `}</style>
    </div>
  )
}
