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

  const wrapText = useCallback((prefix: string, suffix: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.substring(start, end)
    const wrapped = prefix + selected + suffix
    setContent(content.substring(0, start) + wrapped + content.substring(end))
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
    }, 0)
  }, [content])

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
      <div className="pp-composer-toolbar">
        <button onClick={() => wrapText('**', '**')} className="pp-tb-btn" title="Negrita" aria-label="Negrita">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" /></svg>
        </button>
        <button onClick={() => wrapText('*', '*')} className="pp-tb-btn" title="Cursiva" aria-label="Cursiva">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" /></svg>
        </button>
        <button onClick={() => wrapText('***', '***')} className="pp-tb-btn" title="Negrita + Cursiva" aria-label="Negrita y cursiva">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" /></svg>
        </button>
        <button onClick={() => wrapText('~~', '~~')} className="pp-tb-btn" title="Tachado" aria-label="Tachado">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 12h12M3 6l2.5 3M21 6l-2.5 3M12 18V6" /></svg>
        </button>
        <button onClick={() => wrapText('__', '__')} className="pp-tb-btn" title="Subrayado" aria-label="Subrayado">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3M4 21h16" /></svg>
        </button>
        <span className="pp-tb-sep" />
        <button onClick={() => wrapText('<small>', '</small>')} className="pp-tb-btn" title="Pequeño" aria-label="Texto pequeño">T<sub>s</sub></button>
        <button onClick={() => wrapText('<large>', '</large>')} className="pp-tb-btn" title="Grande" aria-label="Texto grande">T<sup>l</sup></button>
        <button onClick={() => wrapText('<xlarge>', '</xlarge>')} className="pp-tb-btn" title="Extra grande" aria-label="Texto extra grande">T<sup>xl</sup></button>
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => { setContent(e.target.value); autoResize() }}
        onKeyDown={handleKeyDown}
        placeholder="¿Qué estás pensando?"
        className="pp-composer-input"
        rows={4}
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
        .pp-composer-toolbar {
          display: flex; align-items: center; gap: 0.25rem;
          padding: 0.5rem 1rem; border-bottom: 1px solid var(--border); flex-wrap: wrap;
        }
        .pp-tb-btn {
          display: flex; align-items: center; justify-content: center; width: 28px; height: 28px;
          background: transparent; border: none; border-radius: var(--radius-md);
          color: var(--text-muted); cursor: pointer; font-family: var(--font-display);
          font-size: 0.7rem; transition: all var(--transition-fast);
        }
        .pp-tb-btn:hover { background: var(--bg-overlay); color: var(--text-secondary); }
        .pp-tb-sep { width: 1px; height: 18px; background: var(--border); margin: 0 0.25rem; }
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
