'use client'
// app/comunidades/[slug]/CommunityFeed.tsx
import { useState, useEffect, useRef, useTransition, useCallback, Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Community, Post } from '@/types'
import { communitiesApi, uploadsApi } from '@/lib/api'
import { RichText } from '@/components/community/RichText'
import { AdFeed } from '@/components/ads/AdFeed'

interface Props {
  community: Community
  isMember: boolean
  isLoggedIn: boolean
  accessToken?: string
}

function normalizePost(p: any): Post {
  return {
    ...p,
    user: {
      ...p.user,
      followers_count: p.user?.followersCount ?? p.user?.followers_count ?? 0,
    },
  }
}

export function CommunityFeed({ community, isMember, isLoggedIn, accessToken }: Props) {
  const [posts, setPosts]           = useState<Post[]>([])
  const [page, setPage]             = useState(1)
  const [hasMore, setHasMore]       = useState(true)
  const [isLoading, setIsLoading]   = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Cargar primera página
  useEffect(() => {
    setIsLoading(true)
    communitiesApi.getPosts(community.slug, 1, accessToken)
      .then((data: any) => {
        const items: Post[] = (Array.isArray(data) ? data : data.data ?? []).map(normalizePost)
        const meta = data.meta
        setPosts(items)
        setHasMore(meta ? meta.page < meta.total_pages : items.length === 20)
      })
      .catch(() => setPosts([]))
      .finally(() => setIsLoading(false))
  }, [community.slug, accessToken])

  // Scroll infinito con IntersectionObserver
  const loadMore = useCallback(async () => {
    if (isFetching || !hasMore) return
    setIsFetching(true)
    const nextPage = page + 1
    try {
      const data: any = await communitiesApi.getPosts(community.slug, nextPage, accessToken)
      const items: Post[] = (Array.isArray(data) ? data : data.data ?? []).map(normalizePost)
      const meta = data.meta
      setPosts(prev => [...prev, ...items])
      setPage(nextPage)
      setHasMore(meta ? nextPage < meta.total_pages : items.length === 20)
    } catch {}
    finally { setIsFetching(false) }
  }, [community.slug, accessToken, page, hasMore, isFetching])

  useEffect(() => {
    if (!sentinelRef.current) return
    observerRef.current = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { threshold: 0.1 }
    )
    observerRef.current.observe(sentinelRef.current)
    return () => observerRef.current?.disconnect()
  }, [loadMore])

  const handleNewPost = (post: Post) => {
    setPosts(prev => [post, ...prev])
  }

  const handleLike = async (postId: string) => {
    if (!accessToken) return
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1, liked_by_me: !p.liked_by_me }
        : p
    ))
    try {
      await communitiesApi.likePost(community.slug, postId, accessToken)
    } catch {
      // revertir en caso de error
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1, liked_by_me: !p.liked_by_me }
          : p
      ))
    }
  }

  return (
    <div className="feed">
      {/* Crear post — solo miembros */}
      {isMember && isLoggedIn && (
        <PostComposer
          communitySlug={community.slug}
          accessToken={accessToken!}
          onPost={handleNewPost}
        />
      )}

      {/* Vista previa para no miembros */}
      {!isMember && (
        <div className="feed-join-prompt">
          <p>Únete a la comunidad para ver el feed completo e interactuar.</p>
        </div>
      )}

      {/* Posts */}
      {isLoading ? (
        <div className="feed-skeleton">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="post-skeleton">
              <div className="skeleton post-sk-header" />
              <div className="skeleton post-sk-body" />
              <div className="skeleton post-sk-body post-sk-body--sm" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="feed-empty">
          <span aria-hidden="true">📝</span>
          <p>Sé el primero en publicar en esta comunidad.</p>
        </div>
      ) : (
        <div className="posts-list">
          {posts.map((post, i) => (
            <Fragment key={post.id}>
              <PostCard
                post={post}
                communitySlug={community.slug}
                onLike={() => handleLike(post.id)}
                isLoggedIn={isLoggedIn}
                index={i}
              />
              {(i + 1) % 6 === 0 && <AdFeed key={`ad-${i}`} />}
            </Fragment>
          ))}

          {/* Sentinel para scroll infinito */}
          <div ref={sentinelRef} className="feed-sentinel" aria-hidden="true" />
          {isFetching && (
            <div className="feed-loading-more">
              <span className="feed-spinner" aria-label="Cargando más posts..." />
            </div>
          )}
          {!hasMore && posts.length > 0 && (
            <p className="feed-end">Has visto todos los posts de esta comunidad.</p>
          )}
        </div>
      )}

      <style>{`
        .feed { display: flex; flex-direction: column; gap: 1rem; }

        .feed-join-prompt {
          padding: 1rem 1.25rem;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          font-size: 0.875rem;
          color: var(--text-muted);
          text-align: center;
        }

        .feed-skeleton { display: flex; flex-direction: column; gap: 1rem; }
        .post-skeleton { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .post-sk-header { height: 40px; border-radius: var(--radius-md); }
        .post-sk-body { height: 16px; border-radius: 4px; }
        .post-sk-body--sm { width: 65%; }

        .feed-empty { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 3rem; text-align: center; color: var(--text-muted); }
        .feed-empty span { font-size: 2rem; }
        .feed-empty p { margin: 0; }

        .posts-list { display: flex; flex-direction: column; gap: 1rem; }
        .feed-sentinel { height: 1px; }

        .feed-loading-more { display: flex; justify-content: center; padding: 1rem; }
        .feed-spinner {
          display: inline-block;
          width: 24px;
          height: 24px;
          border: 2px solid var(--border-hover);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .feed-end { text-align: center; font-size: 0.8125rem; color: var(--text-muted); padding: 1rem 0; margin: 0; }
      `}</style>
    </div>
  )
}

