'use client'

import { useState, useEffect, useCallback, useRef, Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Community, CommunityWithMembership, Post, PostComment } from '@/types'
import { communitiesApi, uploadsApi } from '@/lib/api'
import { PostCard } from '@/components/community/PostCard'
import { PostComments } from '@/components/community/PostComments'
import { AdFeed } from '@/components/ads/AdFeed'
import { CommunityChatPanel } from '@/app/comunidades/[slug]/CommunityChatPanel'
import { ModeratorPanel } from '@/components/community/ModeratorPanel'
import { OwnerPanel } from '@/components/community/OwnerPanel'

interface Props {
  selectedSlug: string | null
  isLoggedIn: boolean
  userId?: string
  username?: string
  accessToken?: string
  myCommunities: CommunityWithMembership[]
  onRefreshMyCommunities: () => void
  onDeleteCommunity: (slug: string) => void
}

export function CenterPanel({ selectedSlug, isLoggedIn, userId, username, accessToken, myCommunities, onRefreshMyCommunities, onDeleteCommunity }: Props) {
  if (!selectedSlug) {
    return <GlobalFeedPanel isLoggedIn={isLoggedIn} accessToken={accessToken} userId={userId} />
  }

  return (
      <CommunityView
      slug={selectedSlug}
      isLoggedIn={isLoggedIn}
      userId={userId}
      username={username}
      accessToken={accessToken}
      myCommunities={myCommunities}
      onRefreshMyCommunities={onRefreshMyCommunities}
      onDeleteCommunity={onDeleteCommunity}
    />
  )
}

/* ─── Global Feed (default) ──────────────────────────────── */

