'use client'
import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import { useSession } from 'next-auth/react'

export default function AdminAnimePage() {
  const { data: session } = useSession()
  const [animes, setAnimes] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [importMalId, setImportMalId] = useState('')
  const [form, setForm] = useState({
    title_es: '', title_en: '', title_jp: '', synopsis: '', status: 'proximamente',
    year: 2024, season: '', studio: '', total_episodes: 0,
    cover_url: '', banner_url: '', genres: '', mal_rating: 0, mal_id: 0,
    aliases: '', same_as: '',
  })

  const fetchAnimes = () => {
    if (!session?.accessToken) return
    adminApi.getAnimes(session.accessToken, page, search || undefined)
      .then((res: any) => {
        setAnimes(res.data ?? [])
        setTotal(res.meta?.total ?? 0)
      })
      .catch((e: Error) => setError('Error: ' + e.message))
  }

  useEffect(() => { fetchAnimes() }, [session, page])

  const resetForm = () => {
    setShowForm(false)
    setEditing(null)
    setForm({ title_es: '', title_en: '', title_jp: '', synopsis: '', status: 'proximamente', year: 2024, season: '', studio: '', total_episodes: 0, cover_url: '', banner_url: '', genres: '', mal_rating: 0, mal_id: 0, aliases: '', same_as: '' })
  }

  const handleSave = async () => {
    if (!session?.accessToken) return
    setError('')
    setMessage('')
    try {
      const body = {
        titleEs: form.title_es,
        titleEn: form.title_en || undefined,
        titleJp: form.title_jp || undefined,
        synopsis: form.synopsis || undefined,
        status: form.status,
        year: form.year || undefined,
        season: form.season || undefined,
        studio: form.studio || undefined,
        totalEpisodes: form.total_episodes || undefined,
        coverUrl: form.cover_url || undefined,
        bannerUrl: form.banner_url || undefined,
        malRating: form.mal_rating || undefined,
        malId: form.mal_id || undefined,
        genres: form.genres ? form.genres.split(',').map((g: string) => g.trim()).filter(Boolean) : [],
        aliases: form.aliases ? form.aliases.split(',').map((a: string) => a.trim()).filter(Boolean) : [],
        sameAs: form.same_as ? form.same_as.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      }
      if (editing) {
        await adminApi.updateAnime(editing.id, body, session.accessToken)
        setMessage('Anime actualizado')
      } else {
        await adminApi.createAnime(body, session.accessToken)
        setMessage('Anime creado')
      }
      resetForm()
      fetchAnimes()
    } catch {
      setError('Error al guardar anime')
    }
  }

  const handleImport = async () => {
    if (!session?.accessToken || !importMalId) return
    setError('')
    setMessage('')
    try {
      const data: any = await adminApi.importAnimeFromMAL(parseInt(importMalId), session.accessToken)
      setForm({
        title_es: data.title_es ?? '', title_en: data.title_en ?? '', title_jp: data.title_jp ?? '',
        synopsis: data.synopsis ?? '', status: data.status ?? 'proximamente', year: data.year ?? 2024,
        season: data.season ?? '', studio: data.studio ?? '', total_episodes: data.total_episodes ?? 0,
        cover_url: data.cover_url ?? '', banner_url: data.banner_url ?? '',
        genres: (data.genres ?? []).join(', '), mal_rating: data.mal_rating ?? 0, mal_id: data.mal_id ?? 0,
        aliases: (data.aliases ?? []).join(', '), same_as: (data.same_as ?? []).join(', '),
      })
      setShowForm(true)
      setMessage('Datos importados desde MAL. Revisá y guardá.')
    } catch {
      setError('Error al importar desde MAL')
    }
  }

  const handleImportFull = async () => {
    if (!session?.accessToken || !importMalId) return
    setError('')
    setMessage('')
    try {
      const result: any = await adminApi.importFullAnimeFromMAL(parseInt(importMalId), session.accessToken)
      setMessage(`✅ ${result.message ?? 'Importación completa exitosa'}`)
      fetchAnimes()
    } catch (err: any) {
      setError('Error al importar: ' + (err?.message ?? ''))
    }
  }

  const editAnime = (a: any) => {
    setEditing(a)
    setForm({
      title_es: a.title_es ?? '',
      title_en: a.title_en ?? '',
      title_jp: a.title_jp ?? '',
      synopsis: a.synopsis ?? '',
      status: a.status ?? 'proximamente',
      year: a.year ?? 2024,
      season: a.season ?? '',
      studio: a.studio ?? '',
      total_episodes: a.total_episodes ?? 0,
      cover_url: a.cover_url ?? '',
      banner_url: a.banner_url ?? '',
      genres: (a.genres ?? []).map((g: any) => g.name ?? g).join(', '),
      mal_rating: a.mal_rating ?? 0,
      mal_id: a.mal_id ?? 0,
      aliases: (a.aliases ?? []).join(', '),
      same_as: (a.same_as ?? []).join(', '),
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!session?.accessToken || !confirm('¿Eliminar este anime permanentemente?')) return
    try {
      await adminApi.deleteAnime(id, session.accessToken)
      setMessage('Anime eliminado')
      fetchAnimes()
    } catch {
      setError('Error al eliminar anime')
    }
  }

  const handleToggleVisibility = (animeId: string) => {
    if (!session?.accessToken) return
    adminApi.toggleAnimeVisibility(animeId, session.accessToken)
      .then(fetchAnimes)
      .catch(() => setError('Error al cambiar visibilidad'))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 className="admin-title">Gestión de Anime</h1>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary">+ Nuevo anime</button>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {message && <p className="admin-success">{message}</p>}

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Buscar anime..." className="input" style={{ maxWidth: 300 }}
          onKeyDown={e => e.key === 'Enter' && fetchAnimes()} />
        <button onClick={fetchAnimes} className="btn-secondary">Buscar</button>
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
          <input type="number" value={importMalId} onChange={e => setImportMalId(e.target.value)}
            placeholder="MAL ID" className="input" style={{ maxWidth: 100 }} />
          <button onClick={handleImport} className="btn-secondary">Importar MAL</button>
          <button onClick={handleImportFull} className="btn-primary">Importar completo</button>
        </div>
      </div>

      {showForm && (
        <div className="episode-form" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, margin: '0 0 0.75rem', color: 'var(--text-primary)' }}>
            {editing ? 'Editar anime' : 'Nuevo anime'}
          </h3>
          <div className="form-grid">
            <div className="settings-field"><label>Título ES*</label><input type="text" value={form.title_es} onChange={e => setForm(f => ({ ...f, title_es: e.target.value }))} className="input" /></div>
            <div className="settings-field"><label>Título EN</label><input type="text" value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))} className="input" /></div>
            <div className="settings-field"><label>Título JP</label><input type="text" value={form.title_jp} onChange={e => setForm(f => ({ ...f, title_jp: e.target.value }))} className="input" /></div>
            <div className="settings-field"><label>Estado</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input">
              <option value="en_emision">En emisión</option><option value="finalizado">Finalizado</option><option value="proximamente">Próximamente</option>
            </select></div>
            <div className="settings-field"><label>Año</label><input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) || 2024 }))} className="input" /></div>
            <div className="settings-field"><label>Temporada</label><select value={form.season} onChange={e => setForm(f => ({ ...f, season: e.target.value }))} className="input">
              <option value="">Sin especificar</option><option value="invierno">Invierno</option><option value="primavera">Primavera</option>
              <option value="verano">Verano</option><option value="otoño">Otoño</option>
            </select></div>
            <div className="settings-field"><label>Estudio</label><input type="text" value={form.studio} onChange={e => setForm(f => ({ ...f, studio: e.target.value }))} className="input" /></div>
            <div className="settings-field"><label>Total episodios</label><input type="number" value={form.total_episodes} onChange={e => setForm(f => ({ ...f, total_episodes: parseInt(e.target.value) || 0 }))} className="input" /></div>
            <div className="settings-field"><label>Rating MAL</label><input type="number" step="0.1" value={form.mal_rating} onChange={e => setForm(f => ({ ...f, mal_rating: parseFloat(e.target.value) || 0 }))} className="input" /></div>
            <div className="settings-field" style={{ gridColumn: '1 / -1' }}><label>Sinopsis</label><textarea value={form.synopsis} onChange={e => setForm(f => ({ ...f, synopsis: e.target.value }))} className="input" rows={2} /></div>
            <div className="settings-field" style={{ gridColumn: '1 / -1' }}><label>URL Cover</label><input type="text" value={form.cover_url} onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))} className="input" /></div>
            <div className="settings-field" style={{ gridColumn: '1 / -1' }}><label>URL Banner</label><input type="text" value={form.banner_url} onChange={e => setForm(f => ({ ...f, banner_url: e.target.value }))} className="input" /></div>
            <div className="settings-field" style={{ gridColumn: '1 / -1' }}><label>Géneros (separados por coma)</label><input type="text" value={form.genres} onChange={e => setForm(f => ({ ...f, genres: e.target.value }))} className="input" placeholder="Acción, Romance, Shonen" /></div>
            <div className="settings-field" style={{ gridColumn: '1 / -1' }}><label>Alias / Sinónimos (separados por coma)</label><input type="text" value={form.aliases} onChange={e => setForm(f => ({ ...f, aliases: e.target.value }))} className="input" placeholder="Cyberpunk Edgerunners, Cyberpunk: Edgerunners, CP: Edgerunners" /></div>
            <div className="settings-field" style={{ gridColumn: '1 / -1' }}><label>SameAs / URLs externas (separadas por coma)</label><input type="text" value={form.same_as} onChange={e => setForm(f => ({ ...f, same_as: e.target.value }))} className="input" placeholder="https://myanimelist.net/anime/52034, https://en.wikipedia.org/wiki/Cyberpunk:_Edgerunners" /></div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button onClick={handleSave} className="btn-primary">{editing ? 'Actualizar' : 'Crear'}</button>
            <button onClick={resetForm} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      <table className="admin-table">
        <thead>
          <tr><th>Slug</th><th>Título ES</th><th>Título JP</th><th>Status</th><th>Rating</th><th>Visible</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {animes.map((a: any) => (
            <tr key={a.id}>
              <td>{a.slug}</td>
              <td>{a.title_es}</td>
              <td>{a.title_jp}</td>
              <td><span className="admin-badge">{a.status}</span></td>
              <td>{a.mal_rating?.toFixed(1) ?? '-'}</td>
              <td>{a.is_visible ? '✅' : '❌'}</td>
              <td>
                <button onClick={() => handleToggleVisibility(a.id)} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginRight: '0.25rem' }}>
                  {a.is_visible ? 'Ocultar' : 'Mostrar'}
                </button>
                <button onClick={() => editAnime(a)} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginRight: '0.25rem' }}>Editar</button>
                <button onClick={() => handleDelete(a.id)} className="btn-danger" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="admin-pagination">
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary">Anterior</button>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Página {page} — {total} total</span>
        <button disabled={animes.length < 20} onClick={() => setPage(p => p + 1)} className="btn-secondary">Siguiente</button>
      </div>

      <style>{`
        .admin-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0; }
        .admin-error { color: var(--accent); }
        .admin-success { color: var(--success, #22c55e); font-size: 0.875rem; margin-bottom: 1rem; }
        .episode-form { padding: 1.25rem; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .settings-field { display: flex; flex-direction: column; gap: 0.375rem; }
        .settings-field label { font-size: 0.8125rem; color: var(--text-muted); }
        .admin-table { width: 100%; border-collapse: collapse; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
        .admin-table th, .admin-table td { text-align: left; padding: 0.625rem 0.875rem; font-size: 0.875rem; border-bottom: 1px solid var(--border); }
        .admin-table th { font-family: var(--font-display); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); background: var(--bg-elevated); }
        .admin-table td { color: var(--text-secondary); }
        .admin-badge { font-family: var(--font-display); font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.15rem 0.5rem; border-radius: var(--radius-full); background: var(--bg-overlay); color: var(--text-muted); }
        .admin-pagination { display: flex; align-items: center; gap: 1rem; justify-content: center; margin-top: 1.5rem; }
        .btn-primary, .btn-secondary, .btn-danger { font-family: var(--font-display); font-size: 0.8125rem; font-weight: 600; padding: 0.5rem 1rem; border-radius: var(--radius-lg); border: none; cursor: pointer; transition: all var(--transition-fast); }
        .btn-primary { background: var(--accent); color: #000; }
        .btn-secondary { background: var(--bg-overlay); color: var(--text-primary); }
        .btn-danger { background: var(--accent); color: #000; opacity: 0.8; }
        .input { background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-primary); padding: 0.5rem 0.75rem; border-radius: var(--radius-lg); font-size: 0.875rem; width: 100%; }
      `}</style>
    </div>
  )
}