/* ─── Compositor de posts ──────────────────────────────────── */

function PostComposer({
  communitySlug,
  accessToken,
  onPost,
}: {
  communitySlug: string
  accessToken: string
  onPost: (post: Post) => void
}) {
  const [content, setContent]       = useState('')
  const [imageFile, setImageFile]   = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError]           = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = () => {
    if (!content.trim() && !imageFile) return
    setError('')

    startTransition(async () => {
      try {
        let imageUrl: string | undefined

        if (imageFile) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const result = reader.result as string
              resolve(result.split(',')[1])
            }
            reader.onerror = reject
            reader.readAsDataURL(imageFile)
          })
          const mimeType = imageFile.type || 'image/jpeg'
          const res = await uploadsApi.uploadImage(base64, mimeType, accessToken)
          imageUrl = res?.url
        }

        const post = await communitiesApi.createPost(
          communitySlug,
          { content: content.trim(), imageUrl },
          accessToken
        ) as Post

        onPost(post)
        setContent('')
        setImageFile(null)
        setImagePreview(null)
      } catch {
        setError('No se pudo publicar. Intenta de nuevo.')
      }
    })
  }

  return (
    <div className="composer">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="¿Qué quieres compartir con la comunidad?"
        className="composer-input"
        rows={3}
        maxLength={2000}
        disabled={isPending}
        aria-label="Escribe tu post"
      />

      {imagePreview && (
        <div className="composer-preview">
          <img src={imagePreview} alt="Vista previa" className="composer-preview-img" />
          <button
            onClick={() => { setImageFile(null); setImagePreview(null) }}
            className="composer-preview-remove"
            aria-label="Quitar imagen"
          >
            ✕
          </button>
        </div>
      )}

      {error && <p className="composer-error" role="alert">{error}</p>}

      <div className="composer-footer">
        <div className="composer-actions">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="composer-action-btn"
            aria-label="Adjuntar imagen"
            disabled={isPending}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Imagen
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="composer-file-input"
            aria-hidden="true"
          />
        </div>

        <div className="composer-right">
          <span className="composer-count">{content.length}/2000</span>
          <button
            onClick={handleSubmit}
            disabled={isPending || (!content.trim() && !imageFile)}
            className="composer-submit"
            aria-label="Publicar"
          >
            {isPending ? 'Publicando…' : 'Publicar'}
          </button>
        </div>
      </div>

      <style>{`
        .composer {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          overflow: hidden;
          transition: border-color var(--transition-fast);
        }
        .composer:focus-within { border-color: var(--border-focus); }

        .composer-input {
          display: block;
          width: 100%;
          padding: 1rem 1.25rem;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.9375rem;
          line-height: 1.6;
          resize: none;
        }
        .composer-input::placeholder { color: var(--text-muted); }
        .composer-input:disabled { opacity: 0.6; }

        .composer-preview {
          position: relative;
          margin: 0 1.25rem 0.75rem;
          border-radius: var(--radius-lg);
          overflow: hidden;
          max-height: 200px;
        }
        .composer-preview-img { width: 100%; height: 200px; object-fit: cover; display: block; }
        .composer-preview-remove {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 28px;
          height: 28px;
          background: rgba(0,0,0,0.7);
          color: #fff;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .composer-error { font-size: 0.8125rem; color: var(--accent); margin: 0 1.25rem 0.5rem; }

        .composer-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1.25rem;
          border-top: 1px solid var(--border);
        }
        .composer-actions { display: flex; gap: 0.5rem; }
        .composer-action-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .composer-action-btn:hover { color: var(--text-secondary); border-color: var(--border-hover); }
        .composer-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .composer-file-input { display: none; }

        .composer-right { display: flex; align-items: center; gap: 0.875rem; }
        .composer-count { font-family: var(--font-display); font-size: 0.75rem; color: var(--text-muted); }
        .composer-submit {
          padding: 0.45rem 1.125rem;
          background: var(--accent);
          color: #fff;
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 700;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background var(--transition-fast), transform var(--transition-fast);
        }
        .composer-submit:hover:not(:disabled) { background: var(--accent-dim); transform: translateY(-1px); }
        .composer-submit:disabled { background: var(--bg-overlay); color: var(--text-muted); cursor: not-allowed; transform: none; }
      `}</style>
    </div>
  )
}

