'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCommunityChat } from '@/hooks/useCommunityChat'
import { CommunityMessage } from '@/types'

interface Props {
  communityId: string
  communitySlug: string
  accessToken?: string
  username?: string
  userRole?: string | null
}

export function CommunityChatPanel({ communityId, communitySlug, accessToken, username, userRole }: Props) {
  const [inputValue, setInputValue]   = useState('')
  const [replyTo, setReplyTo]         = useState<CommunityMessage | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesRef    = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLInputElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isNearBottom = useRef(true)
  const hasScrolled = useRef(false)

  const { messages, typingUsers, isLoading, isSending, sendMessage, deleteMessage, sendTyping } = useCommunityChat({
    communityId,
    communitySlug,
    accessToken,
    userRole,
  })

  const isStaff = userRole === 'creador' || userRole === 'moderador'

  // Only auto-scroll if user was already near the bottom (skip initial load)
  useEffect(() => {
    if (!hasScrolled.current) {
      hasScrolled.current = true
      return
    }
    if (isNearBottom.current && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages])

  // Track scroll position
  const handleScroll = useCallback(() => {
    const el = messagesRef.current
    if (!el) return
    const threshold = 100
    isNearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold
  }, [])

  const handleTyping = () => {
    if (!username) return
    sendTyping(username)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {}, 2000)
  }

  const handleSend = useCallback(async () => {
    const content = inputValue.trim()
    if (!content) return
    setInputValue('')
    setReplyTo(null)
    try {
      await sendMessage(content, replyTo?.id)
    } catch {}
    inputRef.current?.focus({ preventScroll: true })
  }, [inputValue, replyTo, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleDelete = async (msgId: string) => {
    if (!confirm('¿Eliminar este mensaje?')) return
    try {
      await deleteMessage(msgId)
    } catch {}
  }

  function timeLabel(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('es-LA', { hour: '2-digit', minute: '2-digit' })
  }

  const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥']

  return (
    <div className="comm-chat">
      {/* Messages */}
      <div ref={messagesRef} className="comm-chat-messages" onScroll={handleScroll} role="log" aria-live="polite" aria-label="Chat de la comunidad">
        {isLoading ? (
          <div className="chat-loading">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="chat-sk-row">
                <div className="skeleton chat-sk-avatar" />
                <div className="chat-sk-content">
                  <div className="skeleton chat-sk-name" style={{ width: `${50 + i * 10}px` }} />
                  <div className="skeleton chat-sk-text" style={{ width: `${120 + i * 25}px` }} />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <span aria-hidden="true">💬</span>
            <p>Sé el primero en escribir en el chat.</p>
          </div>
        ) : (
          <>
            {(() => {
              const groups: { msgs: typeof messages; isOwn: boolean; user: typeof messages[0]['user'] }[] = []
              for (const msg of messages) {
                const isOwn = msg.user.username === username
                const last = groups[groups.length - 1]
                const isSameUser = last && last.user.username === msg.user.username
                const timeDiff = last
                  ? new Date(msg.created_at).getTime() - new Date(last.msgs[last.msgs.length - 1].created_at).getTime()
                  : Infinity
                if (isSameUser && timeDiff < 60000) {
                  last.msgs.push(msg)
                } else {
                  groups.push({ msgs: [msg], isOwn, user: msg.user })
                }
              }
              return groups.map(group => {
                const firstMsg = group.msgs[0]
                const isOwn = group.isOwn
                return (
                  <div key={firstMsg.id} className={`chat-msg-group ${isOwn ? 'chat-msg-group--own' : ''}`}>
                    <div className="chat-msg-avatar-col" aria-hidden="true">
                      {group.user.avatar_url ? (
                        <Image src={group.user.avatar_url} alt="" width={32} height={32} className="chat-msg-avatar" />
                      ) : (
                        <div className="chat-msg-avatar-fallback">{group.user.username[0].toUpperCase()}</div>
                      )}
                    </div>
                    <div className="chat-msg-content-col">
                      <div className="chat-msg-header">
                        <Link href={`/u/${group.user.username}`} className="chat-msg-username">
                          {group.user.username}
                        </Link>
                        <span className="chat-msg-time">{timeLabel(firstMsg.created_at)}</span>
                        {group.msgs[0].is_deleted && isStaff && (
                          <span className="chat-msg-deleted-badge">Eliminado</span>
                        )}
                      </div>
                      {group.msgs.map(msg => {
                        const hasReply = !!(msg.reply_to || msg.reply_to_id)
                        const replyUser = msg.reply_to?.user?.username ?? ''
                        const replyContent = msg.reply_to?.content ?? ''
                        return (
                        <div key={msg.id}>
                          {hasReply && (
                            <div className="chat-msg-reply">
                              <span className="chat-msg-reply-user">{replyUser}</span>
                              <span className="chat-msg-reply-text">{replyContent}</span>
                            </div>
                          )}
                          <div className="chat-bubble-wrapper">
                            <div className={`chat-bubble ${isOwn ? 'chat-bubble--own' : ''} ${msg.is_deleted ? 'chat-bubble--deleted' : ''}`}>
                              <p className="chat-bubble-text">{msg.is_deleted && isStaff ? msg.content : msg.is_deleted ? 'Mensaje eliminado' : msg.content}</p>
                            </div>
                            {!msg.is_deleted && msg.reactions && msg.reactions.length > 0 && (
                              <div className="chat-reactions" aria-label="Reacciones">
                                {msg.reactions.map(r => (
                                  <button key={r.emoji} className={`chat-reaction ${r.user_reacted ? 'chat-reaction--active' : ''}`} aria-label={`${r.emoji} ${r.count}`} aria-pressed={r.user_reacted}>
                                    {r.emoji} <span>{r.count}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                            {!msg.is_deleted && (
                              <>
                                <button onClick={() => { setReplyTo(msg); inputRef.current?.focus() }} className="chat-reply-btn" aria-label={`Responder a ${msg.user.username}`}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></svg>
                                </button>
                                {(isOwn || isStaff) && (
                                  <button onClick={() => handleDelete(msg.id)} className="chat-del-btn" aria-label="Eliminar mensaje">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                )
              })
            })()}
            <div ref={messagesEndRef} aria-hidden="true" />
          </>
        )}
      </div>

      {typingUsers.length > 0 && (
        <div className="comm-typing" aria-live="polite">
          <span className="typing-dots" aria-hidden="true">
            <span /><span /><span />
          </span>
          <span className="typing-text">
            {typingUsers.length === 1
              ? `${typingUsers[0]} está escribiendo...`
              : `${typingUsers.slice(0, 2).join(', ')} están escribiendo...`}
          </span>
        </div>
      )}

      {/* Input */}
      <div className="comm-chat-input-area">
        {replyTo && (
          <div className="reply-preview">
            <div className="reply-preview-content">
              <span className="reply-preview-user">Respondiendo a {replyTo.user.username}</span>
              <span className="reply-preview-text">{replyTo.content.slice(0, 80)}{replyTo.content.length > 80 ? '…' : ''}</span>
            </div>
            <button onClick={() => setReplyTo(null)} className="reply-preview-close" aria-label="Cancelar respuesta">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {accessToken ? (
          <div className="comm-chat-input-row">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => { setInputValue(e.target.value); handleTyping() }}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje... (Enter para enviar)"
              className="comm-chat-input"
              maxLength={500}
              disabled={isSending}
              aria-label="Escribe un mensaje en el chat"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending}
              className="comm-chat-send"
              aria-label="Enviar mensaje"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="comm-chat-login">
            <Link href="/login" className="comm-chat-login-link">Inicia sesión</Link> para chatear
          </div>
        )}
      </div>

      <style>{`
        .comm-chat {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          overflow: hidden;
        }
        .comm-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          scroll-behavior: smooth;
        }
        .comm-chat-messages::-webkit-scrollbar { width: 4px; }
        .comm-chat-messages::-webkit-scrollbar-thumb { background: var(--bg-hover); border-radius: 2px; }
        .chat-loading { display: flex; flex-direction: column; gap: 0.875rem; }
        .chat-sk-row { display: flex; gap: 0.625rem; }
        .chat-sk-avatar { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; }
        .chat-sk-content { display: flex; flex-direction: column; gap: 0.35rem; justify-content: center; }
        .chat-sk-name { height: 11px; border-radius: 3px; }
        .chat-sk-text { height: 32px; border-radius: var(--radius-md); }
        .chat-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.625rem; flex: 1; text-align: center; color: var(--text-muted); padding: 2rem; }
        .chat-empty span { font-size: 1.75rem; }
        .chat-empty p { margin: 0; font-size: 0.875rem; }

        .chat-msg-group {
          display: flex;
          gap: 0.5rem;
          padding: 0.125rem 0;
        }
        .chat-msg-group--own { flex-direction: row-reverse; }
        .chat-msg-group--own .chat-msg-content-col { align-items: flex-end; }
        .chat-msg-group--own .chat-msg-header { justify-content: flex-end; }

        .chat-msg-avatar-col { width: 32px; flex-shrink: 0; display: flex; align-items: flex-start; padding-top: 0.125rem; }
        .chat-msg-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
        .chat-msg-avatar-fallback {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: var(--accent); color: #fff;
          font-family: var(--font-display); font-size: 0.75rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }
        .chat-msg-content-col { flex: 1; min-width: 0; max-width: 85%; display: flex; flex-direction: column; gap: 0.25rem; }
        .chat-msg-header { display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 0.125rem; }
        .chat-msg-username {
          font-family: var(--font-display); font-size: 0.8125rem; font-weight: 700;
          color: var(--text-primary); text-decoration: none;
        }
        .chat-msg-username:hover { color: var(--accent); }
        .chat-msg-time { font-size: 0.6875rem; color: var(--text-muted); }
        .chat-msg-deleted-badge { font-size: 0.625rem; font-weight: 600; color: var(--text-muted); background: var(--bg-overlay); padding: 0.05rem 0.375rem; border-radius: var(--radius-sm); text-transform: uppercase; letter-spacing: 0.04em; }

        .chat-msg-reply {
          display: flex; flex-direction: column; gap: 0.05rem;
          padding: 0.25rem 0.5rem;
          border-left: 2px solid var(--accent);
          margin-bottom: 0.15rem;
        }
        .chat-msg-reply-user { font-family: var(--font-display); font-size: 0.6875rem; font-weight: 700; color: var(--accent); }
        .chat-msg-reply-text { font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .chat-bubble-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 0.375rem;
          flex-wrap: wrap;
        }
        .chat-bubble {
          max-width: 600px;
          padding: 0.5rem 0.875rem;
          background: var(--bg-elevated);
          border-radius: var(--radius-lg);
          border-bottom-left-radius: var(--radius-sm);
        }
        .chat-bubble--own {
          background: var(--accent);
          border-bottom-left-radius: var(--radius-lg);
          border-bottom-right-radius: var(--radius-sm);
        }
        .chat-bubble--deleted {
          opacity: 0.5;
          background: var(--bg-overlay);
          border: 1px dashed var(--border);
        }
        .chat-bubble-text {
          font-size: 0.875rem;
          color: var(--text-primary);
          line-height: 1.5;
          margin: 0;
          word-break: break-word;
        }
        .chat-bubble--own .chat-bubble-text { color: #fff; }

        .chat-reactions { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.25rem; }
        .chat-reaction {
          display: flex; align-items: center; gap: 0.25rem;
          padding: 0.15rem 0.5rem; background: var(--bg-overlay);
          border: 1px solid var(--border); border-radius: var(--radius-full);
          font-size: 0.75rem; cursor: pointer; transition: all var(--transition-fast);
        }
        .chat-reaction:hover { border-color: var(--border-hover); background: var(--bg-hover); }
        .chat-reaction--active { border-color: var(--accent); background: var(--accent-glow); }
        .chat-reaction span { font-family: var(--font-display); font-size: 0.6875rem; font-weight: 600; color: var(--text-secondary); }

        .chat-reply-btn, .chat-del-btn {
          opacity: 0;
          padding: 0.25rem;
          background: var(--bg-overlay);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-muted);
          cursor: pointer;
          transition: all var(--transition-fast);
          align-self: flex-start;
        }
        .chat-bubble-wrapper:hover .chat-reply-btn, .chat-bubble-wrapper:hover .chat-del-btn { opacity: 1; }
        .chat-reply-btn:hover, .chat-del-btn:hover { color: var(--text-primary); border-color: var(--border-hover); }
        .chat-del-btn:hover { color: var(--accent); border-color: var(--accent); }

        .comm-typing {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.375rem 1rem; font-size: 0.75rem; color: var(--text-muted);
          font-family: var(--font-display); border-top: 1px solid var(--border);
        }
        .typing-dots { display: flex; gap: 3px; align-items: center; }
        .typing-dots span {
          width: 4px; height: 4px; background: var(--text-muted);
          border-radius: 50%; animation: typing-bounce 1.2s ease infinite;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing-bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
        .comm-chat-input-area {
          border-top: 1px solid var(--border);
          padding: 0.75rem;
          display: flex; flex-direction: column; gap: 0.5rem;
          background: var(--bg-surface);
        }
        .reply-preview {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.35rem 0.75rem;
          border-left: 2px solid var(--accent);
        }
        .reply-preview-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.1rem; }
        .reply-preview-user { font-family: var(--font-display); font-size: 0.6875rem; font-weight: 700; color: var(--accent); }
        .reply-preview-text { font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .reply-preview-close { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0.25rem; flex-shrink: 0; transition: color var(--transition-fast); }
        .reply-preview-close:hover { color: var(--text-primary); }

        .comm-chat-input-row { display: flex; gap: 0.5rem; align-items: center; }
        .comm-chat-input {
          flex: 1; padding: 0.625rem 0.875rem;
          background: var(--bg-overlay); border: 1px solid var(--border);
          border-radius: var(--radius-full); color: var(--text-primary);
          font-family: var(--font-body); font-size: 0.875rem; outline: none; transition: border-color var(--transition-fast);
        }
        .comm-chat-input::placeholder { color: var(--text-muted); }
        .comm-chat-input:focus { border-color: var(--border-focus); }
        .comm-chat-input:disabled { opacity: 0.6; }

        .comm-chat-send {
          width: 36px; height: 36px; background: var(--accent);
          border: none; border-radius: 50%; color: #fff; cursor: pointer;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          transition: background var(--transition-fast), transform var(--transition-fast);
        }
        .comm-chat-send:hover:not(:disabled) { background: var(--accent-dim); transform: scale(1.05); }
        .comm-chat-send:disabled { background: var(--bg-hover); color: var(--text-muted); cursor: not-allowed; }

        .comm-chat-login { text-align: center; font-size: 0.875rem; color: var(--text-muted); padding: 0.25rem; }
        .comm-chat-login-link { color: var(--accent); font-weight: 600; text-decoration: none; }
        .comm-chat-login-link:hover { text-decoration: underline; }
      `}</style>
    </div>
  )
}
