'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { VideoServer } from '@/types'

interface Props {
  servers: VideoServer[]
  animeTitle: string
  animeSlug: string
  episodeNumber: number
  onMinuteChange: (minute: number) => void
  onProgressSave: (minute: number, completed: boolean) => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function VideoPlayer({ servers, animeTitle, animeSlug, episodeNumber, onMinuteChange, onProgressSave }: Props) {
  const [activeServer, setActiveServer] = useState<VideoServer | null>(
    servers.length > 0 ? servers[0] : null
  )
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSavedMinRef = useRef(0)
  const lastEmittedMinRef = useRef(0)

  const currentMinute = Math.floor(elapsedSeconds / 60)

  // Emit minute change when crossing minute boundary
  useEffect(() => {
    if (currentMinute !== lastEmittedMinRef.current) {
      lastEmittedMinRef.current = currentMinute
      onMinuteChange(currentMinute)
    }
  }, [currentMinute, onMinuteChange])

  // Timer tick — only runs when timerRunning is true
  useEffect(() => {
    if (!timerRunning || !activeServer) return

    tickRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1)
    }, 1000)

    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [timerRunning, activeServer?.id])

  // Progress save — always runs regardless of timer state
  useEffect(() => {
    if (!activeServer) return

    progressTimerRef.current = setInterval(() => {
      const minute = Math.floor(elapsedSeconds / 60)
      if (minute > 0 && minute !== lastSavedMinRef.current) {
        lastSavedMinRef.current = minute
        onProgressSave(minute, false)
      }
    }, 30_000)

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeServer?.id])

  const toggleTimer = useCallback(() => {
    setTimerRunning(prev => !prev)
  }, [])

  const seek = useCallback((delta: number) => {
    setElapsedSeconds(prev => Math.max(0, prev + delta))
  }, [])

  const resetTimer = useCallback(() => {
    setElapsedSeconds(0)
    setTimerRunning(false)
    lastSavedMinRef.current = 0
    lastEmittedMinRef.current = 0
  }, [])

  if (servers.length === 0) {
    return (
      <div className="player-unavailable">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--text-muted)' }}>
          <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
        <h3>Sin servidores disponibles</h3>
        <p>Este episodio no tiene servidores de video configurados aún.</p>
        <style>{`
          .player-unavailable {
            aspect-ratio: 16 / 9;
            background: var(--bg-elevated);
            border-radius: var(--radius-xl);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            text-align: center;
            padding: 2rem;
            color: var(--text-muted);
          }
          h3 { font-family: var(--font-display); font-size: 1rem; color: var(--text-secondary); margin: 0; }
          p  { font-size: 0.875rem; margin: 0; }
        `}</style>
      </div>
    )
  }

  return (
    <div className="player-wrapper">
      <div className="player-frame-wrapper">
        {activeServer && (
          <iframe
            ref={iframeRef}
            src={activeServer.embed_url}
            className="player-iframe"
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture"
            title={`Reproductor — ${activeServer.server_name}`}
            loading="lazy"
          />
        )}
      </div>

      <div className="player-controls">
        <div className="player-servers">
          <span className="player-servers-label">Servidor:</span>
          {servers.map((server, i) => (
            <button
              key={server.id}
              onClick={() => {
                setActiveServer(server)
                resetTimer()
              }}
              className={`player-server-btn ${activeServer?.id === server.id ? 'player-server-btn--active' : ''}`}
              aria-pressed={activeServer?.id === server.id}
              aria-label={`Cambiar a ${server.server_name}`}
            >
              {server.server_name}
            </button>
          ))}
        </div>

        <div className="player-timer">
          <button
            onClick={() => seek(-60)}
            className="player-timer-btn"
            title="Retroceder 1 minuto"
            aria-label="Retroceder 1 minuto"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>

          <button
            onClick={() => seek(-10)}
            className="player-timer-btn"
            title="Retroceder 10 segundos"
            aria-label="Retroceder 10 segundos"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            <span className="player-timer-seek-label">10s</span>
          </button>

          <button
            onClick={toggleTimer}
            className="player-timer-play"
            title={timerRunning ? 'Pausar temporizador' : 'Iniciar temporizador'}
            aria-label={timerRunning ? 'Pausar temporizador' : 'Iniciar temporizador'}
          >
            {timerRunning ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          <span className="player-timer-display">{formatTime(elapsedSeconds)}</span>

          <button
            onClick={() => seek(10)}
            className="player-timer-btn"
            title="Avanzar 10 segundos"
            aria-label="Avanzar 10 segundos"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            <span className="player-timer-seek-label">10s</span>
          </button>

          <button
            onClick={() => seek(60)}
            className="player-timer-btn"
            title="Avanzar 1 minuto"
            aria-label="Avanzar 1 minuto"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        .player-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0;
          background: #000;
          border-radius: var(--radius-xl);
          overflow: hidden;
        }

        .player-frame-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #000;
        }
        .player-iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        .player-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 0.625rem 0.875rem;
          background: var(--bg-elevated);
          border-top: 1px solid var(--border);
        }

        .player-servers {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          flex-wrap: wrap;
        }
        .player-servers-label {
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .player-server-btn {
          padding: 0.25rem 0.75rem;
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--bg-overlay);
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .player-server-btn:hover { color: var(--text-primary); border-color: var(--border-hover); }
        .player-server-btn--active {
          color: var(--text-primary);
          background: var(--bg-hover);
          border-color: var(--accent);
        }

        .player-timer {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .player-timer-btn {
          display: flex;
          align-items: center;
          gap: 0.15rem;
          padding: 0.25rem 0.4rem;
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--text-muted);
          background: var(--bg-overlay);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .player-timer-btn:hover { color: var(--text-primary); border-color: var(--border-hover); }
        .player-timer-seek-label { font-size: 0.5625rem; }
        .player-timer-play {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          padding: 0;
          background: var(--accent);
          border: none;
          border-radius: var(--radius-full);
          color: #fff;
          cursor: pointer;
          transition: background var(--transition-fast);
        }
        .player-timer-play:hover { background: var(--accent-dim); }
        .player-timer-display {
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: var(--text-primary);
          min-width: 3.5ch;
          text-align: center;
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  )
}
