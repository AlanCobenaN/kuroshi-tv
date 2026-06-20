'use client'
// app/u/[username]/tabs/PostsTab.tsx
import { useEffect, useState, useRef, useCallback } from 'react'
import { usersApi } from '@/lib/api'
import { Post } from '@/types'
import { PostCard } from '@/components/community/PostCard'

interface Props {
  username: string
  isOwnProfile: boolean
  accessToken?: string
  isLoggedIn: boolean
}

function ProfilePostComposer({ accessToken, onPost }: { accessToken: string; onPost: (post: Post) => void }) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const autoResize = () => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${Math.min(el.scrollHeight, 240)}px`
    }
  }

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      const res: any = await usersApi.createPost({ content: content.trim() }, accessToken)
      onPost(res as Post)
      setContent('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch {}
    finally { setIsSubmitting(false) }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="pp-composer">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => { setContent(e.target.value); autoResize() }}
        onKeyDown={handleKeyDown}
        placeholder="¿Qué estás pensando?"
        className="pp-composer-input"
        rows={2}
        maxLength={2000}
      />
      <div className="pp-composer-footer">
        <span className="pp-composer-count">{content.length}/2000</span>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="pp-composer-submit"
        >
          {isSubmitting ? 'Publicando…' : 'Publicar'}
        </button>
      </div>
    </div>
  )
}

export function PostsTab({ username, isOwnProfile, accessToken, isLoggedIn }: Props) {
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const fetchPosts = useCallback(async (pageNum: number, append: boolean) => {
    if (append) setIsFetching(true)
    else setIsLoading(true)
    try {
      const data: any = await usersApi.getUserPosts(username, { page: pageNum, limit: 20 }, accessToken)
      const items: Post[] = data.data ?? []
      const meta = data.meta
      if (append) {
        setPosts(prev => [...prev, ...items])
      } else {
        setPosts(items)
      }
      setHasMore(meta ? meta.page < meta.total_pages : items.length === 20)
    } catch {
      if (!append) setPosts([])
    }
    finally {
      setIsLoading(false)
      setIsFetching(false)
    }
  }, [username, accessToken])

  useEffect(() => {
    fetchPosts(1, false)
  }, [fetchPosts])

  useEffect(() => {
    if (!sentinelRef.current || isFetching || !hasMore) return
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) { setPage(p => p + 1); fetchPosts(page + 1, true) } },
      { threshold: 0.1 }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [fetchPosts, page, isFetching, hasMore])

  const handleNewPost = (post: Post) => {
    setPosts(prev => [post, ...prev])
  }

  const handleEdit = async (postId: string, newContent: string) => {
    if (!accessToken) return
    try {
      const res: any = await usersApi.updateUserPost(postId, { content: newContent }, accessToken)
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: res.content ?? newContent, edited_at: res.edited_at } : p))
    } catch {}
  }

  const handleDelete = async (postId: string) => {
    if (!accessToken) return
    if (!confirm('¿Eliminar esta publicación?')) return
    try {
      await usersApi.deleteUserPost(postId, accessToken)
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch {}
  }

  if (isLoading) {
    return (
      <div className="pp-skeleton-list">
        {[1, 2, 3].map(i => <div key={i} className="skeleton pp-sk-card" />)}
        <style>{`
          .pp-skeleton-list { display: flex; flex-direction: column; gap: 1rem; }
          .pp-sk-card { height: 160px; border-radius: var(--radius-lg); }
        `}</style>
      </div>
    )
  }

  return (
    <div className="pp-container">
      {isOwnProfile && accessToken && (
        <ProfilePostComposer accessToken={accessToken} onPost={handleNewPost} />
      )}

      {posts.length === 0 ? (
        <div className="pp-empty">
          {isOwnProfile
            ? <p>No has publicado nada aún. ¡Escribe tu primer post!</p>
            : <p>Este usuario no ha publicado nada en su perfil.</p>}
        </div>
      ) : (
        <div className="pp-feed">
          {posts.map((post, i) => (
            <div key={post.id}>
              <PostCard
                post={post}
                index={i}
                isLoggedIn={isLoggedIn}
                onEdit={isOwnProfile ? () => { setEditingPostId(post.id); setEditContent(post.content) } : undefined}
                onDelete={isOwnProfile ? () => handleDelete(post.id) : undefined}
              />
              {editingPostId === post.id && (
                <div className="pp-edit-box">
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="pp-edit-input"
                    rows={4}
                    maxLength={2000}
                  />
                  <div className="pp-edit-actions">
                    <span className="pp-composer-count">{editContent.length}/2000</span>
                    <div className="pp-edit-btns">
                      <button onClick={() => setEditingPostId(null)} className="pp-edit-cancel">Cancelar</button>
                      <button
                        onClick={async () => {
                          if (!editContent.trim() || isSubmittingEdit) return
                          setIsSubmittingEdit(true)
                          await handleEdit(post.id, editContent.trim())
                          setIsSubmittingEdit(false)
                          setEditingPostId(null)
                        }}
                        disabled={!editContent.trim() || isSubmittingEdit}
                        className="pp-edit-save"
                      >
                        {isSubmittingEdit ? 'Guardando…' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {isFetching && (
            <div className="pp-loading"><div className="pp-spinner" /></div>
          )}
          <div ref={sentinelRef} className="pp-sentinel" />
          {!hasMore && posts.length > 0 && <p className="pp-end">No hay más publicaciones</p>}
        </div>
      )}

      <style>{`
        .pp-container { display: flex; flex-direction: column; gap: 1.5rem; }

        /* Composer */
        .pp-composer {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .pp-composer-input {
          width: 100%; padding: 0.875rem 1rem; background: transparent; border: none;
          outline: none; color: var(--text-primary); font-family: var(--font-body);
          font-size: 0.9375rem; line-height: 1.6; resize: none;
        }
        .pp-composer-input::placeholder { color: var(--text-muted); }
        .pp-composer-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.625rem 1rem; border-top: 1px solid var(--border);
        }
        .pp-composer-count { font-size: 0.75rem; color: var(--text-muted); }
        .pp-composer-submit {
          padding: 0.5rem 1.25rem; background: var(--accent); color: #fff;
          font-family: var(--font-display); font-size: 0.8125rem; font-weight: 700;
          border: none; border-radius: var(--radius-md); cursor: pointer;
          transition: background var(--transition-fast);
        }
        .pp-composer-submit:hover:not(:disabled) { background: var(--accent-dim); }
        .pp-composer-submit:disabled { background: var(--bg-overlay); color: var(--text-muted); cursor: not-allowed; }

        /* Feed */
        .pp-feed { display: flex; flex-direction: column; gap: 1rem; }
        .pp-empty { display: flex; align-items: center; justify-content: center; padding: 3rem; color: var(--text-muted); }
        .pp-loading { display: flex; justify-content: center; padding: 1rem; }
        .pp-spinner { width: 24px; height: 24px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: pp-spin 0.8s linear infinite; }
        @keyframes pp-spin { to { transform: rotate(360deg); } }
        .pp-sentinel { height: 1px; }
        .pp-end { text-align: center; font-size: 0.8125rem; color: var(--text-muted); padding: 1rem; margin: 0; }
        .pp-edit-box { margin: 0.5rem 0 1rem; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
        .pp-edit-input { width: 100%; padding: 0.75rem 1rem; background: transparent; border: none; outline: none; color: var(--text-primary); font-family: var(--font-body); font-size: 0.9375rem; line-height: 1.6; resize: none; }
        .pp-edit-actions { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 1rem; border-top: 1px solid var(--border); }
        .pp-edit-btns { display: flex; gap: 0.5rem; }
        .pp-edit-cancel { padding: 0.375rem 0.875rem; background: transparent; color: var(--text-muted); font-family: var(--font-display); font-size: 0.8125rem; font-weight: 600; border: 1px solid var(--border); border-radius: var(--radius-md); cursor: pointer; }
        .pp-edit-cancel:hover { color: var(--text-secondary); border-color: var(--border-hover); }
        .pp-edit-save { padding: 0.375rem 1rem; background: var(--accent); color: #fff; font-family: var(--font-display); font-size: 0.8125rem; font-weight: 700; border: none; border-radius: var(--radius-md); cursor: pointer; transition: background var(--transition-fast); }
        .pp-edit-save:hover:not(:disabled) { background: var(--accent-dim); }
        .pp-edit-save:disabled { background: var(--bg-overlay); color: var(--text-muted); cursor: not-allowed; }
      `}</style>
    </div>
  )
}
