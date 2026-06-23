'use client'

import { useState, useEffect, useRef } from 'react'
import { CommunityMemberInfo, JoinRequest } from '@/types'
import { communitiesApi, uploadsApi, animeApi } from '@/lib/api'

interface Props {
  slug: string
  accessToken: string
  communityName: string
  communityDescription?: string
  onCommunityUpdated: () => void
  onDelete?: () => void
}

export function OwnerPanel({
  slug, accessToken, communityName, communityDescription,
  onCommunityUpdated, onDelete,
}: Props) {
  const [tab, setTab] = useState<'settings' | 'moderators' | 'bans' | 'requests'>('settings')

  return (
    <div className="op-panel">
      <h3 className="op-title">Panel de Administración</h3>
      <div className="op-tabs">
        <button onClick={() => setTab('settings')} className={`op-tab ${tab === 'settings' ? 'op-tab--active' : ''}`}>Ajustes</button>
        <button onClick={() => setTab('moderators')} className={`op-tab ${tab === 'moderators' ? 'op-tab--active' : ''}`}>Moderadores</button>
        <button onClick={() => setTab('bans')} className={`op-tab ${tab === 'bans' ? 'op-tab--active' : ''}`}>Baneos</button>
        <button onClick={() => setTab('requests')} className={`op-tab ${tab === 'requests' ? 'op-tab--active' : ''}`}>Solicitudes</button>
      </div>

      {tab === 'settings' && <SettingsTab slug={slug} accessToken={accessToken} communityName={communityName} communityDescription={communityDescription} onUpdated={onCommunityUpdated} onDelete={onDelete} />}
      {tab === 'moderators' && <ModeratorsTab slug={slug} accessToken={accessToken} />}
      {tab === 'bans' && <BansTab slug={slug} accessToken={accessToken} />}
      {tab === 'requests' && <RequestsTab slug={slug} accessToken={accessToken} />}

      <style>{`
        .op-panel { padding: 1rem 1.5rem; }
        .op-title { font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin: 0 0 0.75rem; color: var(--text-primary); }
        .op-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); margin-bottom: 1rem; }
        .op-tab { padding: 0.5rem 0.75rem; font-family: var(--font-display); font-size: 0.75rem; font-weight: 600; color: var(--text-muted); background: transparent; border: none; border-bottom: 2px solid transparent; cursor: pointer; transition: all var(--transition-fast); }
        .op-tab:hover { color: var(--text-secondary); }
        .op-tab--active { color: var(--text-primary); border-bottom-color: var(--accent); }
      `}</style>
    </div>
  )
}

/* ─── Settings Tab ─────────────────────────────────────── */

