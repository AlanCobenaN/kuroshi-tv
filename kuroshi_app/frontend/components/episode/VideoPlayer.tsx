'use client'
import { useState } from 'react'
import { VideoServer } from '@/types'

interface Props {
  servers: VideoServer[]
}

export function VideoPlayer({ servers }: Props) {
  const [activeServer, setActiveServer] = useState<VideoServer | null>(
    servers.length > 0 ? servers[0] : null
  )

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
            src={activeServer.embed_url}
            className="player-iframe"
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
      `}</style>
    </div>
  )
}
