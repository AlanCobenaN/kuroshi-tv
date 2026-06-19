'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Post } from '@/types'
import { RichText } from '@/components/community/RichText'
import { ReportModal } from '@/components/community/ReportModal'

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

interface PostCardProps {
  post: Post
  onLike?: () => void
  onToggleComments?: () => void
  onHide?: () => void
  onDelete?: () => void
  onEdit?: () => void
  isCommentsOpen?: boolean
  isLoggedIn?: boolean
  index?: number
  showCommunity?: boolean
}

export function PostCard({
  post,
  onLike,
  onToggleComments,
  onHide,
  onDelete,
  onEdit,
  isCommentsOpen = false,
  isLoggedIn = false,
  index = 0,
  showCommunity = false,
}: PostCardProps) {
  const [imgError, setImgError] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const isHidden = post.is_deleted ?? false

  return (
    <article
      className={`fb-card ${isHidden ? 'fb-card--hidden' : ''}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Header */}
      <div className="fb-header">
        <Link href={`/u/${post.user.username}`} className="fb-avatar-link">
          {post.user.avatar_url && !imgError ? (
            <Image
              src={post.user.avatar_url}
              alt=""
              width={40}
              height={40}
              className="fb-avatar"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="fb-avatar-fallback">
              {post.user.username[0].toUpperCase()}
            </div>
          )}
        </Link>
        <div className="fb-header-meta">
          <div className="fb-header-top">
            <Link href={`/u/${post.user.username}`} className="fb-name">
              {post.user.username}
            </Link>
            {showCommunity && post.community && (
              <Link href={`/comunidades/${post.community.slug}`} className="fb-community">
                {post.community.name}
              </Link>
            )}
            {isHidden && <span className="fb-hidden-badge">Oculto</span>}
          </div>
          <span className="fb-time">{timeAgo(post.created_at)}</span>
        </div>
        {(onHide || onDelete || onEdit) && (
          <div className="fb-mod-actions">
            {onEdit && (
              <button onClick={onEdit} className="fb-mod-btn" title="Editar post" aria-label="Editar post">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
            {onHide && (
              <button onClick={onHide} className="fb-mod-btn" title="Ocultar post" aria-label="Ocultar post">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="fb-mod-btn fb-mod-btn--danger" title="Eliminar permanentemente" aria-label="Eliminar permanentemente">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
        )}
        {isLoggedIn && (
          <button onClick={() => setShowReport(true)} className="fb-mod-btn" title="Reportar" aria-label="Reportar publicación">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
        )}
      </div>

      {showReport && (
        <ReportModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          contentType="post"
          contentId={post.id}
          contentLabel={post.content?.slice(0, 80)}
        />
      )}

      {/* Content */}
      {post.content && (
        <div className="fb-body">
          <RichText content={post.content} className="fb-text" />
        </div>
      )}

      {/* Image */}
      {post.image_url && (
        <div className="fb-image-wrap">
          <img
            src={post.image_url}
            alt=""
            className="fb-image"
            loading="lazy"
          />
        </div>
      )}

      {/* Linked episode */}
      {post.linked_episode && (
        <div className="fb-episode-wrap">
          <Link
            href={`/anime/${post.linked_episode.anime_slug}/episodio/${post.linked_episode.episode_number}`}
            className="fb-episode"
          >
            <span className="fb-episode-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </span>
            <div className="fb-episode-text">
              <span className="fb-episode-title">{post.linked_episode.anime_title}</span>
              <span className="fb-episode-num">Episodio {post.linked_episode.episode_number}</span>
            </div>
          </Link>
        </div>
      )}

      {/* Stats bar */}
      <div className="fb-stats">
        <span className="fb-stat">{post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}</span>
        <button
          onClick={onToggleComments}
          className="fb-stat fb-stat-btn"
          aria-label={`${post.comments_count} comentarios`}
        >
          {post.comments_count} {post.comments_count === 1 ? 'comentario' : 'comentarios'}
        </button>
      </div>

      {/* Action bar */}
      <div className="fb-actions">
        <button
          onClick={isLoggedIn ? onLike : undefined}
          disabled={!isLoggedIn}
          className={`fb-action ${post.liked_by_me ? 'fb-action--liked' : ''}`}
          aria-pressed={post.liked_by_me}
        >
          <svg
            width="18" height="18" viewBox="0 0 24 24"
            fill={post.liked_by_me ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>Me gusta</span>
        </button>

        <button
          onClick={onToggleComments}
          className={`fb-action ${isCommentsOpen ? 'fb-action--active' : ''}`}
          aria-expanded={isCommentsOpen}
          aria-label={`${post.comments_count} comentarios`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{post.comments_count}</span>
        </button>
      </div>

      <style>{`
        .fb-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          transition: box-shadow 0.2s, border-color 0.2s;
        }
        .fb-card:hover {
          border-color: var(--border-hover);
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }
        .fb-card--hidden {
          opacity: 0.5;
          border-style: dashed;
        }

        .fb-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem 0.75rem;
        }
        .fb-avatar-link { flex-shrink: 0; }
        .fb-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
        .fb-avatar-fallback {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), var(--accent-dim));
          color: #fff;
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .fb-header-meta {
          display: flex;
          flex-direction: column;
          gap: 0.05rem;
          min-width: 0;
          flex: 1;
        }
        .fb-header-top {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .fb-name {
          font-family: var(--font-display);
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--text-primary);
          text-decoration: none;
        }
        .fb-name:hover { text-decoration: underline; }
        .fb-community {
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--accent);
          background: var(--bg-overlay);
          padding: 0.125rem 0.5rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--border);
          text-decoration: none;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 160px;
        }
        .fb-community:hover { background: var(--bg-hover); }
        .fb-hidden-badge {
          font-size: 0.625rem;
          font-weight: 600;
          color: var(--text-muted);
          background: var(--bg-overlay);
          padding: 0.05rem 0.375rem;
          border-radius: var(--radius-sm);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .fb-time {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .fb-mod-actions {
          display: flex;
          gap: 0.25rem;
          flex-shrink: 0;
        }
        .fb-mod-btn {
          padding: 0.375rem;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-muted);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .fb-mod-btn:hover { color: var(--text-primary); border-color: var(--border-hover); }
        .fb-mod-btn--danger:hover { color: var(--accent); border-color: var(--accent); }

        .fb-body { padding: 0 1.25rem 0.75rem; }
        .fb-text {
          margin: 0;
          font-size: 0.9375rem;
          color: var(--text-primary);
          line-height: 1.6;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .fb-image-wrap {
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          background: var(--bg-overlay);
          display: flex;
          justify-content: center;
          padding: 0.5rem;
        }
        .fb-image { max-width: 100%; max-height: 400px; width: auto; height: auto; display: block; object-fit: contain; border-radius: var(--radius-md); }

        .fb-episode-wrap {
          padding: 0.625rem 1.25rem;
        }
        .fb-episode {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: var(--bg-overlay);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          text-decoration: none;
          transition: background 0.2s;
        }
        .fb-episode:hover { background: var(--bg-hover); }
        .fb-episode-icon {
          flex-shrink: 0;
          width: 36px; height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent);
          border-radius: 50%;
          color: #fff;
        }
        .fb-episode-text {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
          min-width: 0;
        }
        .fb-episode-title {
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .fb-episode-num {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .fb-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 1.25rem;
          border-top: 1px solid var(--border);
        }
        .fb-stat {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }
        .fb-stat-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          padding: 0;
        }
        .fb-stat-btn:hover { text-decoration: underline; }

        .fb-actions {
          display: flex;
          border-top: 1px solid var(--border);
        }
        .fb-action {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem 0.5rem;
          background: transparent;
          border: none;
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          transition: background 0.15s;
          border-radius: 0;
        }
        .fb-action:hover:not(:disabled) { background: var(--bg-overlay); color: var(--text-secondary); }
        .fb-action--liked { color: var(--accent); }
        .fb-action--liked:hover { color: var(--accent-dim); }
        .fb-action:disabled { cursor: default; opacity: 0.5; }
        .fb-action + .fb-action { border-left: 1px solid var(--border); }
        .fb-action--active { color: var(--accent); }
        .fb-action--active:hover { color: var(--accent-dim); }
      `}</style>
    </article>
  )
}
