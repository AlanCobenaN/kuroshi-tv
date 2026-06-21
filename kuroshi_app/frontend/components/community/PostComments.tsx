'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { communitiesApi, adminApi, usersApi } from '@/lib/api'
import { PostComment } from '@/types'

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

interface Props {
  slug?: string
  postId: string
  isLoggedIn?: boolean
  accessToken?: string
  onClose: () => void
  isProfilePost?: boolean
}

const REPLY_PAGE_SIZE = 5
const MAX_CHARS = 500

export function PostComments({ slug, postId, isLoggedIn = false, accessToken, onClose, isProfilePost = false }: Props) {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role
  const isAdmin = userRole === 'owner' || userRole === 'moderador'

  const [flatComments, setFlatComments] = useState<PostComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [visibleReplies, setVisibleReplies] = useState<Record<string, number>>({})
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleAdminDeleteComment = async (commentId: string) => {
    if (!accessToken) return
    if (!confirm('¿Eliminar este comentario permanentemente?')) return
    try {
      await adminApi.deleteContent('comment', commentId, accessToken)
      setFlatComments(prev => prev.filter(c => c.id !== commentId))
    } catch (e) {
      console.error('Error al eliminar comentario:', e)
    }
  }

  const comments = buildTree(flatComments)

  function showMoreReplies(rootId: string) {
    setVisibleReplies(prev => ({ ...prev, [rootId]: (prev[rootId] || REPLY_PAGE_SIZE) + REPLY_PAGE_SIZE }))
  }

  useEffect(() => {
    setIsLoading(true);
    (isProfilePost
      ? usersApi.getUserPostComments(postId, accessToken!)
      : communitiesApi.getPostComments(slug!, postId, accessToken))
      .then((data: any) => setFlatComments(data as PostComment[]))
      .catch(() => setFlatComments([]))
      .finally(() => setIsLoading(false))
  }, [isProfilePost, slug, postId, accessToken])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleSubmit = async () => {
    if (!accessToken || !newComment.trim()) return
    setSubmitting(true)
    try {
      const body: any = { content: newComment.trim() }
      if (replyTo) body.parentId = replyTo.id
      const created = isProfilePost
        ? await usersApi.createUserPostComment(postId, body.content, accessToken!) as PostComment
        : await communitiesApi.createPostComment(slug!, postId, body, accessToken) as PostComment
      setFlatComments(prev => [...prev, created])
      setNewComment('')
      setReplyTo(null)
    } catch (e) {
      console.error('Error al crear comentario:', e)
    }
    finally { setSubmitting(false) }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function buildTree(flat: PostComment[]): PostComment[] {
    const map = new Map<string, PostComment & { replies: PostComment[]; _parentUsername?: string }>()
    const roots: (PostComment & { replies: PostComment[] })[] = []

    for (const c of flat) {
      map.set(c.id, { ...c, replies: [] })
    }

    for (const c of flat) {
      const node = map.get(c.id)!
      if (c.parent_id) {
        const parent = map.get(c.parent_id)
        if (parent) {
          node._parentUsername = parent.user.username
          if (!parent.parent_id) {
            parent.replies.push(node)
          } else {
            let root = parent
            while (root.parent_id && map.has(root.parent_id)) {
              root = map.get(root.parent_id)!
            }
            root.replies.push(node)
          }
        } else {
          roots.push(node)
        }
      } else {
        roots.push(node)
      }
    }

    return roots
  }

  function countComments(): number {
    function walk(list: PostComment[]): number {
      let total = 0
      for (const c of list) {
        total += 1
        if (c.replies) total += walk(c.replies)
      }
      return total
    }
    return walk(comments)
  }

  return (
    <div className="comments-overlay" ref={panelRef}>
      <div className="comments-panel">
        <div className="comments-header">
          <h3 className="comments-title">Comentarios ({countComments()})</h3>
          <button onClick={onClose} className="comments-close" aria-label="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Create comment */}
        {isLoggedIn && (
          <div className="comments-form">
            {replyTo && (
            <div className="comments-reply-banner">
              <div className="comments-reply-banner-content">
                <span className="comments-reply-banner-label">Respondiendo a</span>
                <span className="comments-reply-banner-user">{replyTo.username}</span>
              </div>
              <button onClick={() => setReplyTo(null)} className="comments-reply-banner-close" aria-label="Cancelar respuesta">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          )}
          <div className="comments-input-wrap">
              <textarea
                ref={inputRef}
                className={`comments-input ${replyTo ? 'comments-input--reply' : ''}`}
                placeholder={replyTo ? `Escribe una respuesta...` : 'Escribe un comentario...'}
                value={newComment}
                onChange={e => setNewComment(e.target.value.slice(0, MAX_CHARS))}
                onPaste={e => {
                  const pasted = e.clipboardData.getData('text')
                  const remaining = MAX_CHARS - newComment.length
                  if (pasted.length > remaining) {
                    e.preventDefault()
                    const selStart = (e.target as HTMLTextAreaElement).selectionStart
                    const selEnd = (e.target as HTMLTextAreaElement).selectionEnd
                    const before = newComment.slice(0, selStart)
                    const after = newComment.slice(selEnd)
                    const truncated = pasted.slice(0, MAX_CHARS - before.length - after.length)
                    setNewComment(before + truncated + after)
                  }
                }}
                onKeyDown={handleKeyDown}
                rows={2}
                maxLength={MAX_CHARS}
              />
              {replyTo && (
                <button onClick={() => setReplyTo(null)} className="comments-reply-cancel" aria-label="Cancelar respuesta">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={!newComment.trim() || submitting}
                className="comments-submit"
                aria-label="Enviar comentario"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Comments list */}
        <div className="comments-list">
          {isLoading ? (
            <div className="comments-loading">
              {[1, 2].map(i => <div key={i} className="comment-skeleton animate-pulse" />)}
            </div>
          ) : comments.length === 0 ? (
            <p className="comments-empty">No hay comentarios aún. Sé el primero en comentar.</p>
          ) : (
            comments.map(comment => (
              <CommentRow
                key={comment.id}
                comment={comment}
                slug={slug}
                postId={postId}
                isLoggedIn={isLoggedIn}
                accessToken={accessToken}
                isAdmin={isAdmin}
                visibleCount={visibleReplies[comment.id]}
                onShowMore={showMoreReplies}
                onReply={(id, username) => {
                  setReplyTo({ id, username })
                  inputRef.current?.focus()
                }}
                onAdminDelete={handleAdminDeleteComment}
              />
            ))
          )}
        </div>
      </div>

      <style>{`
        .comments-overlay {
          border-top: 1px solid var(--border);
          background: var(--bg);
        }
        .comments-panel {
          padding: 1rem 1.25rem;
        }
        .comments-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }
        .comments-title {
          font-family: var(--font-display);
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .comments-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: background 0.15s;
        }
        .comments-close:hover { background: var(--bg-overlay); color: var(--text-secondary); }

        .comments-form {
          margin-bottom: 1rem;
        }
        .comments-reply-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          margin-bottom: 0.5rem;
          background: var(--bg-overlay);
          border-left: 2px solid var(--accent);
          border-radius: 0 var(--radius-md) var(--radius-md) 0;
        }
        .comments-reply-banner-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.1rem; }
        .comments-reply-banner-label { font-size: 0.625rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }
        .comments-reply-banner-user { font-family: var(--font-display); font-size: 0.8125rem; font-weight: 700; color: var(--accent); }
        .comments-reply-banner-close { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0.25rem; flex-shrink: 0; }
        .comments-reply-banner-close:hover { color: var(--text-primary); }

        .comments-input-wrap {
          display: flex;
          gap: 0.5rem;
          align-items: flex-end;
        }
        .comments-reply-cancel {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.25rem;
          flex-shrink: 0;
          margin-bottom: 0.125rem;
        }
        .comments-reply-cancel:hover { color: var(--text-primary); }
        .comments-input {
          flex: 1;
          padding: 0.625rem 0.875rem;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-family: inherit;
          font-size: 0.875rem;
          resize: none;
          outline: none;
          transition: border-color 0.15s;
        }
        .comments-input:focus { border-color: var(--accent); }
        .comments-input--reply { padding-left: 0.25rem; }
        .comments-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          background: var(--accent);
          border: none;
          border-radius: 50%;
          color: #fff;
          cursor: pointer;
          transition: opacity 0.15s;
          flex-shrink: 0;
        }
        .comments-submit:disabled { opacity: 0.4; cursor: default; }
        .comments-submit:hover:not(:disabled) { opacity: 0.85; }

        .comments-list { display: flex; flex-direction: column; gap: 0.75rem; max-height: 360px; overflow-y: auto; }

        .comments-loading { display: flex; flex-direction: column; gap: 0.75rem; }
        .comment-skeleton { height: 56px; background: var(--bg-surface); border-radius: var(--radius-md); border: 1px solid var(--border); }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }

        .comments-empty { text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.875rem; }

        .comment-row { display: flex; gap: 0.625rem; }
        .comment-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .comment-avatar-fallback {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: var(--accent);
          color: #fff;
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .comment-body { flex: 1; min-width: 0; }
        .comment-bubble {
          background: var(--bg-overlay);
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-lg);
        }
        .comment-username {
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-primary);
          text-decoration: none;
        }
        .comment-username:hover { text-decoration: underline; }
        .comment-text {
          margin: 0.125rem 0 0;
          font-size: 0.875rem;
          color: var(--text-primary);
          line-height: 1.45;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .comment-actions {
          display: flex;
          gap: 1rem;
          margin-top: 0.25rem;
          padding-left: 0.75rem;
        }
        .comment-action {
          background: none;
          border: none;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.125rem 0;
        }
        .comment-action:hover { color: var(--text-secondary); }
        .comment-action--danger { color: var(--accent); }
        .comment-action--danger:hover { color: var(--accent-dim); opacity: 0.8; }

        .comment-replies {
          margin-top: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .comment-show-more {
          background: none; border: none;
          font-size: 0.8125rem; font-weight: 600;
          color: var(--accent); cursor: pointer;
          padding: 0.25rem 0;
          text-align: left;
        }
        .comment-show-more:hover { opacity: 0.8; }
        .comment-reply-arrow {
          color: var(--text-muted);
          font-weight: 400;
        }
        .comment-reply-to {
          color: var(--text-muted);
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}

function CommentRow({
  comment,
  slug,
  postId,
  isLoggedIn,
  accessToken,
  isAdmin,
  onReply,
  onAdminDelete,
  parentUsername: _parentUsernameProp,
  visibleCount,
  onShowMore,
}: {
  comment: PostComment & { _parentUsername?: string }
  slug?: string
  postId: string
  isLoggedIn?: boolean
  accessToken?: string
  isAdmin?: boolean
  onReply: (id: string, username: string) => void
  onAdminDelete?: (commentId: string) => void
  parentUsername?: string
  visibleCount?: number
  onShowMore?: (rootId: string) => void
}) {
  const [imgError, setImgError] = useState(false)
  const parentUsername = _parentUsernameProp ?? comment._parentUsername
  const isRoot = !comment.parent_id
  const replies = comment.replies || []
  const limit = isRoot ? (visibleCount ?? REPLY_PAGE_SIZE) : Infinity
  const shown = replies.slice(0, limit)
  const remaining = replies.length - shown.length

  return (
    <div className="comment-row">
      <Link href={`/u/${comment.user.username}`}>
        {comment.user.avatar_url && !imgError ? (
          <Image src={comment.user.avatar_url} alt="" width={32} height={32} className="comment-avatar" onError={() => setImgError(true)} />
        ) : (
          <div className="comment-avatar-fallback">{comment.user.username[0].toUpperCase()}</div>
        )}
      </Link>
      <div className="comment-body">
        <div className="comment-bubble">
          {parentUsername ? (
            <span className="comment-username">
              <Link href={`/u/${comment.user.username}`}>{comment.user.username}</Link>
              <span className="comment-reply-arrow"> &gt; </span>
              <span className="comment-reply-to">{parentUsername}</span>
            </span>
          ) : (
            <Link href={`/u/${comment.user.username}`} className="comment-username">{comment.user.username}</Link>
          )}
          <p className="comment-text">{comment.content}</p>
        </div>
        <div className="comment-actions">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{timeAgo(comment.created_at)}</span>
          {isLoggedIn && (
            <button className="comment-action" onClick={() => onReply(comment.id, comment.user.username)}>
              Responder
            </button>
          )}
          {isAdmin && (
            <button className="comment-action comment-action--danger" onClick={() => onAdminDelete?.(comment.id)}>
              Eliminar
            </button>
          )}
        </div>

        {shown.length > 0 && (
          <div className="comment-replies">
            {shown.map(reply => (
              <CommentRow
                key={reply.id}
                comment={reply}
                slug={slug}
                postId={postId}
                isLoggedIn={isLoggedIn}
                accessToken={accessToken}
                isAdmin={isAdmin}
                onReply={onReply}
                onAdminDelete={onAdminDelete}
              />
            ))}
            {remaining > 0 && (
              <button className="comment-show-more" onClick={() => onShowMore?.(comment.id)}>
                Ver más ({remaining} restantes)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
