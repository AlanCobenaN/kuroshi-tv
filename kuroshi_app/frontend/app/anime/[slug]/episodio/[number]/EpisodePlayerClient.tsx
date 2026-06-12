'use client'
// app/anime/[slug]/episodio-[number]/EpisodePlayerClient.tsx
import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Anime, AnimeSummary, Episode } from '@/types'
import { VideoPlayer } from '@/components/episode/VideoPlayer'
import { EpisodeChat } from '@/components/episode/EpisodeChat'
import { EpisodeNavigator } from '@/components/episode/EpisodeNavigator'
import { usersApi } from '@/lib/api'
import { PlayerWithAds } from '@/components/ads/PlayerWithAds'
import { AdBanner } from '@/components/ads/AdBanner'

interface Props {
  animeSlug: string
  anime: Anime | null
  episode: Episode & { anime?: Anime }
  allEpisodes: Episode[]
  prevEpisode?: Episode
  nextEpisode?: Episode
  isLoggedIn: boolean
  userId?: string
  relatedAnimes: AnimeSummary[]
}

export function EpisodePlayerClient({
  animeSlug,
  anime,
  episode,
  allEpisodes,
  prevEpisode,
  nextEpisode,
  isLoggedIn,
  userId,
  relatedAnimes,
}: Props) {
  const [currentMinute, setCurrentMinute] = useState(0)
  const [showMobileChat, setShowMobileChat] = useState(false)

  const animeData = anime ?? episode.anime
  const servers   = episode.video_servers ?? []

  const handleProgressSave = useCallback(async (minute: number, completed: boolean) => {
    const token = (window as any).__kuroshi_token__ as string | undefined
    if (!token || !isLoggedIn) return
    try {
      await usersApi.saveProgress(
        { episodeId: episode.id, lastMinute: minute, completed },
        token
      )
    } catch {}
  }, [episode.id, isLoggedIn])

  return (
    <PlayerWithAds>
      <div className="player-page">
        {/* ── Anuncio horizontal arriba ──────────────────────── */}
        <div style={{ paddingTop: '1rem' }}>
          <AdBanner />
        </div>

        {/* ── Breadcrumb ─────────────────────────────────────── */}
        <div className="player-breadcrumb container">
        <Link href="/anime" className="breadcrumb-link">Anime</Link>
        <span className="breadcrumb-sep" aria-hidden="true">/</span>
        {animeData && (
          <>
            <Link href={`/anime/${animeSlug}`} className="breadcrumb-link">
              {animeData.title_es}
            </Link>
            <span className="breadcrumb-sep" aria-hidden="true">/</span>
          </>
        )}
        <span className="breadcrumb-current">Episodio {episode.number}</span>
      </div>

      {/* ── Layout principal: reproductor + chat ───────────── */}
      <div className="player-layout">
        {/* Zona del reproductor — 70% */}
        <div className="player-main">
          <VideoPlayer
            servers={servers}
            animeTitle={animeData?.title_es ?? 'Anime'}
            animeSlug={animeSlug}
            episodeNumber={episode.number}
            onMinuteChange={setCurrentMinute}
            onProgressSave={handleProgressSave}
          />

          {/* Info del episodio */}
          <div className="episode-info">
            <div className="episode-info-header">
              <div className="episode-info-titles">
                <h1 className="episode-title">
                  {animeData?.title_es && (
                    <Link href={`/anime/${animeSlug}`} className="episode-anime-link">
                      {animeData.title_es}
                    </Link>
                  )}
                  {animeData?.title_es && <span className="episode-sep" aria-hidden="true"> — </span>}
                  Episodio {episode.number}
                  {episode.title && <span className="episode-ep-title">: {episode.title}</span>}
                </h1>
                {episode.air_date && (
                  <p className="episode-air-date">
                    Emitido el {new Date(episode.air_date).toLocaleDateString('es-LA', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                )}
              </div>

              {/* Botón de chat en móvil */}
              <button
                className="player-chat-toggle-mobile"
                onClick={() => setShowMobileChat(v => !v)}
                aria-label="Abrir chat del episodio"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Chat
              </button>
            </div>

            {episode.synopsis && (
              <p className="episode-synopsis">{episode.synopsis}</p>
            )}
          </div>

          {/* Navegación entre episodios */}
          <div className="episode-nav-wrapper">
            <EpisodeNavigator
              animeSlug={animeSlug}
              currentEpisodeNumber={episode.number}
              prevEpisode={prevEpisode}
              nextEpisode={nextEpisode}
              episodes={allEpisodes}
            />
          </div>

          {/* También te podría gustar */}
          {relatedAnimes.length > 0 && (
            <section className="player-related" aria-labelledby="player-related-title">
              <div className="player-related-header">
                <h2 className="player-related-title" id="player-related-title">También te podría gustar</h2>
              </div>

              <ul className="player-related-list" role="list">
                {relatedAnimes.map((a, i) => (
                  <li key={a.id} className="player-related-item">
                    <Link href={`/anime/${a.slug}`} className="player-related-card" aria-label={a.title_es}>
                      <div className="player-related-img-wrapper">
                        <Image
                          src={a.cover_url}
                          alt={a.title_es}
                          fill
                          sizes="120px"
                          className="player-related-img"
                          priority={i < 4}
                        />
                        {a.mal_rating && (
                          <span className="player-related-rating">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                            {a.mal_rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <span className="player-related-name">{a.title_es}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ── Chat del episodio — 30% ─────────────────────── */}
        <aside
          className={`player-chat-desktop`}
          aria-label="Chat del episodio en tiempo real"
        >
          <EpisodeChat
            animeSlug={animeSlug}
            episodeNumber={episode.number}
            episodeId={episode.id}
            currentMinute={currentMinute}
          />
        </aside>
      </div>

      {/* ── Chat móvil — panel deslizable ─────────────────── */}
      {showMobileChat && (
        <div
          className="player-chat-mobile-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Chat del episodio"
        >
          <div className="player-chat-mobile-panel">
            <div className="player-chat-mobile-handle">
              <button
                onClick={() => setShowMobileChat(false)}
                className="player-chat-close"
                aria-label="Cerrar chat"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <EpisodeChat
              animeSlug={animeSlug}
              episodeNumber={episode.number}
              episodeId={episode.id}
              currentMinute={currentMinute}
            />
          </div>
        </div>
      )}

      <style>{`
        .player-page {
          min-height: 100dvh;
          background: var(--bg-base);
        }

        /* Breadcrumb */
        .player-breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding-top: 1rem;
          padding-bottom: 0.75rem;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .player-breadcrumb::-webkit-scrollbar { display: none; }
        .breadcrumb-link {
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-muted);
          text-decoration: none;
          white-space: nowrap;
          transition: color var(--transition-fast);
        }
        .breadcrumb-link:hover { color: var(--text-secondary); }
        .breadcrumb-sep { color: var(--text-muted); font-size: 0.75rem; }
        .breadcrumb-current {
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        /* Layout principal — 70/30 */
        .player-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          height: calc(100vh - var(--total-nav) - 48px);
          min-height: 500px;
          /* Sticky en viewport */
          position: sticky;
          top: var(--total-nav);
        }

        /* Zona del reproductor */
        .player-main {
          overflow-y: auto;
          padding: 0 0 2rem;
          scrollbar-width: thin;
        }
        .player-main::-webkit-scrollbar { width: 4px; }
        .player-main::-webkit-scrollbar-thumb { background: var(--bg-hover); }

        /* Info del episodio */
        .episode-info {
          padding: 1rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
          border-bottom: 1px solid var(--border);
        }
        .episode-info-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }
        .episode-info-titles { flex: 1; }
        .episode-title {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.4;
          margin: 0;
        }
        .episode-anime-link {
          color: var(--accent);
          text-decoration: none;
          transition: opacity var(--transition-fast);
        }
        .episode-anime-link:hover { opacity: 0.8; }
        .episode-sep { color: var(--text-muted); }
        .episode-ep-title { font-weight: 400; color: var(--text-secondary); }
        .episode-air-date {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: 0.25rem 0 0;
        }
        .episode-synopsis {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Navegación */
        .episode-nav-wrapper { padding: 1rem 1.25rem; }

        /* Relacionados */
        .player-related {
          padding: 1.5rem 1.25rem 2rem;
          border-top: 1px solid var(--border);
        }
        .player-related-header { margin-bottom: 1rem; }
        .player-related-title {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .player-related-list {
          display: flex;
          gap: 0.75rem;
          list-style: none;
          padding: 0;
          margin: 0;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .player-related-list::-webkit-scrollbar { display: none; }
        .player-related-item { flex-shrink: 0; }
        .player-related-card {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 110px;
          text-decoration: none;
          transition: transform var(--transition-normal);
        }
        .player-related-card:hover { transform: translateY(-3px); }
        .player-related-card:hover .player-related-img { transform: scale(1.05); }
        .player-related-img-wrapper {
          position: relative;
          aspect-ratio: 2 / 3;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--bg-elevated);
        }
        .player-related-img {
          object-fit: cover;
          transition: transform 0.35s ease;
        }
        .player-related-rating {
          position: absolute;
          top: 0.375rem;
          right: 0.375rem;
          display: flex;
          align-items: center;
          gap: 0.2rem;
          background: rgba(10,10,15,0.75);
          backdrop-filter: blur(8px);
          color: var(--amber);
          font-family: var(--font-display);
          font-size: 0.625rem;
          font-weight: 700;
          padding: 0.15rem 0.4rem;
          border-radius: var(--radius-full);
        }
        .player-related-name {
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.3;
          transition: color var(--transition-fast);
        }
        .player-related-card:hover .player-related-name { color: var(--text-primary); }

        /* Botón chat móvil */
        .player-chat-toggle-mobile {
          display: none;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.875rem;
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          flex-shrink: 0;
          transition: all var(--transition-fast);
        }
        .player-chat-toggle-mobile:hover { color: var(--text-primary); border-color: var(--border-hover); }

        /* Chat desktop */
        .player-chat-desktop {
          border-left: 1px solid var(--border);
          overflow: hidden;
          height: 100%;
        }

        /* Chat móvil overlay */
        .player-chat-mobile-overlay {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
        }
        .player-chat-mobile-panel {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: min(340px, 90vw);
          background: var(--bg-surface);
          display: flex;
          flex-direction: column;
          animation: slide-in-right 0.25s ease;
        }
        .player-chat-mobile-handle {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 0.625rem 0.875rem;
          border-bottom: 1px solid var(--border);
        }
        .player-chat-close {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: var(--radius-md);
          transition: color var(--transition-fast), background var(--transition-fast);
        }
        .player-chat-close:hover { color: var(--text-primary); background: var(--bg-hover); }

        /* Responsive */
        @media (max-width: 900px) {
          .player-layout {
            grid-template-columns: 1fr;
            height: auto;
            position: static;
          }
          .player-chat-desktop { display: none; }
          .player-chat-toggle-mobile { display: flex; }
          .player-chat-mobile-overlay { display: block; }
        }

        @media (max-width: 640px) {
          .player-breadcrumb { padding-top: 0.75rem; padding-bottom: 0.5rem; }
        }
      `}</style>
    </div>
    </PlayerWithAds>
  )
}
