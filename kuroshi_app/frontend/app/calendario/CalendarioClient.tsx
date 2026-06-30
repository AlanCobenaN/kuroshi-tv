'use client'
import { useMemo } from 'react'
import Link from 'next/link'
import { ScheduleDay } from '@/types'

interface Props {
  initialSchedule: ScheduleDay[]
}

const DAY_NAMES_SHORT: Record<string, string> = {
  'Sunday': 'Dom', 'Monday': 'Lun', 'Tuesday': 'Mar', 'Wednesday': 'Mié',
  'Thursday': 'Jue', 'Friday': 'Vie', 'Saturday': 'Sáb',
}

const MONTH_NAMES_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })
}

function getDayMeta(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)

  let label = DAY_NAMES_SHORT[d.toLocaleDateString('en-US', { weekday: 'long' })] ?? ''
  if (diff === 0) label = 'Hoy'
  else if (diff === 1) label = 'Mañana'

  return {
    label,
    dayNum: d.getDate(),
    month: MONTH_NAMES_SHORT[d.getMonth()] ?? '',
    isToday: diff === 0,
    diff,
  }
}

function toDateStr(d: Date): string {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

export function CalendarioClient({ initialSchedule }: Props) {
  const days = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Build lookup from API data
    const lookup = new Map<string, ScheduleDay>()
    for (const day of initialSchedule) {
      lookup.set(day.date, day)
    }

    // Generate 7 consecutive days starting today
    const result: (ScheduleDay & { empty: boolean })[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      const dateStr = toDateStr(d)
      const existing = lookup.get(dateStr)
      result.push(existing ? { ...existing, empty: false } : { date: dateStr, items: [], empty: true })
    }
    return result
  }, [initialSchedule])

  if (days.every(d => d.empty)) {
    return (
      <div className="cw-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', opacity: 0.4 }}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <h3>No hay episodios programados</h3>
        <p>El calendario se sincroniza automáticamente con AniList.</p>
        <style>{`
          .cw-empty {
            display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
            padding: 4rem 2rem; text-align: center;
          }
          .cw-empty h3 { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--text-secondary); margin: 0; }
          .cw-empty p { font-size: 0.875rem; color: var(--text-muted); margin: 0; }
        `}</style>
      </div>
    )
  }

  return (
    <div className="cw-root">
      <div className="cw-grid">
        {days.map(day => {
          const meta = getDayMeta(day.date)
          return (
            <div key={day.date} className={`cw-col ${meta.isToday ? 'cw-col--today' : ''}`}>
              <div className="cw-day-header">
                <span className="cw-day-label">{meta.label}</span>
                <span className="cw-day-date">{meta.dayNum}<span className="cw-day-month">{meta.month}</span></span>
              </div>
              <div className="cw-cards">
                {day.empty ? (
                  <div className="cw-empty-day">Sin episodios</div>
                ) : (
                  day.items.map(item => (
                    <EpisodeCard key={item.id} item={item} />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        .cw-root {
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
        }
        .cw-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.625rem;
        }
        .cw-col {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .cw-col--today {
          border-color: var(--accent);
          box-shadow: 0 0 0 1px var(--accent);
        }
        .cw-day-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.125rem;
          padding: 0.75rem 0.5rem 0.625rem;
          background: var(--bg-elevated);
          border-bottom: 1px solid var(--border);
          text-align: center;
        }
        .cw-day-label {
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--accent);
        }
        .cw-day-date {
          font-family: var(--font-display);
          font-size: 1.375rem;
          font-weight: 800;
          line-height: 1;
          color: var(--text-primary);
        }
        .cw-day-month {
          font-size: 0.5625rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.03em;
          display: block;
          margin-top: 0.0625rem;
        }
        .cw-cards {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .cw-ep-card {
          display: flex;
          gap: 0.375rem;
          padding: 0.5rem;
          text-decoration: none;
          border-bottom: 1px solid var(--border);
          transition: background var(--transition-fast);
          align-items: center;
        }
        .cw-ep-card:last-child { border-bottom: none; }
        .cw-ep-card:hover { background: var(--bg-overlay); }
        .cw-ep-cover {
          width: 28px;
          height: 40px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          flex-shrink: 0;
          background: var(--bg-elevated);
        }
        .cw-ep-cover img {
          width: 100%; height: 100%;
          object-fit: cover;
        }
        .cw-ep-cover-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-muted);
        }
        .cw-ep-cover-placeholder svg { width: 12px; height: 12px; }
        .cw-ep-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.0625rem;
        }
        .cw-ep-title {
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cw-ep-meta {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.625rem;
          color: var(--text-muted);
          flex-wrap: wrap;
        }
        .cw-ep-num {
          font-weight: 600;
        }
        .cw-ep-dot {
          width: 2px; height: 2px;
          border-radius: 50%;
          background: var(--text-muted);
          flex-shrink: 0;
        }
        .cw-ep-time {
          font-weight: 600;
          color: var(--accent);
        }
        .cw-empty-day {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem 0.5rem;
          font-size: 0.6875rem;
          color: var(--text-muted);
          flex: 1;
        }
        @media (max-width: 820px) {
          .cw-grid {
            grid-template-columns: repeat(7, minmax(140px, 1fr));
          }
        }
        @media (max-width: 600px) {
          .cw-grid {
            grid-template-columns: repeat(7, minmax(120px, 1fr));
            gap: 0.5rem;
          }
          .cw-day-header {
            padding: 0.625rem 0.375rem 0.5rem;
          }
          .cw-day-date {
            font-size: 1.125rem;
          }
          .cw-ep-card {
            padding: 0.375rem;
          }
          .cw-ep-cover {
            width: 22px;
            height: 32px;
          }
          .cw-ep-title {
            font-size: 0.625rem;
          }
          .cw-ep-meta {
            font-size: 0.5625rem;
          }
        }
      `}</style>
    </div>
  )
}

function EpisodeCard({ item }: { item: ScheduleDay['items'][0] }) {
  const time = formatTime(item.airing_at)
  const slug = item.title
    ? item.title.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
        .slice(0, 200)
    : `anilist-${item.anilist_id}`

  return (
    <Link href={`/anime/${slug}`} className="cw-ep-card">
      <div className="cw-ep-cover">
        {item.cover_url ? (
          <img src={item.cover_url} alt="" loading="lazy" />
        ) : (
          <div className="cw-ep-cover-placeholder">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
          </div>
        )}
      </div>
      <div className="cw-ep-body">
        <strong className="cw-ep-title">{item.title ?? `#${item.anilist_id}`}</strong>
        <span className="cw-ep-meta">
          <span className="cw-ep-num">Ep. {item.episode}</span>
          <span className="cw-ep-dot" />
          <span className="cw-ep-time">{time}</span>
        </span>
      </div>
    </Link>
  )
}
