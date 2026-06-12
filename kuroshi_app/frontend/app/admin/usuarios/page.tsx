'use client'
import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import { useSession } from 'next-auth/react'

export default function AdminUsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [actionUserId, setActionUserId] = useState<string | null>(null)
  const isOwner = session?.user?.role === 'owner'

  const fetchUsers = () => {
    if (!session?.accessToken) return
    adminApi.getUsers(session.accessToken, page, filter || undefined)
      .then((res: any) => {
        setUsers(res.data ?? [])
        setTotal(res.meta?.total ?? 0)
      })
      .catch(() => setError('Error al cargar usuarios'))
  }

  useEffect(() => { fetchUsers() }, [session, page])

  const handleRoleChange = async (userId: string, role: string) => {
    if (!session?.accessToken) return
    try {
      await adminApi.changeUserRole(userId, role, session.accessToken)
      setMessage('Rol actualizado')
      fetchUsers()
    } catch { setError('Error al cambiar rol') }
  }

  const handleWarn = async (userId: string) => {
    const reason = prompt('Motivo de la advertencia:')
    if (!reason || !session?.accessToken) return
    try {
      await adminApi.warnUser(userId, reason, session.accessToken)
      setMessage('Advertencia enviada')
      fetchUsers()
    } catch { setError('Error al enviar advertencia') }
  }

  const handleSilence = async (userId: string) => {
    const days = prompt('Días de silencio (1-365):', '7')
    if (!days || !session?.accessToken) return
    const reason = prompt('Motivo:')
    try {
      await adminApi.silenceUser(userId, parseInt(days), reason ?? '', session.accessToken)
      setMessage('Usuario silenciado')
      fetchUsers()
    } catch { setError('Error al silenciar') }
  }

  const handleBan = async (userId: string) => {
    const days = prompt('Días de baneo (dejar vacío = permanente):')
    if (!session?.accessToken) return
    const reason = prompt('Motivo del baneo:')
    try {
      await adminApi.banUser(userId, days ? parseInt(days) : null, reason ?? '', session.accessToken)
      setMessage('Usuario baneado')
      fetchUsers()
    } catch { setError('Error al banear') }
  }

  const handleUnban = async (userId: string) => {
    if (!session?.accessToken || !confirm('¿Levantar el baneo de este usuario?')) return
    try {
      await adminApi.unbanUser(userId, session.accessToken)
      setMessage('Baneo levantado')
      fetchUsers()
    } catch { setError('Error al levantar baneo') }
  }

  const handleDelete = async (userId: string) => {
    if (!session?.accessToken || !confirm('¿Eliminar este usuario permanentemente? Esta acción no se puede deshacer.')) return
    try {
      await adminApi.deleteUser(userId, session.accessToken)
      setMessage('Usuario eliminado')
      fetchUsers()
    } catch { setError('Error al eliminar usuario') }
  }

  return (
    <div>
      <h1 className="admin-title" style={{ marginBottom: '1rem' }}>Usuarios</h1>

      {error && <p className="admin-error">{error}</p>}
      {message && <p className="admin-success">{message}</p>}

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }} className="input" style={{ maxWidth: 200 }}>
          <option value="">Todos</option>
          <option value="activos">Activos (3 días)</option>
          <option value="silenciados">Silenciados</option>
          <option value="baneados">Baneados</option>
          <option value="moderadores">Moderadores</option>
        </select>
        <button onClick={fetchUsers} className="btn-secondary">Filtrar</button>
      </div>

      <table className="admin-table">
        <thead>
          <tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Estado</th><th>Registro</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {users.map((u: any) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>
                {isOwner ? (
                  <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                    className="input" style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', maxWidth: 120 }}>
                    <option value="usuario">usuario</option>
                    <option value="moderador">moderador</option>
                  </select>
                ) : (
                  <span className="admin-badge">{u.role}</span>
                )}
              </td>
              <td>
                {u.is_banned ? '🔴 Baneado' : u.is_silenced ? '🔇 Silenciado' : '✅ Activo'}
                {(u.is_banned && u.banned_until) && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}> hasta {new Date(u.banned_until).toLocaleDateString('es')}</span>}
                {(u.is_silenced && u.silenced_until) && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}> hasta {new Date(u.silenced_until).toLocaleDateString('es')}</span>}
              </td>
              <td>{new Date(u.created_at).toLocaleDateString('es')}</td>
              <td>
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                  <button onClick={() => handleWarn(u.id)} className="btn-action" title="Advertir">⚠️</button>
                  {!u.is_silenced && <button onClick={() => handleSilence(u.id)} className="btn-action" title="Silenciar">🔇</button>}
                  {!u.is_banned ? (
                    isOwner && <button onClick={() => handleBan(u.id)} className="btn-action" title="Banear">🔨</button>
                  ) : (
                    isOwner && <button onClick={() => handleUnban(u.id)} className="btn-action" title="Desbanear">✅</button>
                  )}
                  {isOwner && <button onClick={() => handleDelete(u.id)} className="btn-action" title="Eliminar">🗑️</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="admin-pagination">
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary">Anterior</button>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Página {page} — {total} total</span>
        <button disabled={users.length < 20} onClick={() => setPage(p => p + 1)} className="btn-secondary">Siguiente</button>
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
        .btn-action { background: var(--bg-elevated); padding: 0.2rem 0.35rem; font-size: 0.875rem; border-radius: var(--radius-md); }
        .input { background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-primary); padding: 0.5rem 0.75rem; border-radius: var(--radius-lg); font-size: 0.875rem; width: 100%; }
      `}</style>
    </div>
  )
}
