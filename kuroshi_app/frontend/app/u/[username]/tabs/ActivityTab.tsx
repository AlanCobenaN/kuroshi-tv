'use client'
// app/u/[username]/tabs/ActivityTab.tsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usersApi } from '@/lib/api'

interface ActivityItem {
  id: string
  type: 'episode_watched' | 'comment' | 'community_joined' | 'achievement' | 'anime_resumed' | 'post'
  description: string
  link?: string
  meta?: string
  created_at: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 60) return `Hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  return `Hace ${Math.floor(hrs / 24)}d`
}

const ACTIVITY_ICON: Record<string, React.ReactNode> = {
  episode_watched: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  comment: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  community_joined: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  achievement: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  ),
  anime_resumed: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" />
    </svg>
  ),
  post: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
}

const ACTIVITY_COLOR: Record<string, string> = {
  episode_watched:  'var(--text-muted)',
  comment:          'var(--text-muted)',
  community_joined: '#60a5fa',
  achievement:      'var(--amber)',
  anime_resumed:    '#4ade80',
  post:             '#a78bfa',
}

export function ActivityTab({ username }: { username: string }) {
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    usersApi.getActivity(username)
      .then((data: any) => {
        const items: ActivityItem[] = Array.isArray(data) ? data : data.data ?? []
        setActivity(items)
      })
      .catch(() => setActivity([]))
      .finally(() => setIsLoading(false))
  }, [username])

  if (isLoading) {
    return (
      <div className="activity-skeleton">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="activity-sk-row">
            <div className="skeleton activity-sk-icon" />
            <div className="activity-sk-content">
              <div className="skeleton activity-sk-text" style={{ width: `${55 + i * 7}%` }} />
              <div className="skeleton activity-sk-meta" />
            </div>
          </div>
        ))}
        <style>{`
          .activity-skeleton { display: flex; flex-direction: column; gap: 0; }
          .activity-sk-row { display: flex; gap: 0.875rem; padding: 0.875rem 0; border-bottom: 1px solid var(--border); }
          .activity-sk-icon { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; }
          .activity-sk-content { flex: 1; display: flex; flex-direction: column; gap: 0.375rem; justify-content: center; }
          .activity-sk-text { height: 14px; border-radius: 4px; }
          .activity-sk-meta { height: 11px; width: 60px; border-radius: 3px; }
        `}</style>
      </div>
    )
  }

  if (activity.length === 0) {
    return (
      <div className="activity-empty">
        <span aria-hidden="true">📋</span>
        <p>No hay actividad reciente.</p>
        <style>{`
          .activity-empty { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 3rem; text-align: center; color: var(--text-muted); }
          .activity-empty span { font-size: 2rem; }
          .activity-empty p { margin: 0; }
        `}</style>
      </div>
    )
  }

  return (
    <div className="activity-feed">
      {activity.map((item, i) => (
        <div key={item.id} className="activity-item animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
          <div
            className="activity-icon"
            style={{ color: ACTIVITY_COLOR[item.type] ?? 'var(--text-muted)' }}
            aria-hidden="true"
          >
            {ACTIVITY_ICON[item.type]}
          </div>
          <div className="activity-content">
            <p className="activity-desc">
              {item.link ? (
                <Link href={item.link} className="activity-link">{item.description}</Link>
              ) : item.description}
            </p>
            {item.meta && <span className="activity-meta-text">{item.meta}</span>}
          </div>
          <span className="activity-time">{timeAgo(item.created_at)}</span>
        </div>
      ))}

      <style>{`
        .activity-feed { display: flex; flex-direction: column; }
        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
          padding: 0.875rem 0;
          border-bottom: 1px solid var(--border);
        }
        .activity-item:last-child { border-bottom: none; }
        .activity-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--bg-elevated);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .activity-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.2rem; }
        .activity-desc { font-size: 0.875rem; color: var(--text-secondary); margin: 0; line-height: 1.5; }
        .activity-link { color: var(--accent); text-decoration: none; font-weight: 600; }
        .activity-link:hover { text-decoration: underline; }
        .activity-meta-text { font-size: 0.75rem; color: var(--text-muted); }
        .activity-time { font-size: 0.75rem; color: var(--text-muted); white-space: nowrap; flex-shrink: 0; font-family: var(--font-display); }
      `}</style>
    </div>
  )
}