function SettingsTab({ slug, accessToken, communityName, communityDescription, onUpdated, onDelete }: {
  slug: string; accessToken: string; communityName: string; communityDescription?: string; onUpdated: () => void; onDelete?: () => void
}) {
  const [name, setName] = useState(communityName)
  const [description, setDescription] = useState(communityDescription ?? '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [delConfirm, setDelConfirm] = useState(false)

  // Anime banner search
  const [animeSearch, setAnimeSearch] = useState('')
  const [animeResults, setAnimeResults] = useState<{ slug: string; title: string; cover_url: string; banner_url?: string }[]>([])
  const [animeSearching, setAnimeSearching] = useState(false)
  const [selectedAnime, setSelectedAnime] = useState<{ slug: string; title: string; banner_url?: string; cover_url: string } | null>(null)
  const [showAnimeResults, setShowAnimeResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Debounced anime search
  useEffect(() => {
    if (!animeSearch.trim()) { setAnimeResults([]); return }
    setAnimeSearching(true)
    const timer = setTimeout(async () => {
      try {
        const res: any = await animeApi.getCatalog({ search: animeSearch.trim(), limit: 8 })
        const list = Array.isArray(res) ? res : res?.data ?? []
        setAnimeResults(list.map((a: any) => ({
          slug: a.slug,
          title: a.title_es ?? a.title_jp ?? a.slug,
          cover_url: a.cover_url ?? '',
          banner_url: a.banner_url,
        })))
      } catch { setAnimeResults([]) }
      setAnimeSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [animeSearch])

  // Avatar upload
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarError, setAvatarError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError('')
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setAvatarError('Solo imágenes'); return }
    if (file.size > 5 * 1024 * 1024) { setAvatarError('Máximo 5 MB'); return }
    setAvatarFile(file)
  }

  // Close search results on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowAnimeResults(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelectAnime = (a: { slug: string; title: string; banner_url?: string; cover_url: string }) => {
    setSelectedAnime(a)
    setAnimeSearch(a.title)
    setShowAnimeResults(false)
  }

  const showMsg = (type: 'ok' | 'error', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 4000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let avatarUrl = ''
      if (avatarFile) {
        const formData = new FormData()
        formData.append('file', avatarFile)
        const uploadResult = await uploadsApi.upload(formData)
        avatarUrl = typeof uploadResult === 'string' ? uploadResult : (uploadResult?.url ?? '')
      }
      const body: Record<string, unknown> = {}
      if (name !== communityName) body.name = name
      if (description !== (communityDescription ?? '')) body.description = description
      if (avatarUrl) body.avatarUrl = avatarUrl
      if (selectedAnime) {
        body.bannerUrl = selectedAnime.banner_url || selectedAnime.cover_url
      }
      if (Object.keys(body).length > 0) {
        await communitiesApi.updateCommunity(slug, body, accessToken)
        showMsg('ok', 'Cambios guardados')
        if (avatarFile) { setAvatarFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }
        if (selectedAnime) setSelectedAnime(null)
        onUpdated()
      }
    } catch (e: any) {
      showMsg('error', e?.message || 'Error al guardar')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar la comunidad permanentemente? Esta acción no se puede deshacer.')) return
    try {
      await communitiesApi.deleteCommunity(slug, accessToken)
      onDelete?.()
    } catch (e: any) {
      showMsg('error', e?.message || 'Error al eliminar')
    }
  }

  const handleTransfer = async () => {
    const targetId = prompt('ID del usuario a transferir la propiedad:')
    if (!targetId) return
    try {
      await communitiesApi.transferOwnership(slug, targetId, accessToken)
      showMsg('ok', 'Propiedad transferida')
    } catch (e: any) {
      showMsg('error', e?.message || 'Error al transferir')
    }
  }

  return (
    <div className="op-section">
      {msg && <div className={`op-msg op-msg--${msg.type}`}>{msg.text}</div>}

      <label className="op-field">
        <span className="op-label">Nombre (cada 30 días)</span>
        <input value={name} onChange={e => setName(e.target.value)} className="op-input" maxLength={100} />
      </label>

      <label className="op-field">
        <span className="op-label">Descripción</span>
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="op-textarea" rows={3} maxLength={500} />
      </label>

      {/* Avatar upload */}
      <div className="op-field">
        <span className="op-label">Avatar / Logo</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="op-input" style={{ flex: 1 }} />
          {avatarFile && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{avatarFile.name}</span>}
        </div>
        {avatarError && <span className="op-error">{avatarError}</span>}
      </div>

      {/* Anime banner search */}
      <div className="op-field" ref={searchRef}>
        <span className="op-label">
          Banner desde anime
          {selectedAnime && <span className="op-pending"> ({selectedAnime.title})</span>}
        </span>
        <div className="op-search-wrap">
          <input
            value={animeSearch}
            onChange={e => { setAnimeSearch(e.target.value); setShowAnimeResults(true); setSelectedAnime(null) }}
            onFocus={() => animeSearch.trim() && setShowAnimeResults(true)}
            placeholder="Buscar anime para usar su banner..."
            className="op-input"
          />
          {animeSearching && <span className="op-search-spinner" />}
        </div>
        {showAnimeResults && animeResults.length > 0 && (
          <div className="op-search-results">
            {animeResults.map(a => (
              <button
                key={a.slug}
                onMouseDown={() => handleSelectAnime(a)}
                className="op-search-result"
              >
                <img src={a.cover_url} alt="" className="op-search-result-img" />
                <span>{a.title}</span>
              </button>
            ))}
          </div>
        )}
        {selectedAnime && selectedAnime.banner_url && (
          <div className="op-banner-preview">
            <img src={selectedAnime.banner_url} alt="" />
          </div>
        )}
      </div>

      <div className="op-actions">
        <button onClick={handleSave} disabled={saving} className="op-btn op-btn-primary">{saving ? 'Guardando...' : 'Guardar cambios'}</button>
      </div>

      <div className="op-divider" />

      <div className="op-danger">
        <button onClick={handleTransfer} className="op-btn op-btn-warn">Transferir propiedad</button>
        {delConfirm ? (
          <div className="op-del-confirm">
            <span className="op-del-text">¿Estás seguro?</span>
            <button onClick={handleDelete} className="op-btn op-btn-danger">Sí, eliminar</button>
            <button onClick={() => setDelConfirm(false)} className="op-btn op-btn-cancel">Cancelar</button>
          </div>
        ) : (
          <button onClick={() => setDelConfirm(true)} className="op-btn op-btn-danger">Eliminar comunidad</button>
        )}
      </div>

      <style>{`
        .op-section { display: flex; flex-direction: column; gap: 0.875rem; }
        .op-msg { padding: 0.5rem 0.75rem; border-radius: var(--radius-md); font-size: 0.8125rem; font-weight: 600; }
        .op-msg--ok { background: rgba(34,197,94,0.1); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); }
        .op-msg--error { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
        .op-field { display: flex; flex-direction: column; gap: 0.375rem; position: relative; }
        .op-field--row { flex-direction: row; align-items: center; gap: 0.5rem; }
        .op-label { font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); }
        .op-input, .op-textarea { padding: 0.5rem 0.75rem; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-primary); font-family: var(--font-body); font-size: 0.8125rem; outline: none; }
        .op-input:focus, .op-textarea:focus { border-color: var(--border-focus); }
        .op-textarea { resize: vertical; }
        .op-checkbox { width: 18px; height: 18px; accent-color: var(--accent); }
        .op-file { font-size: 0.75rem; color: var(--text-muted); }
        .op-pending { color: #f59e0b; font-size: 0.625rem; }
        .op-field-error { font-size: 0.7rem; color: var(--accent); }
        .op-actions { display: flex; gap: 0.5rem; }
        .op-btn { font-family: var(--font-display); font-size: 0.8125rem; font-weight: 600; border: none; border-radius: var(--radius-md); cursor: pointer; padding: 0.5rem 1rem; transition: all var(--transition-fast); }
        .op-btn-primary { background: var(--accent); color: #fff; }
        .op-btn-primary:hover:not(:disabled) { background: var(--accent-dim); }
        .op-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .op-btn-warn { background: transparent; color: #f59e0b; border: 1px solid #f59e0b; }
        .op-btn-warn:hover { background: rgba(245,158,11,0.1); }
        .op-btn-danger { background: transparent; color: var(--accent); border: 1px solid var(--accent); }
        .op-btn-danger:hover { background: rgba(230,57,70,0.1); }
        .op-btn-cancel { background: var(--bg-overlay); color: var(--text-muted); }
        .op-btn-cancel:hover { color: var(--text-primary); }
        .op-divider { height: 1px; background: var(--border); margin: 0.5rem 0; }
        .op-danger { display: flex; flex-direction: column; gap: 0.5rem; }
        .op-del-confirm { display: flex; align-items: center; gap: 0.5rem; }
        .op-del-text { font-size: 0.8125rem; color: var(--text-muted); }

        .op-search-wrap { position: relative; }
        .op-search-spinner {
          position: absolute; right: 0.625rem; top: 50%; transform: translateY(-50%);
          width: 14px; height: 14px; border: 2px solid var(--border); border-top-color: var(--accent);
          border-radius: 50%; animation: op-spin 0.5s linear infinite;
        }
        @keyframes op-spin { to { transform: translateY(-50%) rotate(360deg); } }
        .op-search-results {
          position: absolute; top: 100%; left: 0; right: 0; z-index: 20;
          background: var(--bg-elevated); border: 1px solid var(--border);
          border-radius: var(--radius-md); max-height: 240px; overflow-y: auto;
          box-shadow: var(--shadow-lg); margin-top: 0.25rem;
        }
        .op-search-result {
          display: flex; align-items: center; gap: 0.5rem; width: 100%;
          padding: 0.5rem 0.75rem; background: transparent; border: none;
          color: var(--text-primary); font-family: var(--font-body);
          font-size: 0.8125rem; cursor: pointer; text-align: left;
          transition: background var(--transition-fast);
        }
        .op-search-result:hover { background: var(--bg-hover); }
        .op-search-result-img { width: 28px; height: 40px; object-fit: cover; border-radius: var(--radius-sm); flex-shrink: 0; }
        .op-banner-preview { margin-top: 0.25rem; border-radius: var(--radius-md); overflow: hidden; max-height: 120px; }
        .op-banner-preview img { width: 100%; height: 100%; object-fit: cover; }
      `}</style>
    </div>
  )
}

/* ─── Moderators Tab ──────────────────────────────────────── */

function ModeratorsTab({ slug, accessToken }: { slug: string; accessToken: string }) {
  const [members, setMembers] = useState<CommunityMemberInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  const showMsg = (type: 'ok' | 'error', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 4000)
  }

  useEffect(() => {
    communitiesApi.getCommunityMembers(slug, accessToken)
      .then(setMembers as any)
      .catch(() => setMembers([]))
      .finally(() => setLoading(false))
  }, [slug, accessToken])

  const handlePromote = async (userId: string, username: string) => {
    if (!confirm(`¿Ascender a ${username} como moderador?`)) return
    try {
      await communitiesApi.promoteModerator(slug, userId, accessToken)
      showMsg('ok', `${username} ahora es moderador`)
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, community_role: 'moderador' as any } : m))
    } catch (e: any) { showMsg('error', e?.message || 'Error') }
  }

  const handleDemote = async (userId: string, username: string) => {
    if (!confirm(`¿Degradar a ${username} a miembro?`)) return
    try {
      await communitiesApi.demoteModerator(slug, userId, accessToken)
      showMsg('ok', `${username} ahora es miembro`)
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, community_role: 'miembro' as any } : m))
    } catch (e: any) { showMsg('error', e?.message || 'Error') }
  }

  if (loading) return <div className="skeleton" style={{ height: 200 }} />

  const moderators = members.filter(m => m.community_role === 'moderador')
  const regulars = members.filter(m => m.community_role === 'miembro')

  return (
    <div className="op-section">
      {msg && <div className={`op-msg op-msg--${msg.type}`}>{msg.text}</div>}

      {moderators.length > 0 && (
        <>
          <h4 className="op-subtitle">Moderadores ({moderators.length})</h4>
          <div className="op-mlist">
            {moderators.map(m => (
              <div key={m.id} className="op-mrow">
                <span>{m.username}</span>
                <button onClick={() => handleDemote(m.id, m.username)} className="op-btn op-btn-sm op-btn-warn">Degradar</button>
              </div>
            ))}
          </div>
        </>
      )}

      <h4 className="op-subtitle">Miembros ({regulars.length})</h4>
      <div className="op-mlist">
        {regulars.map(m => (
          <div key={m.id} className="op-mrow">
            <span>{m.username}</span>
            <button onClick={() => handlePromote(m.id, m.username)} className="op-btn op-btn-sm op-btn-ok">Ascender</button>
          </div>
        ))}
        {regulars.length === 0 && <p className="op-empty">No hay miembros</p>}
      </div>

      <style>{`
        .op-subtitle { font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary); margin: 0.5rem 0 0.375rem; }
        .op-mlist { display: flex; flex-direction: column; gap: 0.25rem; }
        .op-mrow { display: flex; align-items: center; justify-content: space-between; padding: 0.375rem 0.5rem; background: var(--bg-surface); border-radius: var(--radius-sm); font-size: 0.8125rem; color: var(--text-primary); }
        .op-btn-sm { padding: 0.25rem 0.5rem; font-size: 0.6875rem; }
        .op-btn-ok { background: transparent; color: #22c55e; border: 1px solid #22c55e; }
        .op-btn-ok:hover { background: rgba(34,197,94,0.1); }
        .op-empty { font-size: 0.75rem; color: var(--text-muted); }
      `}</style>
    </div>
  )
}

