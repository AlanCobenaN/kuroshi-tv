'use client'
// components/episode/VideoPlayer.tsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { VideoServer } from '@/types'
import { useMiniPlayer } from './MiniPlayerProvider'

interface Props {
  servers: VideoServer[]
  animeTitle: string
  animeSlug: string
  episodeNumber: number
  onMinuteChange: (minute: number) => void
  onProgressSave: (minute: number, completed: boolean) => void
}

export function VideoPlayer({ servers, animeTitle, animeSlug, episodeNumber, onMinuteChange, onProgressSave }: Props) {
  const router = useRouter()
  const { minimize } = useMiniPlayer()
  const [activeServer, setActiveServer] = useState<VideoServer | null>(
    servers.length > 0 ? servers[0] : null
  )
  const [currentMinute, setCurrentMinute] = useState(0)
  const [isPiP, setIsPiP] = useState(false)
  const iframeRef        = useRef<HTMLIFrameElement>(null)
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const minuteTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSavedMinRef  = useRef(0)

  // Simular tracking del minuto (el iframe del embed no da acceso real al tiempo)
  useEffect(() => {
    if (!activeServer) return

    let elapsedSeconds = 0

    minuteTimerRef.current = setInterval(() => {
      elapsedSeconds += 1
      const minute = Math.floor(elapsedSeconds / 60)
      if (minute !== currentMinute) {
        setCurrentMinute(minute)
        onMinuteChange(minute)
      }
    }, 1000)

    // Guardar progreso cada 30 segundos
    progressTimerRef.current = setInterval(() => {
      if (elapsedSeconds > 0 && Math.floor(elapsedSeconds / 60) !== lastSavedMinRef.current) {
        lastSavedMinRef.current = Math.floor(elapsedSeconds / 60)
        onProgressSave(lastSavedMinRef.current, false)
      }
    }, 30_000)

    return () => {
      if (minuteTimerRef.current)  clearInterval(minuteTimerRef.current)
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeServer?.id])

  const handlePiP = useCallback(() => {
    if (!activeServer) return
    const pip = window.open(
      activeServer.embed_url,
      'kuroshi-pip',
      'width=640,height=360,resizable=yes,scrollbars=no,toolbar=no,menubar=no'
    )
    if (pip) setIsPiP(true)
  }, [activeServer])

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
              onClick={() => setActiveServer(server)}
              className={`player-server-btn ${activeServer?.id === server.id ? 'player-server-btn--active' : ''}`}
              aria-pressed={activeServer?.id === server.id}
              aria-label={`Cambiar a ${server.server_name}`}
            >
              {server.server_name}
            </button>
          ))}
        </div>

        <div className="player-actions">
          <button
            onClick={handlePiP}
            className="player-action-btn"
            title="Picture in Picture"
            aria-label="Abrir en ventana flotante"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <rect x="12" y="9" width="9" height="7" rx="1" ry="1" fill="currentColor" />
            </svg>
            PiP
          </button>

          <button
            onClick={() => {
              if (activeServer) {
                minimize({
                  embedUrl: activeServer.embed_url,
                  serverName: activeServer.server_name,
                  animeTitle,
                  animeSlug,
                  episodeNumber,
                })
                router.push('/')
              }
            }}
            className="player-action-btn"
            title="Ventana flotante"
            aria-label="Minimizar reproductor"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <rect x="9" y="7" width="8" height="6" rx="1" ry="1" fill="currentColor" />
            </svg>
            Minimizar
          </button>

          <span className="player-minute">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            min {currentMinute}
          </span>
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

        .player-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .player-action-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.625rem;
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
        .player-action-btn:hover { color: var(--text-primary); border-color: var(--border-hover); }

        .player-minute {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  )
}
