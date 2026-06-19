'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { adminApi } from '@/lib/api'
import { useSession } from 'next-auth/react'
import { createClient } from '@supabase/supabase-js'

function buildContentUrl(type: string, ref: string | null): { url: string; label: string } | null {
  if (!ref) return null
  if (type === 'usuario' && ref.startsWith('@')) {
    return { url: `/u/${ref.slice(1)}`, label: ref }
  }
  if (type === 'post') {
    const m = ref.match(/^Post en \/(.+)$/)
    if (m) return { url: `/comunidades/${m[1]}`, label: ref }
  }
  if (type === 'episodio') {
    return { url: '#', label: ref }
  }
  return null
}

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam o publicidad',
  contenido_inapropiado: 'Contenido inapropiado',
  acoso: 'Acoso o insultos',
  violencia: 'Violencia o gore',
  desinformacion: 'Desinformación',
  suplantacion: 'Suplantación de identidad',
  link_caido: 'Link caído / no funciona',
  calidad_baja: 'Calidad de video baja',
  audio_incorrecto: 'Audio incorrecto o desincronizado',
  subtitulos_incorrectos: 'Subtítulos incorrectos',
  episodio_incorrecto: 'No corresponde al episodio',
  spoiler: 'Spoiler sin marcar',
  otro: 'Otro',
}

export default function AdminReportsPage() {
  const { data: session } = useSession()
  const [reports, setReports] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pendingCount, setPendingCount] = useState(0)
  const supabaseRef = useRef<any>(null)

  const fetchReports = () => {
    if (!session?.accessToken) return
    adminApi.getReports(session.accessToken, page, filter || undefined)
      .then((res: any) => {
        const data = res.data ?? []
        setReports(data)
        setTotal(res.meta?.total ?? 0)
        if (res.pending_count !== undefined) setPendingCount(res.pending_count)
      })
      .catch(() => setError('Error al cargar reportes'))
  }

  useEffect(() => { fetchReports() }, [session, page])

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    )
    supabaseRef.current = supabase

    const channel = supabase
      .channel('admin:reports')
      .on('broadcast', { event: 'new_report' }, (payload: any) => {
        const r = payload.payload
        if (filter === '' || filter === 'todos' || r.content_type === filter) {
          setReports(prev => [{ ...r, status: 'pendiente' }, ...prev])
          setPendingCount(prev => prev + 1)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [filter])

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
          <option value="post">Posts</option>
          <option value="comment">Comentarios</option>
          <option value="episode_comment">Comentarios de episodio</option>
          <option value="mensaje">Mensajes</option>
          <option value="usuario">Usuarios</option>
          <option value="episodio">Episodios</option>
        </select>
        <button onClick={fetchReports} className="btn-secondary">Filtrar</button>
      </div>

      <table className="admin-table">
        <thead>
          <tr><th>Reportado por</th><th>Tipo</th><th>Motivos</th><th>Descripción</th><th>Ref.</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {reports.map((r: any) => (
            <tr key={r.id}>
              <td>{r.reporter?.username ?? r.reporter_name ?? 'Desconocido'}</td>
              <td><span className="admin-badge">{r.content_type}</span></td>
              <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {Array.isArray(r.reasons)
                  ? r.reasons.map((re: string) => REASON_LABELS[re] ?? re).join(', ')
                  : typeof r.reasons === 'string'
                    ? REASON_LABELS[r.reasons] ?? r.reasons
                    : '-'}
              </td>
              <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {r.description ?? '-'}
              </td>
              <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {(() => {
                  const link = buildContentUrl(r.content_type, r.content_ref)
                  if (link && link.url !== '#') {
                    return <Link href={link.url} target="_blank" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{link.label}</Link>
                  }
                  return r.content_ref ? <code>{r.content_ref}</code> : '-'
                })()}
              </td>
              <td><span className={`admin-badge admin-badge--${r.status}`}>{r.status}</span></td>
              <td>{new Date(r.created_at).toLocaleDateString('es')}</td>
              <td>
                {r.status === 'pendiente' ? (
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    <button onClick={() => handleReview(r.id, 'revisado')} className="btn-action" title="Marcar como revisado">✅</button>
                    <button onClick={() => handleReview(r.id, 'desestimado')} className="btn-action" title="Desestimar">❌</button>
                    <button onClick={() => handleDeleteContent(r.content_type, r.content_id)} className="btn-action" title="Eliminar contenido">🗑️</button>
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {r.reviewed_by?.username ?? 'Revisado'}
                  </span>
                )}
              </td>
            </tr>
          ))}
          {reports.length === 0 && (
            <tr><td colSpan={8} style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No hay reportes</td></tr>
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
        .admin-table th, .admin-table td { text-align: left; padding: 0.5rem 0.75rem; font-size: 0.8125rem; border-bottom: 1px solid var(--border); }
        .admin-table th { font-family: var(--font-display); font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); background: var(--bg-elevated); }
        .admin-table td { color: var(--text-secondary); }
        .admin-table code { font-size: 0.6875rem; background: var(--bg-overlay); padding: 0.1rem 0.3rem; border-radius: var(--radius-sm); }
        .admin-badge { font-family: var(--font-display); font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.15rem 0.5rem; border-radius: var(--radius-full); background: var(--bg-overlay); color: var(--text-muted); }
        .admin-badge--pendiente { background: rgba(234,179,8,0.12); color: #eab308; }
        .admin-badge--revisado { background: rgba(74,222,128,0.12); color: #4ade80; }
        .admin-badge--desestimado { background: rgba(239,68,68,0.1); color: #ef4444; }
        .admin-pagination { display: flex; align-items: center; gap: 1rem; justify-content: center; margin-top: 1.5rem; }
        .btn-secondary, .btn-action { font-family: var(--font-display); font-size: 0.8125rem; font-weight: 600; padding: 0.5rem 1rem; border-radius: var(--radius-lg); border: none; cursor: pointer; transition: all var(--transition-fast); }
        .btn-secondary { background: var(--bg-overlay); color: var(--text-primary); }
        .btn-action { background: var(--bg-elevated); padding: 0.2rem 0.35rem; font-size: 0.875rem; border-radius: var(--radius-md); cursor: pointer; border: none; }
        .input { background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-primary); padding: 0.5rem 0.75rem; border-radius: var(--radius-lg); font-size: 0.875rem; width: 100%; }
      `}</style>
    </div>
  )
}
