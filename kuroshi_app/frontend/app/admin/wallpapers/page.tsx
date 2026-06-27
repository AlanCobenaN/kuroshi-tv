'use client'
import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { adminApi } from '@/lib/api'
import type { Wallpaper } from '@/types'

export default function AdminWallpapersPage() {
  const { data: session } = useSession()
  const [wallpapers, setWallpapers] = useState<Wallpaper[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadWallpapers = async () => {
    if (!session?.accessToken) return
    try {
      const data = await adminApi.getWallpapers(session.accessToken)
      setWallpapers(data as Wallpaper[])
    } catch {
      setError('Error al cargar wallpapers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWallpapers()
  }, [session])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setPreview(result)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!preview || !session?.accessToken) return

    const mimeMatch = preview.match(/^data:(image\/\w+);base64,/)
    if (!mimeMatch) {
      setError('Formato de imagen no válido')
      return
    }

    const mimeType = mimeMatch[1]
    const base64 = preview.replace(/^data:image\/\w+;base64,/, '')

    setUploading(true)
    setError('')
    setMessage('')

    try {
      const result = await adminApi.createWallpaper({ image: base64, mimeType }, session.accessToken)
      setWallpapers(prev => [result as Wallpaper, ...prev])
      setPreview(null)
      setMessage('Wallpaper subido correctamente')
      if (fileRef.current) fileRef.current.value = ''
    } catch {
      setError('Error al subir wallpaper')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!session?.accessToken) return
    if (!confirm('¿Eliminar este wallpaper?')) return

    try {
      await adminApi.deleteWallpaper(id, session.accessToken)
      setWallpapers(prev => prev.filter(w => w.id !== id))
      setMessage('Wallpaper eliminado')
    } catch {
      setError('Error al eliminar wallpaper')
    }
  }

  return (
    <div>
      <h1 className="admin-title" style={{ marginBottom: '1.5rem' }}>Wallpapers de Fondo</h1>

      {error && <p className="admin-error">{error}</p>}
      {message && <p className="admin-success">{message}</p>}

      <div className="wallpaper-upload-section">
        <h2>Subir nuevo wallpaper</h2>
        <p className="wallpaper-hint">Imágenes 4K recomendadas (JPG, PNG, WebP — máx 7MB)</p>
        <div className="wallpaper-upload-row">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="wallpaper-file-input"
          />
          {preview && (
            <button onClick={handleUpload} disabled={uploading} className="btn-primary">
              {uploading ? 'Subiendo...' : 'Subir wallpaper'}
            </button>
          )}
        </div>
        {preview && (
          <div className="wallpaper-preview">
            <img src={preview} alt="Preview" />
          </div>
        )}
      </div>

      <div className="wallpaper-list">
        <h2>Wallpapers actuales ({wallpapers.length})</h2>
        {loading ? (
          <p className="admin-loading">Cargando...</p>
        ) : wallpapers.length === 0 ? (
          <p className="admin-empty">No hay wallpapers. Sube el primero.</p>
        ) : (
          <div className="wallpaper-grid">
            {wallpapers.map(w => (
              <div key={w.id} className="wallpaper-card">
                <div className="wallpaper-card-img">
                  <img src={w.url} alt="Wallpaper" />
                </div>
                <div className="wallpaper-card-info">
                  <span className="wallpaper-card-date">
                    {new Date(w.created_at ?? '').toLocaleDateString()}
                  </span>
                  <button onClick={() => handleDelete(w.id)} className="wallpaper-delete-btn">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .admin-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0; }
        .admin-loading { color: var(--text-muted); }
        .admin-empty { color: var(--text-muted); font-size: 0.875rem; }
        .admin-error { color: var(--accent); }
        .admin-success { color: var(--success, #22c55e); font-size: 0.875rem; margin-bottom: 1rem; }

        .wallpaper-upload-section { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1.5rem; }
        .wallpaper-upload-section h2 { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.25rem; }
        .wallpaper-hint { font-size: 0.8125rem; color: var(--text-muted); margin: 0 0 0.75rem; }
        .wallpaper-upload-row { display: flex; align-items: center; gap: 0.75rem; }
        .wallpaper-file-input { font-size: 0.875rem; color: var(--text-secondary); }

        .wallpaper-preview { margin-top: 0.75rem; border-radius: var(--radius-md); overflow: hidden; max-width: 400px; }
        .wallpaper-preview img { width: 100%; height: auto; display: block; object-fit: cover; max-height: 200px; }

        .wallpaper-list h2 { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.75rem; }
        .wallpaper-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
        .wallpaper-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
        .wallpaper-card-img { aspect-ratio: 16/9; overflow: hidden; }
        .wallpaper-card-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .wallpaper-card-info { display: flex; align-items: center; justify-content: space-between; padding: 0.625rem 0.75rem; }
        .wallpaper-card-date { font-size: 0.75rem; color: var(--text-muted); }
        .wallpaper-delete-btn { background: none; border: 1px solid var(--accent); color: var(--accent); font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.625rem; border-radius: var(--radius-sm); cursor: pointer; transition: all var(--transition-fast); }
        .wallpaper-delete-btn:hover { background: var(--accent); color: white; }
      `}</style>
    </div>
  )
}
