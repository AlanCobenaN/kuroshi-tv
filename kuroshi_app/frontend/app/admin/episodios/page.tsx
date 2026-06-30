'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { adminApi, animeApi } from '@/lib/api'

export default function AdminEpisodesPage() {
  const { data: session } = useSession()
  const [selectedAnime, setSelectedAnime] = useState('')
  const [selectedAnimeTitle, setSelectedAnimeTitle] = useState('')
  const [episodes, setEpisodes] = useState<any[]>([])
  const [seasons, setSeasons] = useState<any[]>([])
  const [animeSearch, setAnimeSearch] = useState('')
  const [animeResults, setAnimeResults] = useState<{ slug: string; title: string }[]>([])
  const [animeSearching, setAnimeSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingEpisode, setEditingEpisode] = useState<any>(null)
  const [form, setForm] = useState({
    animeSlug: '', seasonNumber: 1, seasonTitle: '', number: 1, title: '', synopsis: '',
    thumbnailUrl: '', airDate: '',
  })
  const [serverEpId, setServerEpId] = useState<string | null>(null)
  const [serverList, setServerList] = useState<any[]>([])
  const [serverName, setServerName] = useState('')
  const [serverUrl, setServerUrl] = useState('')
  const [epSearchQuery, setEpSearchQuery] = useState('')
  const [latestAnimes, setLatestAnimes] = useState<{ slug: string; title: string; cover_url: string; total_episodes: number }[]>([])
  const [syncingEpisodes, setSyncingEpisodes] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Fetch latest 10 animes
  useEffect(() => {
    if (!session?.accessToken) return
    adminApi.getAnimes(session.accessToken, 1, undefined, 10)
      .then((res: any) => setLatestAnimes((res.data ?? []).map((a: any) => ({
        slug: a.slug, title: a.title_es ?? a.slug,
        cover_url: a.cover_url ?? '', total_episodes: a.total_episodes ?? 0,
      }))))
      .catch(() => {})
  }, [session])

  // Debounced anime search
  useEffect(() => {
    if (!session?.accessToken || !animeSearch.trim()) { setAnimeResults([]); return }
    setAnimeSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res: any = await adminApi.getAnimes(session.accessToken, 1, animeSearch.trim())
        setAnimeResults((res.data ?? []).map((a: any) => ({ slug: a.slug, title: a.title_es ?? a.slug })))
      } catch { setAnimeResults([]) }
      setAnimeSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [animeSearch, session])

  const loadEpisodes = async (slug: string) => {
    if (!slug) { setEpisodes([]); return }
    setSelectedAnime(slug)
    setForm(f => ({ ...f, animeSlug: slug }))
    try {
      const seasonsData: any = await animeApi.getEpisodes(slug, { order: 'asc' })
      const rawSeasons: any[] = Array.isArray(seasonsData) ? seasonsData : seasonsData?.data ?? []
      const allEpisodes: any[] = []

      for (const season of rawSeasons) {
        const eps = season.episodes ?? []
        for (const ep of eps) {
          allEpisodes.push({ ...ep, seasonNumber: season.number, seasonTitle: season.title })
        }
      }
      setSeasons(rawSeasons)
      setEpisodes(allEpisodes.sort((a, b) => b.number - a.number))
    } catch (err: any) {
      setError(err?.message ?? 'Error al cargar episodios')
      setEpisodes([])
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingEpisode(null)
    setForm({
      animeSlug: selectedAnime, seasonNumber: 1, seasonTitle: '', number: 1, title: '', synopsis: '',
      thumbnailUrl: '', airDate: '',
    })
  }

  const handleSave = async () => {
    if (!session?.accessToken) return
    setError('')
    setMessage('')
    try {
      const body = { ...form }
      if (!body.airDate) body.airDate = undefined as any
      if (!body.synopsis) body.synopsis = undefined as any
      if (!body.thumbnailUrl) body.thumbnailUrl = undefined as any
      if (!body.title) body.title = undefined as any
      if (seasons.some(s => s.number === body.seasonNumber)) body.seasonTitle = undefined as any

      if (editingEpisode) {
        await adminApi.updateEpisode(editingEpisode.id, body, session.accessToken)
        setMessage('Episodio actualizado')
      } else {
        await adminApi.createEpisode(body, session.accessToken)
        setMessage('Episodio creado')
      }
      resetForm()
      loadEpisodes(selectedAnime)
    } catch (err: any) {
      setError(err?.message ?? 'Error al guardar episodio')
    }
  }

  const handleRenameSeason = async (seasonId: string, currentTitle: string) => {
    if (!session?.accessToken) return
    const newTitle = prompt('Nuevo nombre para la temporada:', currentTitle)
    if (!newTitle || newTitle === currentTitle) return
    try {
      await adminApi.updateSeason(seasonId, { title: newTitle }, session.accessToken)
      setMessage('Temporada renombrada')
      loadEpisodes(selectedAnime)
    } catch (err: any) {
      setError(err?.message ?? 'Error al renombrar temporada')
    }
  }

  const handleDeleteSeason = async (seasonId: string) => {
    if (!session?.accessToken || !confirm('¿Eliminar esta temporada y TODOS sus episodios?')) return
    try {
      await adminApi.deleteSeason(seasonId, session.accessToken)
      setMessage('Temporada eliminada')
      loadEpisodes(selectedAnime)
    } catch (err: any) {
      setError(err?.message ?? 'Error al eliminar temporada')
    }
  }

  const handleDelete = async (episodeId: string) => {
    if (!session?.accessToken || !confirm('¿Eliminar este episodio?')) return
    try {
      await adminApi.deleteEpisode(episodeId, session.accessToken)
      setMessage('Episodio eliminado')
      loadEpisodes(selectedAnime)
    } catch (err: any) {
      setError(err?.message ?? 'Error al eliminar episodio')
    }
  }

  const editEpisode = (ep: any) => {
    setEditingEpisode(ep)
    setForm({
      animeSlug: selectedAnime, seasonNumber: ep.seasonNumber ?? 1, seasonTitle: '',
      number: ep.number, title: ep.title ?? '', synopsis: ep.synopsis ?? '',
      thumbnailUrl: ep.thumbnail_url ?? '', airDate: ep.air_date ? ep.air_date.slice(0, 10) : '',
    })
    setShowForm(true)
  }

  const openServerManager = async (episodeId: string) => {
    setServerEpId(episodeId)
    setServerName('')
    setServerUrl('')
    try {
      const ep: any = await animeApi.getEpisode(selectedAnime, episodes.find(e => e.id === episodeId)?.number ?? 1, session?.accessToken)
      setServerList(ep.video_servers ?? [])
    } catch {
      setServerList([])
    }
  }

  const addServer = async () => {
    if (!session?.accessToken || !serverEpId || !serverName.trim() || !serverUrl.trim()) return
    setError('')
    try {
      await adminApi.addVideoServer(serverEpId, { serverName: serverName.trim(), embedUrl: serverUrl.trim() }, session.accessToken)
      setMessage('Servidor añadido')
      setServerName('')
      setServerUrl('')
      const ep: any = await animeApi.getEpisode(selectedAnime, episodes.find(e => e.id === serverEpId)?.number ?? 1, session.accessToken)
      setServerList(ep.video_servers ?? [])
      loadEpisodes(selectedAnime)
    } catch (err: any) {
      setError(err?.message ?? 'Error al añadir servidor')
    }
  }

  const handleSyncEpisodes = async () => {
    if (!session?.accessToken || !selectedAnime) return
    setSyncingEpisodes(true)
    setError('')
    setMessage('')
    try {
      const result: any = await adminApi.syncEpisodesFromMAL(selectedAnime, session.accessToken)
      setMessage(`✅ ${result.message ?? 'Episodios sincronizados'}`)
      loadEpisodes(selectedAnime)
    } catch (err: any) {
      setError('Error al sincronizar: ' + (err?.message ?? ''))
    }
    setSyncingEpisodes(false)
  }

  const removeServer = async (serverId: string) => {
    if (!session?.accessToken || !confirm('¿Eliminar este servidor?')) return
    try {
      await adminApi.removeVideoServer(serverId, session.accessToken)
      setMessage('Servidor eliminado')
      setServerList(l => l.filter(s => s.id !== serverId))
      loadEpisodes(selectedAnime)
    } catch (err: any) {
      setError(err?.message ?? 'Error al eliminar servidor')
    }
  }

  return (
    <div>
      <h1 className="admin-title" style={{ marginBottom: '1rem' }}>Gestión de Episodios</h1>

      {error && <p className="admin-error">{error}</p>}
      {message && <p className="admin-success">{message}</p>}

      {!selectedAnime && latestAnimes.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.875rem', margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>Últimos animes agregados</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {latestAnimes.map(a => (
              <div key={a.slug} onClick={() => { setSelectedAnime(a.slug); setSelectedAnimeTitle(a.title); loadEpisodes(a.slug) }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', maxWidth: 260, fontSize: '0.8125rem' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-overlay)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)'}>
                {a.cover_url && <img src={a.cover_url} alt="" style={{ width: 28, height: 40, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />}
                <span style={{ color: 'var(--text-primary)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <input type="text" value={selectedAnime ? selectedAnimeTitle : animeSearch}
            onChange={e => { setSelectedAnime(''); setSelectedAnimeTitle(''); setAnimeSearch(e.target.value); setShowResults(true) }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            placeholder="Buscar anime por nombre..."
            className="input" style={{ width: '100%' }} />
          {animeSearching && <span style={{ position: 'absolute', right: 10, top: 10, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Buscando...</span>}
          {showResults && animeResults.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', zIndex: 100, maxHeight: 240, overflowY: 'auto', marginTop: 4 }}>
              {animeResults.map(a => (
                <div key={a.slug} onMouseDown={() => { setSelectedAnime(a.slug); setSelectedAnimeTitle(a.title); setAnimeSearch(''); setShowResults(false); setEpSearchQuery(''); loadEpisodes(a.slug) }}
                  style={{ padding: '0.625rem 0.875rem', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.875rem', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-overlay)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>{a.title}</div>
              ))}
            </div>
          )}
        </div>
        {selectedAnime && (
          <>
          <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary">Nuevo episodio</button>
          <button onClick={handleSyncEpisodes} disabled={syncingEpisodes} className="btn-secondary" style={{ fontSize: '0.75rem' }}>
            {syncingEpisodes ? 'Sincronizando...' : 'Sinc. episodios MAL'}
          </button>
          </>
        )}
        {selectedAnime && (
          <button onClick={() => { setSelectedAnime(''); setSelectedAnimeTitle(''); setAnimeSearch(''); setEpisodes([]) }} className="btn-secondary" style={{ fontSize: '0.75rem' }}>Limpiar</button>
        )}
      </div>

      {showForm && (
        <div className="episode-form">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, margin: '0 0 0.75rem', color: 'var(--text-primary)' }}>
            {editingEpisode ? 'Editar episodio' : 'Nuevo episodio'}
          </h3>
          <div className="form-grid">
            <div className="settings-field"><label>Número</label><input type="number" value={form.number} onChange={e => setForm(f => ({ ...f, number: parseInt(e.target.value) || 1 }))} className="input" /></div>
            <div className="settings-field"><label>Temporada</label>
              <select value={form.seasonNumber} onChange={e => {
                const val = e.target.value
                if (val === '__new__') {
                  const nextNum = Math.max(0, ...seasons.map(s => s.number)) + 1
                  setForm(f => ({ ...f, seasonNumber: nextNum, seasonTitle: `Temporada ${nextNum}` }))
                } else {
                  setForm(f => ({ ...f, seasonNumber: parseInt(val), seasonTitle: seasons.find(s => s.number === parseInt(val))?.title ?? '' }))
                }
              }} className="input">
                {seasons.map(s => (
                  <option key={s.id} value={s.number}>
                    Temporada {s.number}{s.title && s.title !== `Temporada ${s.number}` ? ` — ${s.title}` : ''} ({s._count?.episodes ?? 0} eps)
                  </option>
                ))}
                {!seasons.some(s => s.number === form.seasonNumber) && form.seasonNumber > 0 && (
                  <option value={form.seasonNumber} disabled>
                    {form.seasonTitle || `Temporada ${form.seasonNumber}`} (nueva)
                  </option>
                )}
                <option value="__new__">+ Nueva temporada</option>
              </select>
            </div>
            {!editingEpisode && !seasons.some(s => s.number === form.seasonNumber) && (
              <div className="settings-field" style={{ gridColumn: '1 / -1' }}><label>Título de temporada (opcional)</label>
                <input type="text" value={form.seasonTitle ?? ''} onChange={e => setForm(f => ({ ...f, seasonTitle: e.target.value }))} className="input" placeholder="Ej: Saga de los Andes" />
              </div>
            )}
            <div className="settings-field"><label>Título</label><input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input" /></div>
            <div className="settings-field"><label>Fecha de emisión</label><input type="date" value={form.airDate} onChange={e => setForm(f => ({ ...f, airDate: e.target.value }))} className="input" /></div>
            <div className="settings-field" style={{ gridColumn: '1 / -1' }}><label>Sinopsis</label><textarea value={form.synopsis} onChange={e => setForm(f => ({ ...f, synopsis: e.target.value }))} className="input" rows={2} /></div>
            <div className="settings-field" style={{ gridColumn: '1 / -1' }}><label>URL miniatura</label><input type="text" value={form.thumbnailUrl} onChange={e => setForm(f => ({ ...f, thumbnailUrl: e.target.value }))} className="input" /></div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button onClick={handleSave} className="btn-primary">{editingEpisode ? 'Actualizar' : 'Crear'}</button>
            <button onClick={resetForm} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      {selectedAnime && (
        <>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'center' }}>
          <input type="text" value={epSearchQuery} onChange={e => setEpSearchQuery(e.target.value)}
            placeholder="Buscar episodio por título o número..." className="input" style={{ maxWidth: 300 }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            {episodes.filter(ep =>
              !epSearchQuery.trim() ||
              String(ep.number).includes(epSearchQuery) ||
              (ep.title ?? '').toLowerCase().includes(epSearchQuery.toLowerCase())
            ).length} de {episodes.length} episodios
          </span>
        </div>
        <table className="admin-table">
          <thead>
            <tr><th>#</th><th>Título</th><th>Servidores</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {(() => {
              const filtered = episodes.filter(ep =>
                !epSearchQuery.trim() ||
                String(ep.number).includes(epSearchQuery) ||
                (ep.title ?? '').toLowerCase().includes(epSearchQuery.toLowerCase())
              )
              if (filtered.length === 0) {
                if (episodes.length === 0) {
                  return <tr key="no-episodes"><td colSpan={4} style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No hay episodios para este anime</td></tr>
                }
                return <tr key="no-results"><td colSpan={4} style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No se encontraron episodios con "{epSearchQuery}"</td></tr>
              }
              // Agrupar por temporada
              const grouped: { id: string; number: number; title: string; episodes: any[] }[] = []
              for (const ep of filtered) {
                let group = grouped.find(g => g.number === ep.seasonNumber)
                if (!group) {
                  const season = seasons.find(s => s.number === ep.seasonNumber)
                  group = { id: season?.id ?? '', number: ep.seasonNumber, title: season?.title ?? `Temporada ${ep.seasonNumber}`, episodes: [] }
                  grouped.push(group)
                }
                group.episodes.push(ep)
              }
              grouped.sort((a, b) => a.number - b.number)

              const rows: any[] = []
              for (const group of grouped) {
                rows.push(
                  <tr key={`season-${group.number}`} className="season-header-row">
                    <td colSpan={3} className="season-header-label">{group.title} ({group.episodes.length} episodios)</td>
                    <td className="season-header-actions">
                      {group.id && (
                        <>
                          <button onClick={() => handleRenameSeason(group.id, group.title)} className="btn-season" title="Renombrar temporada">✏️</button>
                          <button onClick={() => handleDeleteSeason(group.id)} className="btn-season btn-season--danger" title="Eliminar temporada">🗑️</button>
                        </>
                      )}
                    </td>
                  </tr>
                )
                for (const ep of group.episodes) {
                  rows.push(
                    <tr key={ep.id}>
                      <td>{ep.number}</td>
                      <td>{ep.title ?? `Episodio ${ep.number}`}</td>
                      <td>
                        <button onClick={() => openServerManager(ep.id)} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                          {(ep._count?.video_servers ?? ep._count?.videoServers ?? 0)} servidores
                        </button>
                      </td>
                      <td>
                        <button onClick={() => editEpisode(ep)} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginRight: '0.25rem' }}>Editar</button>
                        <button onClick={() => handleDelete(ep.id)} className="btn-danger" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>Eliminar</button>
                      </td>
                    </tr>
                  )
                }
              }
              return rows
            })()}
          </tbody>
        </table>
      </>)}

      {serverEpId && (
        <div className="server-modal-overlay" onClick={() => setServerEpId(null)}>
          <div className="server-modal" onClick={e => e.stopPropagation()}>
            <div className="server-modal-header">
              <h3>Servidores de video</h3>
              <button onClick={() => setServerEpId(null)} className="server-modal-close">&times;</button>
            </div>
            <div className="server-modal-body">
              {serverList.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No hay servidores configurados.</p>}
              {serverList.map(s => (
                <div key={s.id} className="server-item">
                  <div className="server-item-info">
                    <strong>{s.server_name ?? s.serverName}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{s.embed_url ?? s.embedUrl}</span>
                  </div>
                  <button onClick={() => removeServer(s.id)} className="btn-danger" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>Eliminar</button>
                </div>
              ))}
              <div className="server-add-form">
                <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.5rem' }}>
                  <button type="button" onClick={() => setServerName('SeekStreaming')} className="preset-chip">SeekStreaming</button>
                  <button type="button" onClick={() => setServerName('Player4ME')} className="preset-chip">Player4ME</button>
                </div>
                <input type="text" value={serverName} onChange={e => setServerName(e.target.value)} placeholder="Nombre del servidor (ej: Streamtape)" className="input" />
                <input type="text" value={serverUrl} onChange={e => setServerUrl(e.target.value)} placeholder="URL del embed" className="input" style={{ marginTop: '0.5rem' }} />
                <button onClick={addServer} disabled={!serverName.trim() || !serverUrl.trim()} className="btn-primary" style={{ marginTop: '0.5rem', width: '100%' }}>Añadir servidor</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0; }
        .admin-error { color: var(--accent); }
        .admin-success { color: var(--success, #22c55e); font-size: 0.875rem; margin-bottom: 1rem; }
        .episode-form { margin-bottom: 1.5rem; padding: 1.25rem; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .settings-field { display: flex; flex-direction: column; gap: 0.375rem; }
        .settings-field label { font-size: 0.8125rem; color: var(--text-muted); }
        .settings-field-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .settings-field-row label { font-size: 0.875rem; color: var(--text-secondary); }
        .admin-table { width: 100%; border-collapse: collapse; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
        .admin-table th, .admin-table td { text-align: left; padding: 0.625rem 0.875rem; font-size: 0.875rem; border-bottom: 1px solid var(--border); }
        .admin-table th { font-family: var(--font-display); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); background: var(--bg-elevated); }
        .admin-table td { color: var(--text-secondary); }
        .season-header-row td { font-family: var(--font-display); font-size: 0.8125rem; font-weight: 700; color: var(--text-primary); background: var(--bg-overlay); padding: 0.5rem 0.875rem; letter-spacing: 0.02em; }
        .season-header-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .season-header-actions { text-align: right; white-space: nowrap; }
        .btn-season { background: none; border: none; cursor: pointer; font-size: 0.875rem; padding: 0.125rem 0.25rem; opacity: 0.5; transition: opacity var(--transition-fast); line-height: 1; }
        .btn-season:hover { opacity: 1; }
        .btn-season--danger:hover { filter: brightness(1.5); }
        .btn-primary, .btn-secondary, .btn-danger { font-family: var(--font-display); font-size: 0.8125rem; font-weight: 600; padding: 0.5rem 1rem; border-radius: var(--radius-lg); border: none; cursor: pointer; transition: all var(--transition-fast); }
        .btn-primary { background: var(--accent); color: #000; }
        .btn-secondary { background: var(--bg-overlay); color: var(--text-primary); }
        .btn-danger { background: var(--accent); color: #000; opacity: 0.8; }
        .input { background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-primary); padding: 0.5rem 0.75rem; border-radius: var(--radius-lg); font-size: 0.875rem; width: 100%; box-sizing: border-box; }
        .server-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1000; display: flex; align-items: center; justify-content: center; }
        .server-modal { background: var(--bg-surface); border-radius: var(--radius-xl); width: min(480px, 90vw); max-height: 80vh; overflow: hidden; display: flex; flex-direction: column; }
        .server-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); }
        .server-modal-header h3 { font-family: var(--font-display); font-weight: 700; font-size: 1rem; color: var(--text-primary); margin: 0; }
        .server-modal-close { background: none; border: none; color: var(--text-muted); font-size: 1.5rem; cursor: pointer; padding: 0; line-height: 1; }
        .server-modal-close:hover { color: var(--text-primary); }
        .server-modal-body { padding: 1rem 1.25rem; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; }
        .server-item { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.625rem; background: var(--bg-elevated); border-radius: var(--radius-md); }
        .server-item-info { display: flex; flex-direction: column; gap: 0.125rem; flex: 1; min-width: 0; }
        .server-add-form { display: flex; flex-direction: column; padding-top: 0.5rem; border-top: 1px solid var(--border); }
        .preset-chip { font-family: var(--font-display); font-size: 0.6875rem; font-weight: 600; padding: 0.25rem 0.625rem; border-radius: var(--radius-lg); border: 1px solid var(--border); background: var(--bg-elevated); color: var(--text-secondary); cursor: pointer; transition: all var(--transition-fast); }
        .preset-chip:hover { background: var(--accent); color: #000; border-color: var(--accent); }
      `}</style>
    </div>
  )
}