/* ─── Bans Tab ────────────────────────────────────────────── */

function BansTab({ slug, accessToken }: { slug: string; accessToken: string }) {
  const [members, setMembers] = useState<CommunityMemberInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [banUserId, setBanUserId] = useState<string | null>(null)
  const [banDuration, setBanDuration] = useState<number | undefined>(undefined)
  const [banReason, setBanReason] = useState('')

  const showMsg = (type: 'ok' | 'error', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 4000)
  }

  useEffect(() => {
    communitiesApi.getCommunityMembers(slug, accessToken)
      .then(setMembers as any)
      .catch(() => setMembers([]))
      .finally(() => setLoading(false))
  }, [slug, accessToken])

  const handleBan = async (userId: string) => {
    try {
      await communitiesApi.banMember(slug, userId, banReason || undefined, banDuration, accessToken)
      showMsg('ok', 'Usuario baneado')
      setMembers(prev => prev.filter(m => m.id !== userId))
      setBanUserId(null)
      setBanReason('')
    } catch (e: any) { showMsg('error', e?.message || 'Error') }
  }

  const handleUnban = async (userId: string) => {
    try {
      await communitiesApi.unbanMember(slug, userId, accessToken)
      showMsg('ok', 'Usuario desbaneado')
    } catch (e: any) { showMsg('error', e?.message || 'Error') }
  }

  if (loading) return <div className="skeleton" style={{ height: 200 }} />

  const nonOwnerMembers = members.filter(m => m.community_role !== 'creador')

  return (
    <div className="op-section">
      {msg && <div className={`op-msg op-msg--${msg.type}`}>{msg.text}</div>}

      <div className="op-mlist">
        {nonOwnerMembers.map(m => (
          <div key={m.id} className="op-mrow">
            <span>{m.username}</span>
            {banUserId === m.id ? (
              <div className="op-ban-form">
                <input value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Razón" className="op-input op-input-sm" />
                <select value={banDuration ?? ''} onChange={e => setBanDuration(e.target.value ? Number(e.target.value) : undefined)} className="op-select-sm">
                  <option value="">Permanente</option>
                  <option value={1440}>24 horas</option>
                  <option value={10080}>7 días</option>
                  <option value={43200}>30 días</option>
                </select>
                <button onClick={() => handleBan(m.id)} className="op-btn op-btn-sm op-btn-danger">Banear</button>
                <button onClick={() => { setBanUserId(null); setBanReason('') }} className="op-btn op-btn-sm op-btn-cancel">✕</button>
              </div>
            ) : (
              <button onClick={() => setBanUserId(m.id)} className="op-btn op-btn-sm op-btn-danger">Banear</button>
            )}
          </div>
        ))}
        {nonOwnerMembers.length === 0 && <p className="op-empty">No hay miembros</p>}
      </div>

      <style>{`
        .op-ban-form { display: flex; gap: 0.25rem; align-items: center; flex-wrap: wrap; }
        .op-input-sm { width: 100px; padding: 0.2rem 0.375rem; font-size: 0.6875rem; }
        .op-select-sm { padding: 0.2rem 0.375rem; font-size: 0.6875rem; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg-surface); color: var(--text-primary); }
      `}</style>
    </div>
  )
}