function GlobalFeedPanel({ isLoggedIn, accessToken, userId }: { isLoggedIn: boolean; accessToken?: string; userId?: string }) {
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [openCommentPostId, setOpenCommentPostId] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const handleEdit = useCallback(async (postId: string, newContent: string) => {
    if (!accessToken) return
    const post = posts.find(p => p.id === postId)
    if (!post?.community?.slug) return
    try {
      const res: any = await communitiesApi.updatePost(post.community.slug, postId, { content: newContent }, accessToken)
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: res.content ?? newContent, edited_at: res.edited_at } : p))
      setEditingPost(null)
    } catch {}
  }, [accessToken, posts])

  useEffect(() => {
    setIsLoading(true)
    communitiesApi.getFeed(1, accessToken)
      .then((data: any) => {
        const items = Array.isArray(data) ? data : data.data ?? []
        const meta = data.meta
        setPosts(items)
        setHasMore(meta ? meta.page < meta.total_pages : items.length === 20)
      })
      .catch(() => setPosts([]))
      .finally(() => setIsLoading(false))
  }, [accessToken])

  const loadMore = useCallback(async () => {
    if (isFetching || !hasMore) return
    setIsFetching(true)
    const nextPage = page + 1
    try {
      const data: any = await communitiesApi.getFeed(nextPage, accessToken)
      const items = Array.isArray(data) ? data : data.data ?? []
      const meta = data.meta
      setPosts(prev => [...prev, ...items])
      setPage(nextPage)
      setHasMore(meta ? nextPage < meta.total_pages : items.length === 20)
    } catch {}
    finally { setIsFetching(false) }
  }, [accessToken, page, hasMore, isFetching])

  const handleLike = useCallback(async (postId: string, communitySlug: string) => {
    if (!accessToken) return
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1, liked_by_me: !p.liked_by_me }
        : p
    ))
    try {
      await communitiesApi.likePost(communitySlug, postId, accessToken)
    } catch {
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1, liked_by_me: !p.liked_by_me }
          : p
      ))
    }
  }, [accessToken])

  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { threshold: 0.1 }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <div className="center-panel">
      <div className="center-header">
        <div>
          <h2 className="center-header-title">Feed General</h2>
          <p className="center-header-sub">Publicaciones recientes de todas las comunidades</p>
        </div>
        {isLoggedIn && accessToken && (
          <Link href="/comunidades/crear" className="center-create-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Crear comunidad
          </Link>
        )}
      </div>
      <div className="center-feed">
        {isLoading ? (
          <div className="feed-skeleton-list">
            {[1, 2, 3].map(i => <div key={i} className="skeleton feed-sk-card" />)}
          </div>
        ) : !posts.length ? (
          <div className="center-empty">
            <p>Todavía no hay publicaciones en las comunidades.</p>
          </div>
        ) : (
          <>
            {posts.map((post, i) => (
              <Fragment key={post.id}>
                <PostCard
                  post={post}
                  index={i}
                  isLoggedIn={isLoggedIn}
                  showCommunity
                  onLike={post.community ? () => handleLike(post.id, post.community!.slug) : undefined}
                  onEdit={post.community && userId === post.user_id ? () => setEditingPost(post) : undefined}
                  isCommentsOpen={openCommentPostId === post.id}
                  onToggleComments={() => setOpenCommentPostId(openCommentPostId === post.id ? null : post.id)}
                  onShare={(newPost: Post) => setPosts(prev => [newPost, ...prev])}
                />
                {openCommentPostId === post.id && post.community && (
                  <PostComments
                    slug={post.community.slug}
                    postId={post.id}
                    isLoggedIn={isLoggedIn}
                    accessToken={accessToken}
                    onClose={() => setOpenCommentPostId(null)}
                  />
                )}
                {(i + 1) % 6 === 0 && <AdFeed key={`ad-${i}`} />}
              </Fragment>
            ))}
            {isFetching && (
              <div className="feed-loading-spinner"><div className="feed-spinner" /></div>
            )}
            <div ref={sentinelRef} className="feed-sentinel" />
            {!hasMore && <p className="feed-end-text">Has visto todas las publicaciones</p>}
          </>
        )}
      </div>

      {editingPost && (
        <div className="cpm-overlay" onClick={() => setEditingPost(null)}>
          <div className="cpm-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Editar publicación">
            <div className="cpm-header">
              <h2 className="cpm-title">Editar publicación</h2>
              <button onClick={() => setEditingPost(null)} className="cpm-close" aria-label="Cerrar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <EditPostForm post={editingPost} onSave={handleEdit} onCancel={() => setEditingPost(null)} />
          </div>
        </div>
      )}

      <style>{`
        .center-panel { display: flex; flex-direction: column; overflow-y: auto; max-height: calc(100dvh - var(--total-nav)); }
        .center-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); flex-shrink: 0; }
        .center-header-title { font-family: var(--font-display); font-size: 1.125rem; font-weight: 700; margin: 0; color: var(--text-primary); }
        .center-header-sub { font-size: 0.8125rem; color: var(--text-muted); margin: 0.25rem 0 0; }
        .center-create-btn {
          display: flex; align-items: center; gap: 0.375rem;
          padding: 0.5rem 1rem; background: var(--accent); color: #fff;
          font-family: var(--font-display); font-size: 0.8125rem; font-weight: 700;
          border: none; border-radius: var(--radius-full); cursor: pointer;
          transition: background var(--transition-fast); white-space: nowrap; flex-shrink: 0;
        }
        .center-create-btn:hover { background: var(--accent-dim); }
        .center-feed { padding: 1rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; flex: 1; }
        .feed-skeleton-list { display: flex; flex-direction: column; gap: 1rem; }
        .feed-sk-card { height: 200px; border-radius: var(--radius-lg); }
        .center-empty { display: flex; align-items: center; justify-content: center; padding: 3rem; color: var(--text-muted); }
        .feed-loading-spinner { display: flex; justify-content: center; padding: 1rem; }
        .feed-spinner { width: 24px; height: 24px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .feed-sentinel { height: 1px; }
        .feed-end-text { text-align: center; font-size: 0.8125rem; color: var(--text-muted); padding: 1rem; margin: 0; }
        .cpm-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex;
          align-items: center; justify-content: center; z-index: 200; padding: 1rem;
        }
        .cpm-modal {
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: var(--radius-xl); width: 100%; max-width: 720px;
          max-height: 90dvh; overflow-y: auto; box-shadow: var(--shadow-lg);
        }
        .cpm-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1.25rem; border-bottom: 1px solid var(--border);
        }
        .cpm-title { font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin: 0; color: var(--text-primary); }
        .cpm-close { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 0.25rem; border-radius: 50%; display: flex; }
        .cpm-close:hover { color: var(--text-primary); }
        .cpm-toolbar {
          display: flex; align-items: center; gap: 0.25rem;
          padding: 0.5rem 1.25rem; border-bottom: 1px solid var(--border); flex-wrap: wrap;
        }
        .cpm-tb-btn {
          display: flex; align-items: center; justify-content: center; width: 30px; height: 30px;
          background: transparent; border: none; border-radius: var(--radius-md);
          color: var(--text-muted); cursor: pointer; font-family: var(--font-display);
          font-size: 0.75rem; transition: all var(--transition-fast);
        }
        .cpm-tb-btn:hover { background: var(--bg-overlay); color: var(--text-secondary); }
        .cpm-tb-sep { width: 1px; height: 20px; background: var(--border); margin: 0 0.25rem; }
        .cpm-editor { padding: 0.5rem 1.25rem; }
        .cpm-textarea {
          width: 100%; padding: 0.5rem 0; background: transparent; border: none;
          outline: none; color: var(--text-primary); font-family: var(--font-body);
          font-size: 0.9375rem; line-height: 1.6; resize: none; min-height: 120px;
        }
        .cpm-textarea::placeholder { color: var(--text-muted); }
        .cpm-footer { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; border-top: 1px solid var(--border); }
        .cpm-count { font-size: 0.75rem; color: var(--text-muted); }
        .cpm-submit {
          padding: 0.5rem 1.5rem; background: var(--accent); color: #fff;
          font-family: var(--font-display); font-size: 0.875rem; font-weight: 700;
          border: none; border-radius: var(--radius-md); cursor: pointer;
          transition: background var(--transition-fast);
        }
        .cpm-submit:hover:not(:disabled) { background: var(--accent-dim); }
        .cpm-submit:disabled { background: var(--bg-overlay); color: var(--text-muted); cursor: not-allowed; }
      `}</style>
    </div>
  )
}

