'use client'

import { useState, useEffect } from 'react'
import { CommunityMemberInfo } from '@/types'
import { communitiesApi } from '@/lib/api'

interface Props {
  slug: string
  accessToken: string
}

export function ModeratorPanel({ slug, accessToken }: Props) {
  const [members, setMembers] = useState<CommunityMemberInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const [silenceUserId, setSilenceUserId] = useState<string | null>(null)
  const [silenceDuration, setSilenceDuration] = useState(60)

  useEffect(() => {
    communitiesApi.getCommunityMembers(slug, accessToken)
      .then(setMembers as any)
      .catch(() => setMembers([]))
      .finally(() => setLoading(false))
  }, [slug, accessToken])

  const showMsg = (type: 'ok' | 'error', text: string) => {
    setActionMsg({ type, text })
    setTimeout(() => setActionMsg(null), 4000)
  }

  const handleKick = async (userId: string, username: string) => {
    if (!confirm(`¿Expulsar a ${username}?`)) return
    try {
      await communitiesApi.kickMember(slug, userId, accessToken)
      showMsg('ok', `${username} expulsado`)
      setMembers(prev => prev.filter(m => m.id !== userId))
    } catch (e: any) {
      showMsg('error', e?.message || 'Error al expulsar')
    }
  }

  const handleSilence = async (userId: string) => {
    try {
      await communitiesApi.silenceMember(slug, userId, silenceDuration, accessToken)
      showMsg('ok', `Usuario silenciado por ${silenceDuration} min`)
      setSilenceUserId(null)
    } catch (e: any) {
      showMsg('error', e?.message || 'Error al silenciar')
    }
  }

  const nonOwnerMembers = members.filter(m => m.community_role !== 'creador')

  return (
    <div className="mp-panel">
      <h3 className="mp-title">Panel de Moderación</h3>

      {actionMsg && (
        <div className={`mp-toast mp-toast--${actionMsg.type}`}>{actionMsg.text}</div>
      )}

      {loading ? (
        <div className="skeleton" style={{ height: 200 }} />
      ) : !nonOwnerMembers.length ? (
        <p className="mp-empty">No hay miembros que moderar</p>
      ) : (
        <div className="mp-list">
          {nonOwnerMembers.map(m => (
            <div key={m.id} className="mp-row">
              <div className="mp-user">
                <div className="mp-avatar">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="mp-avatar-img" />
                  ) : (
                    <div className="mp-avatar-fallback">{m.username[0]}</div>
                  )}
                </div>
                <div className="mp-user-info">
                  <span className="mp-username">{m.username}</span>
                  <span className="mp-role">{m.community_role === 'moderador' ? 'Moderador' : 'Miembro'}</span>
                </div>
              </div>
              <div className="mp-actions">
                {silenceUserId === m.id ? (
                  <div className="mp-silence-form">
                    <select
                      value={silenceDuration}
                      onChange={e => setSilenceDuration(Number(e.target.value))}
                      className="mp-silence-select"
                    >
                      <option value={60}>1 hora</option>
                      <option value={360}>6 horas</option>
                      <option value={1440}>24 horas</option>
                      <option value={4320}>3 días</option>
                      <option value={10080}>7 días</option>
                    </select>
                    <button onClick={() => handleSilence(m.id)} className="mp-btn mp-btn-sm mp-btn-ok">OK</button>
                    <button onClick={() => setSilenceUserId(null)} className="mp-btn mp-btn-sm mp-btn-cancel">✕</button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => setSilenceUserId(m.id)} className="mp-btn mp-btn-silence">Silenciar</button>
                    <button onClick={() => handleKick(m.id, m.username)} className="mp-btn mp-btn-kick">Expulsar</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .mp-panel { padding: 1rem 1.5rem; }
        .mp-title { font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin: 0 0 1rem; color: var(--text-primary); }
        .mp-toast { padding: 0.5rem 0.75rem; border-radius: var(--radius-md); font-size: 0.8125rem; font-weight: 600; margin-bottom: 0.75rem; }
        .mp-toast--ok { background: rgba(34,197,94,0.1); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); }
        .mp-toast--error { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
        .mp-empty { font-size: 0.8125rem; color: var(--text-muted); }
        .mp-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .mp-row { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: var(--bg-surface); border-radius: var(--radius-md); gap: 0.5rem; }
        .mp-user { display: flex; align-items: center; gap: 0.625rem; min-width: 0; flex: 1; }
        .mp-avatar { flex-shrink: 0; }
        .mp-avatar-img { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; background: var(--bg-elevated); }
        .mp-avatar-fallback { width: 32px; height: 32px; border-radius: 50%; background: var(--accent); color: #fff; font-family: var(--font-display); font-size: 0.8125rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
        .mp-user-info { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
        .mp-username { font-size: 0.8125rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mp-role { font-size: 0.625rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        .mp-actions { display: flex; gap: 0.375rem; flex-shrink: 0; }
        .mp-btn { font-family: var(--font-display); font-size: 0.6875rem; font-weight: 600; border: none; border-radius: var(--radius-md); cursor: pointer; padding: 0.3rem 0.625rem; transition: all var(--transition-fast); }
        .mp-btn-silence { background: var(--bg-overlay); color: var(--text-secondary); border: 1px solid var(--border-hover); }
        .mp-btn-silence:hover { border-color: #f59e0b; color: #f59e0b; }
        .mp-btn-kick { background: var(--bg-overlay); color: var(--text-secondary); border: 1px solid var(--border-hover); }
        .mp-btn-kick:hover { border-color: var(--accent); color: var(--accent); }
        .mp-btn-sm { padding: 0.2rem 0.5rem; font-size: 0.625rem; }
        .mp-btn-ok { background: #22c55e; color: #fff; }
        .mp-btn-ok:hover { background: #16a34a; }
        .mp-btn-cancel { background: transparent; color: var(--text-muted); }
        .mp-btn-cancel:hover { color: var(--text-primary); }
        .mp-silence-form { display: flex; gap: 0.25rem; align-items: center; }
        .mp-silence-select { font-size: 0.6875rem; padding: 0.2rem 0.375rem; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg-surface); color: var(--text-primary); }
      `}</style>
    </div>
  )
}
