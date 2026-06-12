'use client'
// components/episode/EpisodeChat.tsx
// ============================================================
// CARACTERÍSTICA DIFERENCIADORA de Kuroshi.lat
// Chat anclado al minuto exacto del video.
// "la sensación de ver un stream en compañía, incluso solo"
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useEpisodeChat } from '@/hooks/useEpisodeChat'
import { useEpisodePresence } from '@/hooks/useEpisodePresence'
import { EpisodeComment } from '@/types'

interface Props {
  animeSlug: string
  episodeNumber: number
  episodeId: string
  currentMinute: number  // actualizado por el reproductor
}

export function EpisodeChat({ animeSlug, episodeNumber, episodeId, currentMinute }: Props) {
  const { data: session } = useSession()
  const [showAll, setShowAll]       = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLTextAreaElement>(null)

  const { viewerCount } = useEpisodePresence({
    episodeId,
    userId: session?.user?.id,
  })

  const {
    visibleComments,
    allComments,
    isLoading,
    error,
    sendComment,
    likeComment,
    isSending,
  } = useEpisodeChat({
    animeSlug,
    episodeNumber,
    episodeId,
    currentMinute,
    isLoggedIn: !!session,
    accessToken: session?.accessToken,
  })

  const displayedComments = showAll ? allComments : visibleComments

  // Auto-scroll al llegar nuevos comentarios en modo live
  useEffect(() => {
    if (!showAll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [visibleComments, showAll])

  const handleSend = useCallback(async () => {
    const content = inputValue.trim()
    if (!content) return
    if (content.length > 200) {
      setInputError('Máximo 200 caracteres')
      return
    }
    setInputError('')

    try {
      await sendComment(content)
      setInputValue('')
    } catch (e: any) {
      setInputError(e?.message ?? 'Error al enviar')
    }
  }, [inputValue, sendComment])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-panel">
      {/* ── Header del chat ──────────────────────────────── */}
      <div className="chat-header">
        <div className="chat-header-left">
          <span className="chat-title">Chat del episodio</span>
          {viewerCount > 0 && (
            <span className="chat-viewers" title="Usuarios viendo ahora">
              <span className="chat-viewers-dot" aria-hidden="true" />
              {viewerCount.toLocaleString('es')} viendo
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAll(v => !v)}
          className={`chat-toggle-btn ${showAll ? 'chat-toggle-btn--active' : ''}`}
          aria-pressed={showAll}
          title={showAll ? 'Ver comentarios del minuto actual' : 'Ver todos los comentarios'}
        >
          {showAll ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              En vivo
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              Ver todo
            </>
          )}
        </button>
      </div>

      {/* ── Indicador de minuto actual ────────────────────── */}
      {!showAll && (
        <div className="chat-minute-indicator">
          <span className="chat-minute-label">
            {currentMinute > 0
              ? `Minuto ${currentMinute} — ${visibleComments.length} comentario${visibleComments.length !== 1 ? 's' : ''}`
              : 'Esperando reproducción...'}
          </span>
        </div>
      )}

      {/* ── Área de mensajes ─────────────────────────────── */}
      <div
        className="chat-messages"
        role="log"
        aria-live="polite"
        aria-label="Chat del episodio"
      >
        {isLoading ? (
          <ChatLoadingSkeleton />
        ) : error ? (
          <div className="chat-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        ) : displayedComments.length === 0 ? (
          <div className="chat-empty">
            <span aria-hidden="true">💬</span>
            <p>Sé el primero en comentar este momento</p>
          </div>
        ) : (
          <>
            {showAll && (
              <p className="chat-all-label">
                {allComments.length} comentario{allComments.length !== 1 ? 's' : ''} en total
              </p>
            )}
            {displayedComments.map(comment => (
              <ChatMessage
                key={comment.id}
                comment={comment}
                currentMinute={currentMinute}
                isShowAll={showAll}
                onLike={() => likeComment(comment.id)}
                isLoggedIn={!!session}
              />
            ))}
            <div ref={messagesEndRef} aria-hidden="true" />
          </>
        )}
      </div>

      {/* ── Input de comentario ───────────────────────────── */}
      <div className="chat-input-area">
        {session ? (
          <>
            <div className={`chat-input-wrapper ${inputError ? 'chat-input-wrapper--error' : ''}`}>
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={e => {
                  setInputValue(e.target.value)
                  if (inputError) setInputError('')
                }}
                onKeyDown={handleKeyDown}
                placeholder={`Comentar en el minuto ${currentMinute}... (Enter para enviar)`}
                className="chat-textarea"
                maxLength={200}
                rows={2}
                aria-label="Escribe un comentario"
                disabled={isSending}
              />
              <div className="chat-input-footer">
                <span className={`chat-char-count ${inputValue.length > 180 ? 'chat-char-count--warn' : ''}`}>
                  {inputValue.length}/200
                </span>
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isSending}
                  className="chat-send-btn"
                  aria-label="Enviar comentario"
                >
                  {isSending ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ animation: 'spin 0.8s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round"/>
                      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {inputError && (
              <p className="chat-input-error" role="alert">{inputError}</p>
            )}
            <p className="chat-input-hint">
              1 comentario por minuto · máx. 200 caracteres
            </p>
          </>
        ) : (
          <div className="chat-login-prompt">
            <p>
              <Link href="/login" className="chat-login-link">Inicia sesión</Link>
              {' '}para comentar en el chat
            </p>
          </div>
        )}
      </div>

      <style>{`
        .chat-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-surface);
          border-left: 1px solid var(--border);
          overflow: hidden;
        }

        /* Header */
        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1rem;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .chat-header-left {
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }
        .chat-title {
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .chat-viewers {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 600;
          color: #4ade80;
        }
        .chat-viewers-dot {
          width: 6px;
          height: 6px;
          background: #4ade80;
          border-radius: 50%;
          animation: pulse-accent 1.5s ease infinite;
        }

        /* Toggle ver todo / en vivo */
        .chat-toggle-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.3rem 0.625rem;
          background: var(--bg-overlay);
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .chat-toggle-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-hover);
        }
        .chat-toggle-btn--active {
          color: var(--accent);
          border-color: rgba(230, 57, 70, 0.3);
          background: var(--accent-glow);
        }

        /* Indicador de minuto */
        .chat-minute-indicator {
          padding: 0.5rem 1rem;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
          background: var(--bg-base);
        }
        .chat-minute-label {
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--accent);
        }

        /* Mensajes */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          scroll-behavior: smooth;
        }
        .chat-messages::-webkit-scrollbar { width: 3px; }
        .chat-messages::-webkit-scrollbar-thumb { background: var(--bg-hover); }

        .chat-error, .chat-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          flex: 1;
          text-align: center;
          padding: 2rem 1rem;
          color: var(--text-muted);
          font-size: 0.8125rem;
        }
        .chat-error { color: var(--accent); flex-direction: row; justify-content: flex-start; padding: 1rem; }
        .chat-empty span { font-size: 1.5rem; }
        .chat-empty p { margin: 0; }

        .chat-all-label {
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          text-align: center;
          padding: 0.25rem 0 0.5rem;
          margin: 0;
        }

        /* Input área */
        .chat-input-area {
          padding: 0.75rem;
          border-top: 1px solid var(--border);
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          background: var(--bg-surface);
        }

        .chat-input-wrapper {
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          background: var(--bg-overlay);
          overflow: hidden;
          transition: border-color var(--transition-fast);
        }
        .chat-input-wrapper:focus-within { border-color: var(--border-focus); }
        .chat-input-wrapper--error { border-color: var(--accent); }

        .chat-textarea {
          display: block;
          width: 100%;
          padding: 0.625rem 0.75rem;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.8125rem;
          line-height: 1.5;
          resize: none;
        }
        .chat-textarea::placeholder { color: var(--text-muted); }
        .chat-textarea:disabled { opacity: 0.6; cursor: not-allowed; }

        .chat-input-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.375rem 0.75rem;
          border-top: 1px solid var(--border);
        }

        .chat-char-count {
          font-size: 0.6875rem;
          color: var(--text-muted);
          font-family: var(--font-display);
        }
        .chat-char-count--warn { color: var(--accent); }

        .chat-send-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: var(--accent);
          border: none;
          border-radius: var(--radius-md);
          color: #fff;
          cursor: pointer;
          transition: background var(--transition-fast), transform var(--transition-fast);
        }
        .chat-send-btn:hover:not(:disabled) {
          background: var(--accent-dim);
          transform: scale(1.05);
        }
        .chat-send-btn:disabled {
          background: var(--bg-hover);
          cursor: not-allowed;
          color: var(--text-muted);
        }

        .chat-input-error {
          font-size: 0.75rem;
          color: var(--accent);
          margin: 0;
        }

        .chat-input-hint {
          font-size: 0.6875rem;
          color: var(--text-muted);
          margin: 0;
        }

        .chat-login-prompt {
          text-align: center;
          padding: 0.5rem;
        }
        .chat-login-prompt p {
          font-size: 0.8125rem;
          color: var(--text-muted);
          margin: 0;
        }
        .chat-login-link {
          color: var(--accent);
          font-weight: 600;
          text-decoration: none;
        }
        .chat-login-link:hover { text-decoration: underline; }
      `}</style>
    </div>
  )
}

/* ─── Mensaje individual ─────────────────────────────────────── */

function ChatMessage({
  comment,
  currentMinute,
  isShowAll,
  onLike,
  isLoggedIn,
}: {
  comment: EpisodeComment
  currentMinute: number
  isShowAll: boolean
  onLike: () => void
  isLoggedIn: boolean
}) {
  const isCurrentMinute = comment.video_minute === currentMinute
  const minuteDiff       = Math.abs(comment.video_minute - currentMinute)
  const isNearby         = minuteDiff <= 1
  const isPast           = comment.video_minute < currentMinute

  return (
    <div
      className={`chat-msg
        ${isCurrentMinute ? 'chat-msg--current' : ''}
        ${isPast && !isShowAll ? 'chat-msg--past' : ''}
      `}
      aria-label={`${comment.user.username} en el minuto ${comment.video_minute}: ${comment.content}`}
    >
      {/* Avatar */}
      <div className="chat-msg-avatar" aria-hidden="true">
        {comment.user.avatar_url ? (
          <Image
            src={comment.user.avatar_url}
            alt=""
            width={24}
            height={24}
            className="chat-msg-avatar-img"
          />
        ) : (
          <span className="chat-msg-avatar-fallback">
            {comment.user.username[0].toUpperCase()}
          </span>
        )}
      </div>

      {/* Contenido */}
      <div className="chat-msg-body">
        <div className="chat-msg-meta">
          <span className="chat-msg-username">{comment.user.username}</span>
          {isShowAll && (
            <span className="chat-msg-minute">min {comment.video_minute}</span>
          )}
          {comment.has_spoiler && (
            <span className="chat-msg-spoiler-badge">spoiler</span>
          )}
        </div>

        <p className={`chat-msg-content ${comment.has_spoiler ? 'chat-msg-content--spoiler' : ''}`}>
          {comment.content}
        </p>

        {/* Likes */}
        <button
          onClick={isLoggedIn ? onLike : undefined}
          className={`chat-msg-like ${!isLoggedIn ? 'chat-msg-like--readonly' : ''} ${comment.liked_by_me ? 'chat-msg-like--active' : ''}`}
          aria-label={`${comment.likes_count} likes`}
          disabled={!isLoggedIn}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill={comment.liked_by_me ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {comment.likes_count > 0 && comment.likes_count}
        </button>
      </div>

      <style>{`
        .chat-msg {
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem 0.5rem 0.5rem 0.625rem;
          border-radius: var(--radius-md);
          border-left: 2px solid transparent;
          transition: all var(--transition-fast);
          animation: fade-in-fast 0.2s ease;
        }
        .chat-msg--current {
          border-left-color: var(--accent);
          background: rgba(230, 57, 70, 0.05);
        }
        .chat-msg--past { opacity: 0.55; }

        .chat-msg-avatar { flex-shrink: 0; }
        .chat-msg-avatar-img {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
        }
        .chat-msg-avatar-fallback {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--accent);
          color: #fff;
          font-family: var(--font-display);
          font-size: 0.625rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chat-msg-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .chat-msg-meta {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          flex-wrap: wrap;
        }
        .chat-msg-username {
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .chat-msg-minute {
          font-size: 0.625rem;
          color: var(--text-muted);
          font-family: var(--font-display);
        }
        .chat-msg-spoiler-badge {
          font-size: 0.5625rem;
          font-family: var(--font-display);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--amber);
          background: rgba(244, 162, 97, 0.1);
          border: 1px solid rgba(244, 162, 97, 0.2);
          border-radius: var(--radius-full);
          padding: 0.1rem 0.35rem;
        }

        .chat-msg-content {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.5;
          word-break: break-word;
          margin: 0;
        }
        .chat-msg-content--spoiler {
          filter: blur(4px);
          cursor: pointer;
          transition: filter var(--transition-fast);
        }
        .chat-msg-content--spoiler:hover { filter: blur(0); }

        .chat-msg-like {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--text-muted);
          padding: 0;
          transition: color var(--transition-fast);
          align-self: flex-start;
        }
        .chat-msg-like:hover:not(:disabled) { color: var(--accent); }
        .chat-msg-like--active { color: var(--accent); }
        .chat-msg-like--readonly { cursor: default; }
        .chat-msg-like:disabled { cursor: default; }
      `}</style>
    </div>
  )
}

/* ─── Skeleton de carga ──────────────────────────────────────── */

function ChatLoadingSkeleton() {
  return (
    <div className="chat-skeleton">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="chat-sk-item">
          <div className="skeleton chat-sk-avatar" />
          <div className="chat-sk-content">
            <div className="skeleton chat-sk-name" />
            <div className="skeleton chat-sk-text" />
          </div>
        </div>
      ))}

      <style>{`
        .chat-skeleton { display: flex; flex-direction: column; gap: 0.625rem; padding: 0.25rem; }
        .chat-sk-item { display: flex; gap: 0.5rem; }
        .chat-sk-avatar { width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; }
        .chat-sk-content { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; }
        .chat-sk-name { height: 11px; width: 70px; border-radius: 3px; }
        .chat-sk-text { height: 13px; width: 100%; border-radius: 3px; }
      `}</style>
    </div>
  )
}