/* ─── Tarjeta de post ─────────────────────────────────────── */

function PostCard({
  post,
  communitySlug,
  onLike,
  isLoggedIn,
  index,
}: {
  post: Post
  communitySlug: string
  onLike: () => void
  isLoggedIn: boolean
  index: number
}) {
  const [showComments, setShowComments] = useState(false)

  function timeAgo(d: string) {
    const diff = Date.now() - new Date(d).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h`
    return `${Math.floor(h / 24)}d`
  }

  return (
    <article
      className="post-card animate-fade-in"
      style={{ animationDelay: `${index * 0.05}s` }}
      aria-label={`Post de ${post.user.username}`}
    >
      {/* Header */}
      <div className="post-header">
        <div className="post-avatar-wrapper">
          {post.user.avatar_url ? (
            <Image src={post.user.avatar_url} alt="" width={36} height={36} className="post-avatar" aria-hidden="true" />
          ) : (
            <div className="post-avatar-fallback" aria-hidden="true">
              {post.user.username[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="post-meta">
          <div className="post-meta-row">
            <Link href={`/u/${post.user.username}`} className="post-username">
              {post.user.username}
            </Link>
            {post.user.community_role && (
              <span className={`post-role-badge post-role-badge--${post.user.community_role}`}>
                {post.user.community_role === 'creador' ? 'Creador' : post.user.community_role === 'moderador' ? 'Mod' : ''}
              </span>
            )}
          </div>
          <span className="post-time">{timeAgo(post.created_at)}</span>
        </div>
        {post.is_pinned && (
          <span className="post-pinned" aria-label="Post fijado">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2L8.5 8.5 2 9.27l5 4.87-1.18 6.87L12 17.77l6.18 3.24L17 14.14l5-4.87-6.5-.77z" />
            </svg>
            Fijado
          </span>
        )}
      </div>

      {/* Contenido */}
      {post.content && (
        <RichText content={post.content} className="post-content" />
      )}

      {/* Imagen */}
      {post.image_url && (
        <div className="post-image-wrapper">
          <Image
            src={post.image_url}
            alt="Imagen del post"
            width={600}
            height={400}
            className="post-image"
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Episodio vinculado */}
      {post.linked_episode && (
        <Link
          href={`/anime/${post.linked_episode.anime_slug}/episodio/${post.linked_episode.episode_number}`}
          className="post-episode-link"
          aria-label={`Ver episodio vinculado: ${post.linked_episode.anime_title}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span>
            {post.linked_episode.anime_title} — Ep {post.linked_episode.episode_number}
          </span>
        </Link>
      )}

      {/* Acciones */}
      <div className="post-actions">
        <button
          onClick={isLoggedIn ? onLike : undefined}
          disabled={!isLoggedIn}
          className={`post-action-btn ${post.liked_by_me ? 'post-action-btn--liked' : ''}`}
          aria-label={`${post.likes_count} likes${isLoggedIn ? (post.liked_by_me ? '. Quitar like' : '. Dar like') : ''}`}
          aria-pressed={post.liked_by_me}
        >
          <svg
            width="15" height="15"
            viewBox="0 0 24 24"
            fill={post.liked_by_me ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {post.likes_count > 0 && <span>{post.likes_count}</span>}
        </button>

        <button
          onClick={() => setShowComments(v => !v)}
          className="post-action-btn"
          aria-expanded={showComments}
          aria-label={`${post.comments_count} comentarios`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{post.comments_count}</span>
        </button>
      </div>

      <style>{`
        .post-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          overflow: hidden;
          transition: border-color var(--transition-fast);
        }
        .post-card:hover { border-color: var(--border-hover); }

        .post-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem 0.75rem;
        }
        .post-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
        .post-avatar-fallback {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--accent);
          color: #fff;
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .post-meta { display: flex; flex-direction: column; gap: 0.1rem; }
        .post-meta-row { display: flex; align-items: center; gap: 0.375rem; }
        .post-username { font-family: var(--font-display); font-size: 0.875rem; font-weight: 700; color: var(--text-primary); text-decoration: none; }
        .post-username:hover { color: var(--accent); }
        .post-time { font-size: 0.75rem; color: var(--text-muted); }
        .post-role-badge { font-family: var(--font-display); font-size: 0.5625rem; font-weight: 700; padding: 0.0625rem 0.375rem; border-radius: var(--radius-full); text-transform: uppercase; letter-spacing: 0.03em; }
        .post-role-badge--creador { background: rgba(250, 204, 21, 0.12); color: #eab308; border: 1px solid rgba(250, 204, 21, 0.25); }
        .post-role-badge--moderador { background: rgba(34, 197, 94, 0.12); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.25); }
        .post-pinned {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--amber);
        }

        .post-content {
          padding: 0 1.25rem 0.875rem;
          font-size: 0.9375rem;
          color: var(--text-secondary);
          line-height: 1.65;
          margin: 0;
          white-space: pre-wrap;
        }

        .post-image-wrapper { border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .post-image { width: 100%; height: auto; max-height: 480px; object-fit: cover; display: block; }

        .post-episode-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 1.25rem 0.75rem;
          padding: 0.625rem 0.875rem;
          background: var(--bg-overlay);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--accent);
          text-decoration: none;
          transition: background var(--transition-fast);
        }
        .post-episode-link:hover { background: var(--bg-hover); }

        .post-actions {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.625rem 1rem;
          border-top: 1px solid var(--border);
        }
        .post-action-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.625rem;
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .post-action-btn:hover:not(:disabled) { color: var(--text-secondary); background: var(--bg-overlay); }
        .post-action-btn--liked { color: var(--accent); }
        .post-action-btn--liked:hover { color: var(--accent-dim); }
        .post-action-btn:disabled { cursor: default; }
      `}</style>
    </article>
  )
}
