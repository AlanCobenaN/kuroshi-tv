'use client'
import { useMemo } from 'react'
import Link from 'next/link'
import { ScheduleDay } from '@/types'

interface Props {
  initialSchedule: ScheduleDay[]
}

const DAY_NAMES: Record<string, string> = {
  'Monday': 'Lunes', 'Tuesday': 'Martes', 'Wednesday': 'Miércoles',
  'Thursday': 'Jueves', 'Friday': 'Viernes', 'Saturday': 'Sábado', 'Sunday': 'Domingo',
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function formatDayLabel(dateStr: string): { dayName: string; dayNum: string; month: string } {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = (d.getTime() - today.getTime()) / 86400000

  let prefix = ''
  if (diff === 0) prefix = 'Hoy — '
  else if (diff === 1) prefix = 'Mañana — '
  else if (diff === -1) prefix = 'Ayer — '

  const dayName = prefix + (DAY_NAMES[d.toLocaleDateString('en-US', { weekday: 'long' })] ?? '')
  const dayNum = String(d.getDate()).padStart(2, '0')
  const month = MONTH_NAMES[d.getMonth()] ?? ''
  return { dayName, dayNum, month }
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })
}

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - today.getTime()) / 86400000)
}

export function CalendarioClient({ initialSchedule }: Props) {
  const grouped = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const future = initialSchedule.filter(g => new Date(g.date + 'T00:00:00') >= now)
    const past = initialSchedule.filter(g => new Date(g.date + 'T00:00:00') < now)

    // Mostrar hasta 7 días en futuro, truncar pasado
    return { future: future.slice(0, 14), past: past.slice(-3) }
  }, [initialSchedule])

  if (initialSchedule.length === 0) {
    return (
      <div className="calendario-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', opacity: 0.4 }}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <h3>No hay episodios programados</h3>
        <p>El calendario se sincroniza automáticamente con AniList.</p>
        <style>{`
          .calendario-empty {
            display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
            padding: 4rem 2rem; text-align: center;
          }
          .calendario-empty h3 { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--text-secondary); margin: 0; }
          .calendario-empty p { font-size: 0.875rem; color: var(--text-muted); margin: 0; }
        `}</style>
      </div>
    )
  }

  return (
    <div className="calendario-list">
      {grouped.future.length === 0 && grouped.past.length === 0 ? (
        <div className="calendario-empty">
          <p style={{ color: 'var(--text-muted)' }}>No hay episodios programados para los próximos días.</p>
        </div>
      ) : (
        <>
          {grouped.future.map(day => (
            <DayGroup key={day.date} day={day} />
          ))}
          {grouped.past.length > 0 && (
            <details className="calendario-past">
              <summary className="calendario-past-summary">Días anteriores</summary>
              {grouped.past.map(day => (
                <DayGroup key={day.date} day={day} muted />
              ))}
            </details>
          )}
        </>
      )}

      <style>{`
        .calendario-list { display: flex; flex-direction: column; gap: 1.5rem; }
        .calendario-past { margin-top: 0.5rem; }
        .calendario-past-summary {
          font-family: var(--font-display); font-size: 0.75rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.05em;
          color: var(--text-muted); cursor: pointer; padding: 0.5rem 0;
          user-select: none;
        }
        .calendario-past-summary:hover { color: var(--text-secondary); }
        .calendario-past[open] .calendario-past-summary { margin-bottom: 1rem; }
      `}</style>
    </div>
  )
}

function DayGroup({ day, muted }: { day: ScheduleDay; muted?: boolean }) {
  const { dayName, dayNum, month } = formatDayLabel(day.date)
  const count = day.items.length
  const isToday = daysUntil(day.date) === 0

  return (
    <div className={`calendario-day ${muted ? 'calendario-day--muted' : ''} ${isToday ? 'calendario-day--today' : ''}`}>
      <div className="calendary-day-header">
        <div className="calendary-day-number">
          <span className="calendary-day-num">{dayNum}</span>
          <span className="calendary-day-month">{month}</span>
        </div>
        <div className="calendary-day-info">
          <span className="calendary-day-name">{dayName}</span>
          <span className="calendary-day-count">{count} episodio{count !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div className="calendary-episodes">
        {day.items.map(item => (
          <EpisodeCard key={item.id} item={item} />
        ))}
      </div>

      <style>{`
        .calendario-day {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          overflow: hidden;
          transition: opacity var(--transition-fast);
        }
        .calendario-day--muted { opacity: 0.6; }
        .calendario-day--today {
          border-color: var(--accent);
          box-shadow: 0 0 0 1px var(--accent);
        }
        .calendary-day-header {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.875rem 1rem;
          background: var(--bg-elevated);
          border-bottom: 1px solid var(--border);
        }
        .calendary-day-number {
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1;
          min-width: 3rem;
        }
        .calendary-day-num {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .calendary-day-month {
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .calendary-day-info {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        .calendary-day-name {
          font-family: var(--font-display);
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .calendary-day-count {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .calendary-episodes {
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  )
}

function EpisodeCard({ item }: { item: ScheduleDay['items'][0] }) {
  const time = formatTime(item.airingAt)
  const slug = item.title
    ? item.title.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
        .slice(0, 200)
    : `anilist-${item.anilistId}`

  return (
    <Link href={`/anime/${slug}`} className="calendary-episode-card">
      <div className="calendary-ep-cover">
        {item.coverUrl ? (
          <img src={item.coverUrl} alt="" loading="lazy" />
        ) : (
          <div className="calendary-ep-cover-placeholder">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
          </div>
        )}
      </div>
      <div className="calendary-ep-info">
        <strong className="calendary-ep-title">{item.title ?? `Anime #${item.anilistId}`}</strong>
        <span className="calendary-ep-episode">Episodio {item.episode}</span>
      </div>
      <div className="calendary-ep-time">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
        {time}
      </div>

      <style>{`
        .calendary-episode-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 1rem;
          text-decoration: none;
          transition: background var(--transition-fast);
          border-bottom: 1px solid var(--border);
        }
        .calendary-episode-card:last-child { border-bottom: none; }
        .calendary-episode-card:hover { background: var(--bg-overlay); }

        .calendary-ep-cover {
          width: 44px;
          height: 62px;
          border-radius: var(--radius-md);
          overflow: hidden;
          flex-shrink: 0;
          background: var(--bg-elevated);
        }
        .calendary-ep-cover img {
          width: 100%; height: 100%;
          object-fit: cover;
        }
        .calendary-ep-cover-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-muted);
        }

        .calendary-ep-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        .calendary-ep-title {
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .calendary-ep-episode {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .calendary-ep-time {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--accent);
          white-space: nowrap;
          flex-shrink: 0;
        }
      `}</style>
    </Link>
  )
}
