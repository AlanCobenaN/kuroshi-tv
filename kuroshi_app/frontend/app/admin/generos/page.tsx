'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { adminApi } from '@/lib/api'

interface Genre {
  id: string
  name: string
  animes_count: number
}

export default function AdminGenresPage() {
  const { data: session } = useSession()
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Genre | null>(null)
  const [formName, setFormName] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchGenres = () => {
    if (!session?.accessToken) return
    setLoading(true)
    adminApi.getGenres(session.accessToken)
      .then((data: any) => setGenres(data ?? []))
      .catch(() => setError('Error al cargar géneros'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchGenres() }, [session])

  const resetForm = () => {
    setShowForm(false)
    setEditing(null)
    setFormName('')
    setError('')
    setMessage('')
  }

  const handleNew = () => {
    setEditing(null)
    setFormName('')
    setShowForm(true)
  }

  const handleEdit = (g: Genre) => {
    setEditing(g)
    setFormName(g.name)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!session?.accessToken) return
    const trimmed = formName.trim()
    if (!trimmed) return

    setSaving(true)
    setError('')
    setMessage('')
    try {
      if (editing) {
        await adminApi.updateGenre(editing.id, trimmed, session.accessToken)
        setMessage('Género actualizado correctamente')
      } else {
        await adminApi.createGenre(trimmed, session.accessToken)
        setMessage('Género creado correctamente')
      }
      resetForm()
      fetchGenres()
    } catch (err: any) {
      setError(err?.message ?? 'Error al guardar el género')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!session?.accessToken) return
    if (!confirm(`¿Eliminar el género "${name}"?`)) return

    setError('')
    setMessage('')
    try {
      await adminApi.deleteGenre(id, session.accessToken)
      setMessage(`Género "${name}" eliminado`)
      fetchGenres()
    } catch (err: any) {
      setError(err?.message ?? 'Error al eliminar el género')
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-title">Géneros</h1>
        {!showForm && (
          <button onClick={handleNew} className="btn-primary">
            + Nuevo género
          </button>
        )}
      </div>

      {error && <p className="admin-error">{error}</p>}
      {message && <p className="admin-success">{message}</p>}

      {showForm && (
        <div className="genre-form">
          <label>Nombre del género</label>
          <div className="genre-form-row">
            <input
              type="text"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              className="input"
              placeholder="Ej: Acción"
              autoFocus
              maxLength={50}
            />
            <button onClick={handleSave} disabled={saving || !formName.trim()} className="btn-primary">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={resetForm} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="admin-loading">Cargando géneros...</p>
      ) : genres.length === 0 ? (
        <p className="admin-empty">No hay géneros registrados.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Animes</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {genres.map(g => (
              <tr key={g.id}>
                <td className="genre-name">{g.name}</td>
                <td>{g.animes_count ?? 0}</td>
                <td className="genre-actions">
                  <button
                    onClick={() => handleEdit(g)}
                    className="btn-small btn-edit"
                  >
                    Renombrar
                  </button>
                  <button
                    onClick={() => handleDelete(g.id, g.name)}
                    className="btn-small btn-delete"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <style>{`
        .admin-page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
        .admin-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0; }
        .admin-loading { color: var(--text-muted); }
        .admin-empty { color: var(--text-muted); }
        .admin-error { color: var(--accent); margin-bottom: 1rem; }
        .admin-success { color: var(--success, #22c55e); font-size: 0.875rem; margin-bottom: 1rem; }
        .genre-form { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1rem; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; max-width: 500px; }
        .genre-form label { font-size: 0.8125rem; color: var(--text-muted); }
        .genre-form-row { display: flex; gap: 0.5rem; align-items: center; }
        .genre-form-row .input { flex: 1; }
        .genre-name { font-weight: 600; color: var(--text-primary); }
        .genre-actions { display: flex; gap: 0.5rem; }
        .btn-small { padding: 0.25rem 0.75rem; font-size: 0.75rem; font-family: var(--font-display); font-weight: 600; border-radius: var(--radius-md); cursor: pointer; border: 1px solid var(--border); background: var(--bg-overlay); color: var(--text-secondary); transition: all var(--transition-fast); }
        .btn-small:hover { border-color: var(--border-hover); color: var(--text-primary); }
        .btn-edit { color: var(--accent); }
        .btn-delete { color: #ef4444; }
        .btn-secondary { padding: 0.5rem 1rem; font-size: 0.8125rem; font-family: var(--font-display); font-weight: 600; border-radius: var(--radius-md); cursor: pointer; border: 1px solid var(--border); background: var(--bg-overlay); color: var(--text-secondary); transition: all var(--transition-fast); }
        .btn-secondary:hover { border-color: var(--border-hover); color: var(--text-primary); }
      `}</style>
    </div>
  )
}