/* ─── Specific Community View ────────────────────────────── */

function CommunityView({ slug, isLoggedIn, userId, username, accessToken, myCommunities, onRefreshMyCommunities, onDeleteCommunity }: {
  slug: string
  isLoggedIn: boolean
  userId?: string
  username?: string
  accessToken?: string
  myCommunities: CommunityWithMembership[]
  onRefreshMyCommunities: () => void
  onDeleteCommunity: (slug: string) => void
}) {
  const [community, setCommunity] = useState<Community | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'feed' | 'chat' | 'mod' | 'owner'>('feed')
  const [loading, setLoading] = useState(true)

  const refreshCommunity = useCallback(() => {
    communitiesApi.getBySlug(slug, accessToken)
      .then((data: any) => {
        setCommunity(data as Community)
        const membership = (data as any).user_membership
        setIsMember(!!membership)
        setUserRole(membership?.role ?? null)
      })
      .catch(() => setCommunity(null))
  }, [slug, accessToken])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setActiveTab('feed')
    refreshCommunity().then(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [refreshCommunity])

  const handleJoinToggle = async () => {
    if (!accessToken || !community) return
    try {
      if (isMember) {
        await communitiesApi.leave(slug, accessToken)
        setIsMember(false)
        setUserRole(null)
        onRefreshMyCommunities()
      } else {
        await communitiesApi.join(slug, accessToken)
        setIsMember(true)
        setUserRole('miembro')
        onRefreshMyCommunities()
      }
    } catch {}
  }

  if (loading) {
    return (
      <div className="center-panel">
        <div className="center-loading"><div className="skeleton" style={{ height: '100%' }} /></div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="center-panel">
        <div className="center-empty"><p>Comunidad no encontrada</p></div>
      </div>
    )
  }

  const progressPct = Math.min(100, (community.members_count / community.members_threshold) * 100)

  return (
    <div className="center-panel">
      {/* Community Banner */}
      <div
        className={`cv-banner${community.banner_url ? ' cv-banner--has-bg' : ''}`}
        style={community.banner_url ? { '--banner-url': `url(${community.banner_url})` } as React.CSSProperties : undefined}
      >
        {!community.banner_url && <div className="cv-banner-fallback" />}
        <div className="cv-banner-grad" />
      </div>

      {/* Community Header */}
      <div className="cv-header">
        <div className="cv-avatar-wrap">
          {community.avatar_url ? (
            <Image src={community.avatar_url} alt={community.name} width={48} height={48} className="cv-avatar" />
          ) : (
            <div className="cv-avatar-fallback">{community.name[0]}</div>
          )}
        </div>
        <div className="cv-info">
          <div className="cv-name-row">
            <h2 className="cv-name">{community.name}</h2>
            {community.type === 'oficial' && <span className="cv-official-badge">Oficial</span>}
          </div>
          <p className="cv-members">{community.members_count.toLocaleString('es')} miembros</p>
        </div>
        {isLoggedIn && (
          <button
            onClick={handleJoinToggle}
            className={`cv-join-btn ${isMember ? 'cv-join-btn--leave' : 'cv-join-btn--join'}`}
          >
            {isMember ? 'Abandonar' : 'Unirse'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="cv-tabs">
        <button
          onClick={() => setActiveTab('feed')}
          className={`cv-tab ${activeTab === 'feed' ? 'cv-tab--active' : ''}`}
        >Feed</button>
        {isMember && (
          <button
            onClick={() => setActiveTab('chat')}
            className={`cv-tab ${activeTab === 'chat' ? 'cv-tab--active' : ''}`}
          >Chat</button>
        )}
        {['moderador', 'creador'].includes(userRole ?? '') && (
          <button
            onClick={() => setActiveTab('mod')}
            className={`cv-tab ${activeTab === 'mod' ? 'cv-tab--active' : ''}`}
          >Moderador</button>
        )}
        {userRole === 'creador' && (
          <button
            onClick={() => setActiveTab('owner')}
            className={`cv-tab ${activeTab === 'owner' ? 'cv-tab--active' : ''}`}
          >Owner</button>
        )}
      </div>

      {/* Tab Content */}
      <div className="cv-content">
        {activeTab === 'feed' && (
          <CommunityFeedPanel slug={slug} isMember={isMember} isLoggedIn={isLoggedIn} accessToken={accessToken} userRole={userRole} userId={userId} />
        )}
        {activeTab === 'chat' && isMember && (
          <div className="cv-chat-wrap">
            <CommunityChatPanel
              communityId={community.id}
              communitySlug={slug}
              accessToken={accessToken}
              username={username}
              userRole={userRole}
            />
          </div>
        )}
        {activeTab === 'mod' && accessToken && (
          <ModeratorPanel slug={slug} accessToken={accessToken} />
        )}
        {activeTab === 'owner' && accessToken && (
          <OwnerPanel
            slug={slug}
            accessToken={accessToken}
            communityName={community.name}
            communityDescription={community.description}
            isPrivate={community.is_private}
            onCommunityUpdated={refreshCommunity}
            onDelete={() => onDeleteCommunity(slug)}
          />
        )}
      </div>

      <style>{`
        .center-loading { flex: 1; padding: 2rem; }

        .cv-banner { position: relative; z-index: 0; height: 120px; overflow: hidden; flex-shrink: 0; }
        .cv-banner--has-bg::before {
          content: '';
          position: absolute; inset: 0;
          background-image: var(--banner-url);
          background-size: cover;
          background-position: center;
          filter: brightness(0.4);
        }
        .cv-banner-fallback { position: absolute; inset: 0; background: linear-gradient(135deg, var(--bg-elevated), var(--bg-overlay)); }
        .cv-banner-grad { position: absolute; inset: 0; background: linear-gradient(to top, var(--bg-base) 0%, transparent 100%); }

        .cv-header {
          position: relative; z-index: 1;
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.75rem 1.5rem;
          margin-top: -24px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .cv-avatar-wrap { flex-shrink: 0; }
        .cv-avatar { width: 48px; height: 48px; border-radius: var(--radius-lg); object-fit: cover; border: 2px solid var(--bg-base); background: var(--bg-elevated); }
        .cv-avatar-fallback {
          width: 48px; height: 48px;
          border-radius: var(--radius-lg);
          background: var(--accent); color: #fff;
          font-family: var(--font-display); font-size: 1.25rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid var(--bg-base);
        }
        .cv-info { flex: 1; min-width: 0; }
        .cv-name-row { display: flex; align-items: center; gap: 0.5rem; }
        .cv-name { font-family: var(--font-display); font-size: 1.125rem; font-weight: 700; margin: 0; color: var(--text-primary); }
        .cv-official-badge { font-size: 0.625rem; font-weight: 700; color: #60a5fa; background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.2); border-radius: var(--radius-full); padding: 0.1rem 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .cv-members { font-size: 0.75rem; color: var(--text-muted); margin: 0.125rem 0 0; }
        .cv-join-btn {
          padding: 0.4rem 1rem;
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 700;
          border-radius: var(--radius-md);
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        .cv-join-btn--join { background: var(--accent); color: #fff; }
        .cv-join-btn--join:hover { background: var(--accent-dim); }
        .cv-join-btn--leave { background: var(--bg-overlay); color: var(--text-secondary); border: 1px solid var(--border-hover); }
        .cv-join-btn--leave:hover { color: var(--accent); border-color: var(--accent); }

        .cv-tabs {
          display: flex;
          border-bottom: 1px solid var(--border);
          padding: 0 1.5rem;
          flex-shrink: 0;
        }
        .cv-tab {
          padding: 0.625rem 1rem;
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .cv-tab:hover { color: var(--text-secondary); }
        .cv-tab--active { color: var(--text-primary); border-bottom-color: var(--accent); }

        .cv-content { flex: 1; overflow-y: auto; }
        .cv-chat-wrap { height: calc(100dvh - var(--total-nav) - 220px); padding: 1rem 1.5rem; }
      `}</style>
    </div>
  )
}

/* ─── Community Feed Panel ───────────────────────────────── */

function CommunityFeedPanel({ slug, isMember, isLoggedIn, accessToken, userRole, userId }: {
  slug: string
  isMember: boolean
  isLoggedIn: boolean
  accessToken?: string
  userRole?: string | null
  userId?: string
}) {
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [openCommentPostId, setOpenCommentPostId] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsLoading(true)
    communitiesApi.getPosts(slug, 1, accessToken)
      .then((data: any) => {
        const items: Post[] = Array.isArray(data) ? data : data.data ?? []
        const meta = data.meta
        setPosts(items)
        setHasMore(meta ? meta.page < meta.total_pages : items.length === 20)
      })
      .catch(() => setPosts([]))
      .finally(() => setIsLoading(false))
  }, [slug, accessToken])

  const loadMore = useCallback(async () => {
    if (isFetching || !hasMore) return
    setIsFetching(true)
    const nextPage = page + 1
    try {
      const data: any = await communitiesApi.getPosts(slug, nextPage, accessToken)
      const items: Post[] = Array.isArray(data) ? data : data.data ?? []
      const meta = data.meta
      setPosts(prev => [...prev, ...items])
      setPage(nextPage)
      setHasMore(meta ? nextPage < meta.total_pages : items.length === 20)
    } catch {}
    finally { setIsFetching(false) }
  }, [slug, accessToken, page, hasMore, isFetching])

  const handleLike = useCallback(async (postId: string) => {
    if (!accessToken) return
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1, liked_by_me: !p.liked_by_me }
        : p
    ))
    try {
      await communitiesApi.likePost(slug, postId, accessToken)
    } catch {
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1, liked_by_me: !p.liked_by_me }
          : p
      ))
    }
  }, [slug, accessToken])

  const handleHide = useCallback(async (postId: string) => {
    if (!accessToken) return
    try {
      await communitiesApi.hidePost(slug, postId, accessToken)
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_deleted: true } : p))
    } catch {}
  }, [slug, accessToken])

  const handleDelete = useCallback(async (postId: string) => {
    if (!accessToken) return
    if (!confirm('¿Eliminar este post permanentemente?')) return
    try {
      await communitiesApi.deletePost(slug, postId, accessToken)
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch {}
  }, [slug, accessToken])

  const [editingPost, setEditingPost] = useState<Post | null>(null)

  const handleEdit = useCallback(async (postId: string, newContent: string) => {
    if (!accessToken) return
    try {
      const res: any = await communitiesApi.updatePost(slug, postId, { content: newContent }, accessToken)
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: res.content ?? newContent, edited_at: res.edited_at } : p))
      setEditingPost(null)
    } catch {}
  }, [slug, accessToken])

  const handleNewPost = (post: Post) => {
    setPosts(prev => [post, ...prev])
  }

  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { threshold: 0.1 }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <div className="cf-panel">
      {isMember && isLoggedIn && (
        <QuickPostComposer slug={slug} accessToken={accessToken!} onPost={handleNewPost} />
      )}

      {isLoading ? (
        <div className="feed-skeleton-list">
          {[1, 2, 3].map(i => <div key={i} className="skeleton feed-sk-card" />)}
        </div>
      ) : !posts.length ? (
        <div className="center-empty">
          <p>{isMember ? 'Sé el primero en publicar.' : 'Únete a la comunidad para ver el feed.'}</p>
        </div>
      ) : (
        <>
          {posts.map((post, i) => (
            <Fragment key={post.id}>
              <PostCard
                post={post}
                index={i}
                isLoggedIn={isLoggedIn}
                onLike={() => handleLike(post.id)}
                onEdit={userId === post.user_id ? () => setEditingPost(post) : undefined}
                onHide={userRole && ['moderador', 'creador'].includes(userRole) ? () => handleHide(post.id) : undefined}
                onDelete={userRole === 'creador' ? () => handleDelete(post.id) : undefined}
                isCommentsOpen={openCommentPostId === post.id}
                onToggleComments={() => setOpenCommentPostId(openCommentPostId === post.id ? null : post.id)}
                onShare={(newPost: Post) => setPosts(prev => [newPost, ...prev])}
              />
              {openCommentPostId === post.id && (
                <PostComments
                  slug={slug}
                  postId={post.id}
                  isLoggedIn={isLoggedIn}
                  accessToken={accessToken}
                  onClose={() => setOpenCommentPostId(null)}
                />
              )}
              {(i + 1) % 6 === 0 && <AdFeed key={`ad-${i}`} />}
            </Fragment>
          ))}
          {isFetching && (
            <div className="feed-loading-spinner"><div className="feed-spinner" /></div>
          )}
          <div ref={sentinelRef} className="feed-sentinel" />
          {!hasMore && <p className="feed-end-text">Has visto todos los posts</p>}
        </>
      )}

      {/* Edit post modal */}
      {editingPost && (
        <div className="cpm-overlay" onClick={() => setEditingPost(null)}>
          <div className="cpm-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Editar publicación">
            <div className="cpm-header">
              <h2 className="cpm-title">Editar publicación</h2>
              <button onClick={() => setEditingPost(null)} className="cpm-close" aria-label="Cerrar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <EditPostForm post={editingPost} onSave={handleEdit} onCancel={() => setEditingPost(null)} />
          </div>
        </div>
      )}

      <style>{`
        .cf-panel { padding: 1rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .cpm-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex;
          align-items: center; justify-content: center; z-index: 200; padding: 1rem;
        }
        .cpm-modal {
          background: var(--bg-surface); border: 1px solid var(--border);
          border-radius: var(--radius-xl); width: 100%; max-width: 720px;
          max-height: 90dvh; overflow-y: auto; box-shadow: var(--shadow-lg);
        }
        .cpm-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1.25rem; border-bottom: 1px solid var(--border);
        }
        .cpm-title { font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin: 0; color: var(--text-primary); }
        .cpm-close { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 0.25rem; border-radius: 50%; display: flex; }
        .cpm-close:hover { color: var(--text-primary); }
        .cpm-toolbar {
          display: flex; align-items: center; gap: 0.25rem;
          padding: 0.5rem 1.25rem; border-bottom: 1px solid var(--border); flex-wrap: wrap;
        }
        .cpm-tb-btn {
          display: flex; align-items: center; justify-content: center; width: 30px; height: 30px;
          background: transparent; border: none; border-radius: var(--radius-md);
          color: var(--text-muted); cursor: pointer; font-family: var(--font-display);
          font-size: 0.75rem; transition: all var(--transition-fast);
        }
        .cpm-tb-btn:hover { background: var(--bg-overlay); color: var(--text-secondary); }
        .cpm-tb-sep { width: 1px; height: 20px; background: var(--border); margin: 0 0.25rem; }
        .cpm-editor { padding: 0.5rem 1.25rem; }
        .cpm-textarea {
          width: 100%; padding: 0.5rem 0; background: transparent; border: none;
          outline: none; color: var(--text-primary); font-family: var(--font-body);
          font-size: 0.9375rem; line-height: 1.6; resize: none; min-height: 120px;
        }
        .cpm-textarea::placeholder { color: var(--text-muted); }
        .cpm-footer { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; border-top: 1px solid var(--border); }
        .cpm-count { font-size: 0.75rem; color: var(--text-muted); }
        .cpm-submit {
          padding: 0.5rem 1.5rem; background: var(--accent); color: #fff;
          font-family: var(--font-display); font-size: 0.875rem; font-weight: 700;
          border: none; border-radius: var(--radius-md); cursor: pointer;
          transition: background var(--transition-fast);
        }
        .cpm-submit:hover:not(:disabled) { background: var(--accent-dim); }
        .cpm-submit:disabled { background: var(--bg-overlay); color: var(--text-muted); cursor: not-allowed; }
      `}</style>
    </div>
  )
}

