'use client'
import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import { useSession } from 'next-auth/react'

export default function AdminCommunitiesPage() {
  const { data: session } = useSession()
  const [communities, setCommunities] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [promotionRequests, setPromotionRequests] = useState<any[]>([])

  const fetchCommunities = async () => {
    if (!session?.accessToken) return
    try {
      const res: any = await adminApi.getCommunities(session.accessToken, 1, '')
      const allCommunities: any[] = []
      const totalPages = res.meta?.total_pages ?? 1
      allCommunities.push(...(res.data ?? []))
      for (let p = 2; p <= totalPages && p <= 5; p++) {
        const pageRes: any = await adminApi.getCommunities(session.accessToken, p, '')
        allCommunities.push(...(pageRes.data ?? []))
      }
      setPromotionRequests(
        allCommunities.filter(c => c.type === 'no_oficial' && c.members_count >= (c.members_threshold ?? 999))
      )
    } catch {}
    adminApi.getCommunities(session.accessToken, page, search || undefined)
      .then((res: any) => {
        setCommunities(res.data ?? [])
        setTotal(res.meta?.total ?? 0)
      })
      .catch(() => setError('Error al cargar comunidades'))
  }

  useEffect(() => { fetchCommunities() }, [session, page])

  const handlePromote = async (id: string) => {
    if (!session?.accessToken) return
    const reason = prompt('Razón de la promoción (opcional):')
    try {
      await adminApi.promoteCommunity(id, reason ?? '', session.accessToken)
      setMessage('Comunidad promovida a oficial')
      fetchCommunities()
    } catch { setError('Error al promover') }
  }

  const handleDemote = async (id: string) => {
    if (!session?.accessToken || !confirm('¿Degradar esta comunidad a no oficial?')) return
    try {
      await adminApi.demoteCommunity(id, session.accessToken)
      setMessage('Comunidad degradada a no oficial')
      fetchCommunities()
    } catch { setError('Error al degradar') }
  }

  const handleToggleActive = async (id: string) => {
    if (!session?.accessToken) return
    try {
      await adminApi.toggleCommunityActive(id, session.accessToken)
      setMessage('Estado de actividad cambiado')
      fetchCommunities()
    } catch { setError('Error al cambiar estado') }
  }

  const handleDelete = async (id: string) => {
    if (!session?.accessToken || !confirm('¿Eliminar esta comunidad permanentemente?')) return
    try {
      await adminApi.deleteCommunity(id, session.accessToken)
      setMessage('Comunidad eliminada')
      fetchCommunities()
    } catch { setError('Error al eliminar') }
  }

  return (
    <div>
      <h1 className="admin-title" style={{ marginBottom: '1rem' }}>Comunidades</h1>

      {error && <p className="admin-error">{error}</p>}
      {message && <p className="admin-success">{message}</p>}

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Buscar comunidad..." className="input" style={{ maxWidth: 300 }}
          onKeyDown={e => e.key === 'Enter' && fetchCommunities()} />
        <button onClick={fetchCommunities} className="btn-secondary">Buscar</button>
      </div>

      {promotionRequests.length > 0 && (
        <div className="promotion-section">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.75rem' }}>
            Solicitudes de Promoción ({promotionRequests.length})
          </h2>
          <table className="admin-table" style={{ marginBottom: '1.5rem' }}>
            <thead>
              <tr><th>Nombre</th><th>Miembros</th><th>Umbral</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {promotionRequests.map(c => (
                <tr key={c.id} style={{ background: 'var(--bg-elevated)' }}>
                  <td>{c.name}</td>
                  <td>{c.members_count} / {c.members_threshold}</td>
                  <td><span className="admin-badge" style={{ background: 'var(--accent)', color: '#000' }}>Lista para oficial</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button onClick={() => handlePromote(c.id)} className="btn-action" title="Aprobar">✅ Aprobar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <table className="admin-table">
        <thead>
          <tr><th>Nombre</th><th>Slug</th><th>Tipo</th><th>Miembros</th><th>Posts</th><th>Activa</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {communities.map((c: any) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.slug}</td>
              <td><span className={`admin-badge admin-badge--${c.type}`}>{c.type}</span></td>
              <td>{c.members_count} / {c.members_threshold ?? '-'}</td>
              <td>{c._count?.posts ?? 0}</td>
              <td>{c.is_active ? '✅' : '❌'}</td>
              <td>
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                  {c.type === 'no_oficial' ? (
                    <button onClick={() => handlePromote(c.id)} className="btn-action" title="Promover a oficial">⭐</button>
                  ) : (
                    <button onClick={() => handleDemote(c.id)} className="btn-action" title="Degradar">⬇️</button>
                  )}
                  <button onClick={() => handleToggleActive(c.id)} className="btn-action" title={c.is_active ? 'Desactivar' : 'Activar'}>
                    {c.is_active ? '⏸️' : '▶️'}
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="btn-action" title="Eliminar">🗑️</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="admin-pagination">
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary">Anterior</button>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Página {page} — {total} total</span>
        <button disabled={communities.length < 20} onClick={() => setPage(p => p + 1)} className="btn-secondary">Siguiente</button>
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
        .promotion-section { margin-bottom: 1.5rem; background: var(--bg-surface); border: 1px solid var(--accent); border-radius: var(--radius-lg); padding: 1.25rem; }
      `}</style>
    </div>
  )
}
