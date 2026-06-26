'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Anime } from '@/types'

interface Props {
  animes: (Anime & { synopsis?: string })[]
}

export function HeroSection({ animes }: Props) {
  const [current, setCurrent] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback((idx: number) => {
    if (idx === current) return
    setPrev(current)
    setCurrent(idx)
  }, [current])

  const next = useCallback(() => {
    goTo((current + 1) % animes.length)
  }, [current, animes.length, goTo])

  const anime = animes[current]
  const prevAnime = prev !== null ? animes[prev] : null

  useEffect(() => {
    if (paused || animes.length <= 1) return
    timerRef.current = setInterval(next, 6000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [paused, animes.length, next])

  return (
    <section
      className="hero-slider"
      aria-label="Animes destacados"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      <div className="hero-slides">
        {animes.map((a, i) => (
          <div
            key={a.id}
            className={`hero-slide${i === current ? ' hero-slide--active' : ''}${i === prev ? ' hero-slide--prev' : ''}`}
            aria-hidden={i !== current}
          >
            <div className="hero-slide-bg">
              <img
                src={a.banner_url || a.cover_url}
                alt=""
                className={`hero-slide-bg-img${!a.banner_url ? ' hero-slide-bg-img--cover' : ''}`}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Overlays */}
      <div className="hero-gradient-left" aria-hidden="true" />
      <div className="hero-gradient-bottom" aria-hidden="true" />
      <div className="hero-gradient-right" aria-hidden="true" />
      <div className="hero-noise" aria-hidden="true" />

      {/* Content */}
      <div className="hero-content container">
        <div className="hero-body" key={anime.id}>
          <div className="hero-genres">
            {anime.genres?.slice(0, 3).map((g, i) => (
              <span key={typeof g === 'string' ? g : g.id} className="hero-genre">
                {typeof g === 'string' ? g : g.name}
              </span>
            ))}
          </div>

          <h1 className="hero-title">{anime.title_es}</h1>
          {anime.title_jp && <p className="hero-title-jp">{anime.title_jp}</p>}

          <div className="hero-meta">
            {anime.mal_rating && (
              <span className="hero-meta-item hero-rating">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {anime.mal_rating.toFixed(1)}
              </span>
            )}
            {anime.year && <span className="hero-meta-item">{anime.year}</span>}
            {anime.status === 'en_emision' && (
              <span className="hero-meta-item hero-live">
                <span className="hero-live-dot" aria-hidden="true" />
                En emisión
              </span>
            )}
            {anime.total_episodes && (
              <span className="hero-meta-item">{anime.total_episodes} episodios</span>
            )}
          </div>

          {anime.synopsis && <p className="hero-synopsis">{anime.synopsis}</p>}

          <div className="hero-actions">
            <Link href={`/anime/${anime.slug}/episodio/1`} className="hero-btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Ver ahora
            </Link>
            <Link href={`/anime/${anime.slug}`} className="hero-btn-secondary">
              Más info
            </Link>
          </div>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="hero-thumbs">
        <div className="hero-thumbs-track">
          {animes.map((a, i) => (
            <button
              key={a.id}
              className={`hero-thumb${i === current ? ' hero-thumb--active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Ir a ${a.title_es}`}
            >
              <img src={a.cover_url} alt="" />
              <span className="hero-thumb-label">
                <span className="hero-thumb-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="hero-thumb-title">{a.title_es}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .hero-slider {
          position: relative;
          height: clamp(500px, 70vh, 720px);
          display: flex;
          align-items: flex-end;
          overflow: hidden;
          margin-top: calc(var(--total-nav) * -1);
          padding-top: var(--total-nav);
        }

        /* Slides */
        .hero-slides {
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        .hero-slide {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.8s ease, transform 0.8s ease;
          transform: scale(1.05);
        }
        .hero-slide--active {
          opacity: 1;
          transform: scale(1);
          z-index: 1;
        }
        .hero-slide--prev {
          opacity: 0;
          transform: scale(1);
        }
        .hero-slide-bg {
          position: absolute;
          inset: 0;
        }
        .hero-slide-bg-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 20%;
          filter: brightness(0.55);
        }
        .hero-slide-bg-img--cover {
          object-position: center top;
          filter: blur(3px) brightness(0.45);
          transform: scale(1.08);
        }

        /* Overlays */
        .hero-gradient-left {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(to right, rgba(10,10,15,0.92) 0%, rgba(10,10,15,0.5) 50%, transparent 80%);
        }
        .hero-gradient-right {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(to left, rgba(10,10,15,0.6) 0%, transparent 40%);
        }
        .hero-gradient-bottom {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(to top, var(--bg-base) 0%, rgba(10,10,15,0.3) 40%, transparent 70%);
        }
        .hero-noise {
          position: absolute;
          inset: 0;
          z-index: 1;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        /* Content */
        .hero-content {
          position: relative;
          z-index: 2;
          width: 100%;
          padding-bottom: 7rem;
        }
        .hero-body {
          max-width: 560px;
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
          animation: hero-fade-in 0.6s ease both;
        }

        @keyframes hero-fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Genres */
        .hero-genres {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }
        .hero-genre {
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-secondary);
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: var(--radius-full);
          padding: 0.2rem 0.65rem;
        }

        /* Title */
        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(2rem, 5vw, 3.25rem);
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.1;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 20px rgba(0,0,0,0.5);
          margin: 0;
        }
        .hero-title-jp {
          font-size: 0.9375rem;
          color: var(--text-muted);
          font-style: italic;
          margin: 0;
        }

        /* Meta */
        .hero-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .hero-meta-item {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .hero-rating { color: var(--amber); }
        .hero-live { color: #4ade80; }
        .hero-live-dot {
          width: 7px;
          height: 7px;
          background: #4ade80;
          border-radius: 50%;
          animation: pulse-accent 1.5s ease infinite;
        }

        /* Synopsis */
        .hero-synopsis {
          font-size: 0.9375rem;
          color: var(--text-secondary);
          line-height: 1.65;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          max-width: 480px;
          margin: 0;
        }

        /* Buttons */
        .hero-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.25rem;
        }
        .hero-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.75rem;
          background: var(--accent);
          color: #fff;
          font-family: var(--font-display);
          font-size: 0.9375rem;
          font-weight: 700;
          border-radius: var(--radius-md);
          text-decoration: none;
          transition: background var(--transition-fast), transform var(--transition-fast), box-shadow var(--transition-fast);
        }
        .hero-btn-primary:hover {
          background: var(--accent-dim);
          transform: translateY(-2px);
          box-shadow: var(--shadow-accent);
        }
        .hero-btn-secondary {
          display: inline-flex;
          align-items: center;
          padding: 0.75rem 1.5rem;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          color: var(--text-primary);
          font-family: var(--font-display);
          font-size: 0.9375rem;
          font-weight: 600;
          border-radius: var(--radius-md);
          text-decoration: none;
          backdrop-filter: blur(8px);
          transition: background var(--transition-fast), transform var(--transition-fast);
        }
        .hero-btn-secondary:hover {
          background: rgba(255,255,255,0.14);
          transform: translateY(-2px);
        }

        /* Thumbnails */
        .hero-thumbs {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 3;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hero-thumbs::-webkit-scrollbar { display: none; }
        .hero-thumbs-track {
          display: flex;
          gap: 0.5rem;
          padding: 0 calc((100% - 1280px) / 2 + 1rem) 1.5rem;
          min-width: min-content;
        }
        .hero-thumb {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          background: rgba(10,10,15,0.7);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          width: 240px;
          text-align: left;
          color: var(--text-primary);
        }
        .hero-thumb img {
          width: 40px;
          height: 56px;
          object-fit: cover;
          border-radius: var(--radius-sm);
          flex-shrink: 0;
        }
        .hero-thumb:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.2);
        }
        .hero-thumb--active {
          background: rgba(230,57,70,0.2);
          border-color: var(--accent);
        }
        .hero-thumb-label {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
        }
        .hero-thumb-num {
          font-family: var(--font-display);
          font-size: 0.625rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }
        .hero-thumb-title {
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .hero-slider { height: clamp(420px, 65vh, 560px); }
          .hero-gradient-left {
            background: linear-gradient(to right, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.7) 60%, rgba(10,10,15,0.4) 100%);
          }
          .hero-gradient-right { display: none; }
          .hero-synopsis { display: none; }
          .hero-body { max-width: 100%; gap: 0.625rem; }
          .hero-title { font-size: clamp(1.5rem, 6vw, 2rem); }
          .hero-content { padding-bottom: 6rem; }
          .hero-thumbs-track {
            padding: 0 1rem 1rem;
          }
          .hero-thumb { width: 180px; padding: 0.4rem; }
          .hero-thumb img { width: 32px; height: 45px; }
          .hero-thumb-title { font-size: 0.6875rem; }
          .hero-thumb-num { font-size: 0.5625rem; }
        }

        @media (max-width: 480px) {
          .hero-slider { height: clamp(380px, 60vh, 480px); }
          .hero-content { padding-bottom: 5rem; }
          .hero-thumb { width: 150px; }
          .hero-thumb img { width: 28px; height: 40px; }
          .hero-thumbs-track { padding: 0 0.75rem 0.75rem; gap: 0.35rem; }
        }
      `}</style>
    </section>
  )
}