/* ─── Edit Post Form ──────────────────────────────────────── */

function EditPostForm({ post, onSave, onCancel }: {
  post: Post
  onSave: (postId: string, content: string) => Promise<void>
  onCancel: () => void
}) {
  const [content, setContent] = useState(post.content)
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const wrapText = useCallback((prefix: string, suffix: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.substring(start, end)
    setContent(content.substring(0, start) + prefix + selected + suffix + content.substring(end))
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
    }, 0)
  }, [content])

  const handleSubmit = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      await onSave(post.id, content.trim())
    } catch {} finally { setSaving(false) }
  }

  return (
    <>
      <div className="cpm-toolbar">
        <button onClick={() => wrapText('**', '**')} className="cpm-tb-btn" title="Negrita" aria-label="Negrita">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" /></svg>
        </button>
        <button onClick={() => wrapText('*', '*')} className="cpm-tb-btn" title="Cursiva" aria-label="Cursiva">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" /></svg>
        </button>
        <button onClick={() => wrapText('***', '***')} className="cpm-tb-btn" title="Negrita + Cursiva" aria-label="Negrita y cursiva">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" /></svg>
        </button>
        <button onClick={() => wrapText('~~', '~~')} className="cpm-tb-btn" title="Tachado" aria-label="Tachado">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 12h12M3 6l2.5 3M21 6l-2.5 3M12 18V6" /></svg>
        </button>
        <button onClick={() => wrapText('__', '__')} className="cpm-tb-btn" title="Subrayado" aria-label="Subrayado">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3M4 21h16" /></svg>
        </button>
        <span className="cpm-tb-sep" />
        <button onClick={() => wrapText('<small>', '</small>')} className="cpm-tb-btn" title="Pequeño" aria-label="Texto pequeño">T<sub>s</sub></button>
        <button onClick={() => wrapText('<large>', '</large>')} className="cpm-tb-btn" title="Grande" aria-label="Texto grande">T<sup>l</sup></button>
        <button onClick={() => wrapText('<xlarge>', '</xlarge>')} className="cpm-tb-btn" title="Extra grande" aria-label="Texto extra grande">T<sup>xl</sup></button>
      </div>

      <div className="cpm-editor">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          className="cpm-textarea"
          rows={10}
          maxLength={5000}
          disabled={saving}
          placeholder="Edita tu publicación..."
        />
      </div>

      <div className="cpm-footer">
        <span className="cpm-count">{content.length}/5000</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={onCancel} className="cpm-submit" style={{ background: 'var(--bg-overlay)', color: 'var(--text-secondary)' }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={saving || !content.trim()} className="cpm-submit">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </>
  )
}

