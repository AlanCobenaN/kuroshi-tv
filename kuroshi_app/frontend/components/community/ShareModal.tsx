'use client'

import { useState, useEffect, useRef } from 'react'
import { Post, CommunityWithMembership } from '@/types'
import { postsApi, communitiesApi, usersApi } from '@/lib/api'
import { RichText } from './RichText'

export interface ShareableData {
  type: 'post' | 'anime' | 'episodio'
  id: string
  title: string
  subtitle?: string
  description: string
  imageUrl?: string
  avatarUrl?: string
  url: string
  post?: Post
}

interface ShareModalProps {
  data: ShareableData
  accessToken: string
  isLoggedIn: boolean
  onClose: () => void
  onShared?: (newPost: Post) => void
}

export function ShareModal({ data, accessToken, isLoggedIn, onClose, onShared }: ShareModalProps) {
  const [content, setContent] = useState('')
  const [shareTarget, setShareTarget] = useState<'profile' | 'community'>('profile')
  const [myCommunities, setMyCommunities] = useState<CommunityWithMembership[]>([])
  const [selectedCommunity, setSelectedCommunity] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!accessToken) return
    communitiesApi.getMyCommunities(accessToken).then((data: any) => {
      setMyCommunities(Array.isArray(data) ? data : [])
    }).catch(() => {})
  }, [accessToken])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(data.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleShare = async () => {
    if (!accessToken || isSharing) return
    setIsSharing(true)
    try {
      if (data.type === 'post' && data.post) {
        const body: { content?: string; communitySlug?: string } = {}
        if (content.trim()) body.content = content.trim()
        if (shareTarget === 'community' && selectedCommunity) {
          body.communitySlug = selectedCommunity
        }
        const newPost = await postsApi.sharePost(data.post.id, body, accessToken) as Post
        if (onShared) onShared(newPost)
      } else {
        const shareContent = [content.trim(), data.url].filter(Boolean).join('\n\n')
        if (shareTarget === 'community' && selectedCommunity) {
          await communitiesApi.createPost(selectedCommunity, { content: shareContent }, accessToken)
        } else {
          await usersApi.createPost({ content: shareContent }, accessToken)
        }
      }
      onClose()
    } catch (e) {
      console.error('Error al compartir:', e)
    } finally {
      setIsSharing(false)
    }
  }

  const typeLabel = data.type === 'anime' ? 'anime' : data.type === 'episodio' ? 'episodio' : 'publicación'

  return (
    <div className="share-overlay">
      <div ref={modalRef} className="share-modal" role="dialog" aria-modal="true" aria-label={`Compartir ${typeLabel}`}>
        <div className="share-header">
          <h2 className="share-title">Compartir {typeLabel}</h2>
          <button onClick={onClose} className="share-close" aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="share-body">
          <div className="share-preview">
            {data.type === 'post' ? (
              <>
                <div className="share-preview-header">
                  <div className="share-preview-avatar">
                    {data.avatarUrl ? (
                      <img src={data.avatarUrl} alt="" className="share-preview-avatar-img" />
                    ) : (
                      <div className="share-preview-avatar-fallback">{data.title[0]}</div>
                    )}
                  </div>
                  <div className="share-preview-meta">
                    <span className="share-preview-name">{data.title}</span>
                    {data.subtitle && <span className="share-preview-community">{data.subtitle}</span>}
                  </div>
                </div>
                <div className="share-preview-content">
                  <RichText content={data.description.slice(0, 300)} />
                </div>
                {data.imageUrl && <img src={data.imageUrl} alt="" className="share-preview-image" />}
              </>
            ) : (
              <div className="share-anime-preview">
                {data.imageUrl && (
                  <div className="share-anime-preview-img-wrap">
                    <img src={data.imageUrl} alt="" className="share-anime-preview-img" />
                  </div>
                )}
                <div className="share-anime-preview-body">
                  <div className="share-anime-preview-title">{data.title}</div>
                  {data.subtitle && <div className="share-anime-preview-subtitle">{data.subtitle}</div>}
                  {data.description && <div className="share-anime-preview-desc">{data.description.slice(0, 200)}</div>}
                </div>
              </div>
            )}
          </div>

          <div className="share-input-wrap">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Escribe algo (opcional)..."
              className="share-textarea"
              rows={3}
              maxLength={1000}
            />
          </div>

          {isLoggedIn && (
            <div className="share-targets">
              <div className="share-target-label">Compartir en:</div>
              <div className="share-target-options">
                <button
                  onClick={() => setShareTarget('profile')}
                  className={`share-target-btn ${shareTarget === 'profile' ? 'share-target-btn--active' : ''}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Mi perfil
                </button>
                {myCommunities.length > 0 && (
                  <button
                    onClick={() => setShareTarget('community')}
                    className={`share-target-btn ${shareTarget === 'community' ? 'share-target-btn--active' : ''}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Una comunidad
                  </button>
                )}
              </div>
              {shareTarget === 'community' && (
                <select
                  value={selectedCommunity}
                  onChange={e => setSelectedCommunity(e.target.value)}
                  className="share-community-select"
                >
                  <option value="">Selecciona una comunidad...</option>
                  {myCommunities.map(c => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="share-copy-section">
            <div className="share-copy-label">O copia el enlace:</div>
            <div className="share-copy-row">
              <input
                type="text"
                value={data.url}
                readOnly
                className="share-copy-input"
                onClick={e => (e.target as HTMLInputElement).select()}
              />
              <button onClick={handleCopyLink} className={`share-copy-btn ${copied ? 'share-copy-btn--copied' : ''}`}>
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    Copiado
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Copiar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="share-footer">
          <button onClick={onClose} className="share-cancel-btn">Cancelar</button>
          {isLoggedIn && (
            <button
              onClick={handleShare}
              disabled={isSharing || (shareTarget === 'community' && !selectedCommunity)}
              className="share-submit-btn"
            >
              {isSharing ? 'Compartiendo...' : 'Compartir'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .share-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 300; padding: 1rem;
        }
        .share-modal {
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: var(--radius-xl); width: 100%; max-width: 540px;
          max-height: 90dvh; overflow-y: auto; box-shadow: var(--shadow-lg);
          display: flex; flex-direction: column;
        }
        .share-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1.25rem; border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .share-title { font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin: 0; color: var(--text-primary); }
        .share-close { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 0.25rem; border-radius: 50%; display: flex; }
        .share-close:hover { color: var(--text-primary); }
        .share-body { padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 1rem; flex: 1; overflow-y: auto; }

        .share-preview {
          background: var(--bg-overlay); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 0.75rem;
          max-height: 240px; overflow: hidden; position: relative;
        }
        .share-preview::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 40px; background: linear-gradient(transparent, var(--bg-overlay));
        }
        .share-preview-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
        .share-preview-avatar { flex-shrink: 0; }
        .share-preview-avatar-img { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; }
        .share-preview-avatar-fallback {
          width: 24px; height: 24px; border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), var(--accent-dim));
          color: #fff; font-family: var(--font-display); font-size: 0.625rem;
          font-weight: 700; display: flex; align-items: center; justify-content: center;
        }
        .share-preview-meta { display: flex; align-items: center; gap: 0.375rem; min-width: 0; }
        .share-preview-name { font-size: 0.75rem; font-weight: 600; color: var(--text-primary); }
        .share-preview-community { font-size: 0.625rem; color: var(--accent); background: var(--bg-elevated); padding: 0.05rem 0.375rem; border-radius: var(--radius-full); }
        .share-preview-content { font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.5; }
        .share-preview-content .rich-image { max-height: 60px; }
        .share-preview-image { max-height: 80px; width: auto; border-radius: var(--radius-sm); margin-top: 0.375rem; }

        .share-anime-preview { display: flex; gap: 0.75rem; }
        .share-anime-preview-img-wrap { flex-shrink: 0; }
        .share-anime-preview-img { width: 80px; height: 112px; object-fit: cover; border-radius: var(--radius-md); }
        .share-anime-preview-body { min-width: 0; display: flex; flex-direction: column; gap: 0.25rem; }
        .share-anime-preview-title { font-family: var(--font-display); font-size: 0.875rem; font-weight: 700; color: var(--text-primary); }
        .share-anime-preview-subtitle { font-size: 0.75rem; color: var(--text-muted); }
        .share-anime-preview-desc { font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; }

        .share-input-wrap { }
        .share-textarea {
          width: 100%; padding: 0.75rem; background: var(--bg-overlay);
          border: 1px solid var(--border); border-radius: var(--radius-md);
          color: var(--text-primary); font-family: var(--font-body);
          font-size: 0.875rem; line-height: 1.5; resize: none; outline: none;
        }
        .share-textarea:focus { border-color: var(--border-focus); }
        .share-textarea::placeholder { color: var(--text-muted); }

        .share-targets { display: flex; flex-direction: column; gap: 0.5rem; }
        .share-target-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        .share-target-options { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .share-target-btn {
          display: flex; align-items: center; gap: 0.375rem;
          padding: 0.5rem 0.875rem; background: var(--bg-overlay);
          border: 1px solid var(--border); border-radius: var(--radius-md);
          color: var(--text-secondary); font-family: var(--font-display);
          font-size: 0.8125rem; font-weight: 600; cursor: pointer;
          transition: all var(--transition-fast);
        }
        .share-target-btn:hover { border-color: var(--border-hover); color: var(--text-primary); }
        .share-target-btn--active { background: var(--accent-glow); border-color: var(--accent); color: var(--accent); }
        .share-community-select {
          width: 100%; padding: 0.5rem 0.75rem; background: var(--bg-overlay);
          border: 1px solid var(--border); border-radius: var(--radius-md);
          color: var(--text-primary); font-family: var(--font-body);
          font-size: 0.8125rem; outline: none; cursor: pointer;
        }
        .share-community-select:focus { border-color: var(--border-focus); }

        .share-copy-section { display: flex; flex-direction: column; gap: 0.375rem; }
        .share-copy-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        .share-copy-row { display: flex; gap: 0.5rem; }
        .share-copy-input {
          flex: 1; padding: 0.5rem 0.75rem; background: var(--bg-overlay);
          border: 1px solid var(--border); border-radius: var(--radius-md);
          color: var(--text-muted); font-family: var(--font-body);
          font-size: 0.75rem; outline: none; cursor: text;
        }
        .share-copy-btn {
          display: flex; align-items: center; gap: 0.375rem;
          padding: 0.5rem 0.875rem; background: var(--bg-overlay);
          border: 1px solid var(--border); border-radius: var(--radius-md);
          color: var(--text-secondary); font-family: var(--font-display);
          font-size: 0.75rem; font-weight: 600; cursor: pointer; white-space: nowrap;
          transition: all var(--transition-fast);
        }
        .share-copy-btn:hover { border-color: var(--border-hover); color: var(--text-primary); }
        .share-copy-btn--copied { background: rgba(34,197,94,0.1); border-color: #22c55e; color: #22c55e; }

        .share-footer {
          display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem;
          padding: 0.75rem 1.25rem; border-top: 1px solid var(--border);
          flex-shrink: 0;
        }
        .share-cancel-btn {
          padding: 0.5rem 1rem; background: transparent; color: var(--text-muted);
          font-family: var(--font-display); font-size: 0.8125rem; font-weight: 600;
          border: 1px solid var(--border); border-radius: var(--radius-md);
          cursor: pointer; transition: all var(--transition-fast);
        }
        .share-cancel-btn:hover { color: var(--text-primary); border-color: var(--border-hover); }
        .share-submit-btn {
          padding: 0.5rem 1.5rem; background: var(--accent); color: #fff;
          font-family: var(--font-display); font-size: 0.8125rem; font-weight: 700;
          border: none; border-radius: var(--radius-md); cursor: pointer;
          transition: background var(--transition-fast);
        }
        .share-submit-btn:hover:not(:disabled) { background: var(--accent-dim); }
        .share-submit-btn:disabled { background: var(--bg-overlay); color: var(--text-muted); cursor: not-allowed; }
      `}</style>
    </div>
  )
}