/* ─── Requests Tab ─────────────────────────────────────────── */

function RequestsTab({ slug, accessToken }: { slug: string; accessToken: string }) {
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  const showMsg = (type: 'ok' | 'error', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 4000)
  }

  const fetchRequests = () => {
    setLoading(true)
    communitiesApi.getJoinRequests(slug, accessToken)
      .then(setRequests as any)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false))
  }

  useEffect(fetchRequests, [slug, accessToken])

  const handleApprove = async (reqId: string, username: string) => {
    try {
      await communitiesApi.approveJoinRequest(slug, reqId, accessToken)
      showMsg('ok', `${username} aceptado`)
      setRequests(prev => prev.filter(r => r.id !== reqId))
    } catch (e: any) { showMsg('error', e?.message || 'Error') }
  }

  const handleReject = async (reqId: string, username: string) => {
    try {
      await communitiesApi.rejectJoinRequest(slug, reqId, accessToken)
      showMsg('ok', `${username} rechazado`)
      setRequests(prev => prev.filter(r => r.id !== reqId))
    } catch (e: any) { showMsg('error', e?.message || 'Error') }
  }

  if (loading) return <div className="skeleton" style={{ height: 200 }} />

  return (
    <div className="op-section">
      {msg && <div className={`op-msg op-msg--${msg.type}`}>{msg.text}</div>}

      {requests.length === 0 ? (
        <p className="op-empty">No hay solicitudes pendientes</p>
      ) : (
        <div className="op-mlist">
          {requests.map(r => (
            <div key={r.id} className="op-mrow">
              <div className="op-req-user">
                {r.user.avatar_url ? (
                  <img src={r.user.avatar_url} alt="" className="op-req-avatar" />
                ) : (
                  <div className="op-req-avatar-fallback">{r.user.username[0]}</div>
                )}
                <span>{r.user.username}</span>
              </div>
              <div className="op-req-actions">
                <button onClick={() => handleApprove(r.id, r.user.username)} className="op-btn op-btn-sm op-btn-ok">Aceptar</button>
                <button onClick={() => handleReject(r.id, r.user.username)} className="op-btn op-btn-sm op-btn-danger">Rechazar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .op-req-user { display: flex; align-items: center; gap: 0.5rem; }
        .op-req-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
        .op-req-avatar-fallback { width: 28px; height: 28px; border-radius: 50%; background: var(--accent); color: #fff; font-size: 0.6875rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
        .op-req-actions { display: flex; gap: 0.25rem; }
      `}</style>
    </div>
  )
}