/* ─── Quick Post Composer ────────────────────────────────── */

const MAX_GIFS = 4

function countGifs(text: string) {
  const imageUrlRegex = /https?:\/\/[^\s'"]+\.(?:gif|png|jpg|jpeg|webp)(?:\?[^\s'"]*)?/gi
  const matches = text.match(imageUrlRegex)
  return matches ? matches.length : 0
}

function QuickPostComposer({ slug, accessToken, onPost }: {
  slug: string
  accessToken: string
  onPost: (post: Post) => void
}) {
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile) return
    if (countGifs(content) > MAX_GIFS) {
      alert(`Máximo ${MAX_GIFS} GIFs por publicación.`)
      return
    }
    setSending(true)
    try {
      let imageUrl: string | undefined
      if (imageFile) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => { const r = reader.result as string; resolve(r.split(',')[1]) }
          reader.onerror = reject
          reader.readAsDataURL(imageFile)
        })
        const mimeType = imageFile.type || 'image/jpeg'
        const res = await uploadsApi.uploadImage(base64, mimeType, accessToken)
        imageUrl = res?.url
      }
      const post = await communitiesApi.createPost(slug, { content: content.trim(), imageUrl }, accessToken) as Post
      onPost(post)
      setContent('')
      setImageFile(null)
      setImagePreview(null)
    } catch {} finally { setSending(false) }
  }

  return (
    <div className="q-composer">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="¿Qué quieres compartir?"
        className="q-composer-input"
        rows={2}
        maxLength={2000}
        disabled={sending}
      />
      {imagePreview && (
        <div className="q-composer-preview">
          <img src={imagePreview} alt="" className="q-composer-preview-img" />
          <button onClick={() => { setImageFile(null); setImagePreview(null) }} className="q-composer-preview-remove">✕</button>
        </div>
      )}
      <div className="q-composer-footer">
        <button onClick={() => fileRef.current?.click()} className="q-composer-img-btn" disabled={sending}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
          Imagen
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={e => {
          const f = e.target.files?.[0]
          if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)) }
        }} className="q-composer-file" />
        <div className="q-composer-right">
          <span className="q-composer-count">{content.length}/2000</span>
          <button onClick={handleSubmit} disabled={sending || (!content.trim() && !imageFile)} className="q-composer-submit">
            {sending ? '...' : 'Publicar'}
          </button>
        </div>
      </div>

      <style>{`
        .q-composer { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
        .q-composer:focus-within { border-color: var(--border-focus); }
        .q-composer-input { display: block; width: 100%; padding: 0.75rem 1rem; background: transparent; border: none; outline: none; color: var(--text-primary); font-family: var(--font-body); font-size: 0.875rem; line-height: 1.5; resize: none; }
        .q-composer-input::placeholder { color: var(--text-muted); }
        .q-composer-preview { position: relative; margin: 0 1rem 0.5rem; border-radius: var(--radius-md); overflow: hidden; max-height: 150px; }
        .q-composer-preview-img { width: 100%; height: 150px; object-fit: cover; display: block; }
        .q-composer-preview-remove { position: absolute; top: 0.375rem; right: 0.375rem; width: 24px; height: 24px; background: rgba(0,0,0,0.7); color: #fff; border: none; border-radius: 50%; cursor: pointer; font-size: 0.625rem; display: flex; align-items: center; justify-content: center; }
        .q-composer-footer { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 1rem; border-top: 1px solid var(--border); }
        .q-composer-img-btn { display: flex; align-items: center; gap: 0.375rem; padding: 0.3rem 0.625rem; font-family: var(--font-display); font-size: 0.75rem; font-weight: 600; color: var(--text-muted); background: transparent; border: 1px solid var(--border); border-radius: var(--radius-full); cursor: pointer; transition: all var(--transition-fast); }
        .q-composer-img-btn:hover { color: var(--text-secondary); border-color: var(--border-hover); }
        .q-composer-file { display: none; }
        .q-composer-right { display: flex; align-items: center; gap: 0.75rem; }
        .q-composer-count { font-size: 0.6875rem; color: var(--text-muted); }
        .q-composer-submit { padding: 0.35rem 1rem; background: var(--accent); color: #fff; font-family: var(--font-display); font-size: 0.8125rem; font-weight: 700; border: none; border-radius: var(--radius-md); cursor: pointer; transition: background var(--transition-fast); }
        .q-composer-submit:hover:not(:disabled) { background: var(--accent-dim); }
        .q-composer-submit:disabled { background: var(--bg-overlay); color: var(--text-muted); cursor: not-allowed; }
      `}</style>
    </div>
  )
}
