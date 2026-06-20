'use client'

import { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import { PostCard } from '@/components/community/PostCard'
import { PostComments } from '@/components/community/PostComments'
import { AdFeed } from '@/components/ads/AdFeed'
import { communitiesApi, usersApi } from '@/lib/api'
import { Post } from '@/types'
import Link from 'next/link'

interface Props {
  isLoggedIn?: boolean
  accessToken?: string
}

export function GlobalFeed({ isLoggedIn = false, accessToken }: Props) {
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)
  const [openCommentPostId, setOpenCommentPostId] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

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

  const handleLike = useCallback(async (postId: string, communitySlug?: string) => {
    if (!accessToken) return
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1, liked_by_me: !p.liked_by_me }
        : p
    ))
    try {
      if (communitySlug) {
        await communitiesApi.likePost(communitySlug, postId, accessToken)
      } else {
        await usersApi.likeUserPost(postId, accessToken)
      }
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
    <div className="global-feed">
      <div className="feed-header">
        <h2 className="feed-heading">Feed de la comunidad</h2>
        {isLoggedIn && accessToken && (
          <Link href="/comunidades/crear" className="feed-create-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Crear comunidad
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="feed-loading">
          {[1, 2, 3].map(i => (
            <div key={i} className="feed-skeleton animate-pulse" />
          ))}
        </div>
      ) : !posts.length ? (
        <div className="feed-empty">
          <p>Todavía no hay publicaciones.</p>
        </div>
      ) : (
        <>
          <div className="feed-list">
            {posts.map((post, i) => (
              <Fragment key={post.id}>
                <PostCard
                  post={post}
                  index={i}
                  isLoggedIn={isLoggedIn}
                  showCommunity
                  onLike={post.community ? () => handleLike(post.id, post.community!.slug) : () => handleLike(post.id)}
                  isCommentsOpen={openCommentPostId === post.id}
                  onToggleComments={() => setOpenCommentPostId(openCommentPostId === post.id ? null : post.id)}
                />
                {openCommentPostId === post.id && (
                  <PostComments
                    slug={post.community?.slug}
                    postId={post.id}
                    isLoggedIn={isLoggedIn}
                    accessToken={accessToken}
                    onClose={() => setOpenCommentPostId(null)}
                    isProfilePost={!post.community}
                  />
                )}
                {(i + 1) % 6 === 0 && <AdFeed key={`ad-${i}`} />}
              </Fragment>
            ))}
          </div>

          {isFetching && (
            <div className="feed-loading-more">
              <div className="feed-spinner" aria-label="Cargando más publicaciones" />
            </div>
          )}

          <div ref={sentinelRef} className="feed-sentinel" />

          {!hasMore && (
            <p className="feed-end">Has visto todas las publicaciones</p>
          )}
        </>
      )}

      <style>{`
        .global-feed { display: flex; flex-direction: column; gap: 1rem; }
        .feed-header { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; }
        .feed-heading {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .feed-create-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          background: var(--accent);
          color: #fff;
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 700;
          border: none;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: background var(--transition-fast);
          white-space: nowrap;
        }
        .feed-create-btn:hover { background: var(--accent-dim); }
        .feed-loading { display: flex; flex-direction: column; gap: 1rem; }
        .feed-skeleton { height: 220px; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px solid var(--border); }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .feed-empty { text-align: center; padding: 3rem 1rem; color: var(--text-muted); font-family: var(--font-display); font-size: 0.9375rem; }
        .feed-list { display: flex; flex-direction: column; gap: 1rem; }
        .feed-loading-more { display: flex; justify-content: center; padding: 1.5rem; }
        .feed-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: feed-spin 0.6s linear infinite;
        }
        @keyframes feed-spin { to { transform: rotate(360deg); } }
        .feed-sentinel { height: 1px; }
        .feed-end { text-align: center; padding: 2rem 1rem; color: var(--text-muted); font-family: var(--font-display); font-size: 0.8125rem; }
      `}</style>
    </div>
  )
}
