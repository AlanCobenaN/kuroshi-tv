'use client'

import { usePathname } from 'next/navigation'
import { useMiniPlayer } from './MiniPlayerProvider'

export function MiniPlayer() {
  const pathname = usePathname()
  const { player, expand, close } = useMiniPlayer()
  const isOnPlayerPage = player && pathname === `/anime/${player.animeSlug}/episodio/${player.episodeNumber}`

  if (!player || isOnPlayerPage) return null

  return (
    <div className="miniplayer" role="complementary" aria-label="Reproductor flotante">
      <div className="miniplayer-frame">
        <iframe
          src={player.embedUrl}
          className="miniplayer-iframe"
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          loading="lazy"
          title={`Reproduciendo ${player.animeTitle} — Episodio ${player.episodeNumber}`}
        />
      </div>

      <div className="miniplayer-body">
        <div className="miniplayer-info">
          <span className="miniplayer-anime">{player.animeTitle}</span>
          <span className="miniplayer-ep">Ep. {player.episodeNumber}</span>
        </div>
        <div className="miniplayer-actions">
          <button onClick={expand} className="miniplayer-btn miniplayer-btn--expand" title="Ir al reproductor completo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
          <button onClick={close} className="miniplayer-btn miniplayer-btn--close" title="Cerrar reproductor">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        .miniplayer {
          position: fixed;
          bottom: 1rem;
          right: 1rem;
          z-index: 900;
          width: 320px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          animation: miniplayer-in 0.3s ease;
        }
        @keyframes miniplayer-in {
          from { opacity: 0; transform: translateY(1rem) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .miniplayer-frame {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #000;
        }
        .miniplayer-iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        .miniplayer-body {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
        }
        .miniplayer-info {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          min-width: 0;
          flex: 1;
        }
        .miniplayer-anime {
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .miniplayer-ep {
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .miniplayer-actions {
          display: flex;
          gap: 0.25rem;
          flex-shrink: 0;
        }
        .miniplayer-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          padding: 0;
          border: none;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .miniplayer-btn--expand {
          background: var(--accent);
          color: var(--text-primary);
        }
        .miniplayer-btn--expand:hover { opacity: 0.8; }
        .miniplayer-btn--close {
          background: var(--bg-overlay);
          color: var(--text-muted);
        }
        .miniplayer-btn--close:hover { color: var(--text-primary); background: var(--bg-hover); }

        @media (max-width: 640px) {
          .miniplayer {
            left: 0.5rem;
            right: 0.5rem;
            bottom: 0.5rem;
            width: auto;
          }
        }
      `}</style>
    </div>
  )
}
