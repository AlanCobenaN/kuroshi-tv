'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Anime } from '@/types'

interface Props {
  animes: (Anime & { synopsis?: string })[]
}

export function HeroSection({ animes }: Props) {
  const items = animes.slice(0, 5)
  const [current, setCurrent] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [direction, setDirection] = useState(1)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const INTERVAL = 6000
  const TICK = 50

  const goTo = useCallback((idx: number) => {
    if (idx === current) return
    const forward = idx > current || (current === items.length - 1 && idx === 0)
    setDirection(forward ? 1 : -1)
    setPrev(current)
    setCurrent(idx)
    setProgress(0)
  }, [current, items.length])

  const next = useCallback(() => {
    goTo((current + 1) % items.length)
  }, [current, items.length, goTo])

  useEffect(() => {
    setProgress(0)
    if (items.length <= 1) return
    timerRef.current = setInterval(next, INTERVAL)
    progressRef.current = setInterval(() => {
      setProgress(p => Math.min(p + (TICK / INTERVAL) * 100, 100))
    }, TICK)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [items.length, next, current])

  const anime = items[current]

  return (
    <section
      className="hero"
      aria-label="Animes destacados"
    >
      {/* Progress bar */}
      <div className="hero-progress" aria-hidden="true">
        <div className="hero-progress-track">
          {items.map((_, i) => (
            <div key={i} className="hero-progress-segment">
              <div
                className="hero-progress-fill"
                style={{
                  width: i < current ? '100%' : i === current ? `${progress}%` : '0%',
                  transition: i === current ? 'width 50ms linear' : 'none',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Slides — carousel horizontal */}
      <div className="hero-slides">
        {items.map((a, i) => {
          let transform: string
          let zIndex: number
          const isActive = i === current
          const isPrev = i === prev

          if (isActive) {
            transform = 'translateX(0)'
            zIndex = 2
          } else if (isPrev) {
            transform = `translateX(${-direction * 100}%)`
            zIndex = 1
          } else {
            transform = `translateX(${direction * 100}%)`
            zIndex = 0
          }

          return (
            <div
              key={a.id}
              className="hero-slide"
              aria-hidden={!isActive}
              style={{
                transform,
                zIndex,
                transition: isActive || isPrev ? 'transform 0.8s cubic-bezier(0.65, 0, 0.35, 1)' : 'none',
              }}
            >
              <div className="hero-slide-bg">
                <img
                  src={a.banner_url || a.cover_url}
                  alt=""
                  className={`hero-slide-bg-img${!a.banner_url ? ' hero-slide-bg-img--cover' : ''}`}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </div>
              {isActive && <div className="hero-slide-sweep" aria-hidden="true" />}
            </div>
          )
        })}
      </div>

      {/* Overlays */}
      <div className="hero-gradient-left" aria-hidden="true" />
      <div className="hero-gradient-right" aria-hidden="true" />
      <div className="hero-gradient-bottom" aria-hidden="true" />
      <div className="hero-noise" aria-hidden="true" />

      {/* Content + Cards */}
      <div className="hero-inner container">
        <div
          className="hero-body"
          key={anime.id}
        >
          <div className="hero-genres">
            {anime.genres?.slice(0, 3).map((g, i) => (
              <span key={typeof g === 'string' ? g : g.id} className="hero-genre" style={{ animationDelay: `${i * 0.08}s` }}>
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

        <div className="hero-cards">
          <div className="hero-cards-track">
            {items.map((a, i) => (
              <button
                key={a.id}
                className={`hero-card${i === current ? ' hero-card--active' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Ir a ${a.title_es}`}
              >
                <img src={a.cover_url} alt="" className="hero-card-img" loading="lazy" />
                <div className="hero-card-overlay" aria-hidden="true" />
                <span className="hero-card-title">{a.title_es}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        /* ── Container ── */
        .hero {
          position: relative;
          height: clamp(560px, 85vh, 860px);
          display: flex;
          align-items: center;
          overflow: hidden;
          margin-top: calc(var(--total-nav) * -1);
          padding-top: var(--total-nav);
        }

        /* ── Progress bar ── */
        .hero-progress {
          position: absolute;
          top: calc(var(--total-nav) + 0px);
          left: 0;
          right: 0;
          z-index: 10;
          padding: 0 1rem;
        }
        .hero-progress-track {
          display: flex;
          gap: 4px;
          max-width: 1280px;
          margin: 0 auto;
        }
        .hero-progress-segment {
          flex: 1;
          height: 3px;
          background: rgba(255,255,255,0.15);
          border-radius: 2px;
          overflow: hidden;
        }
        .hero-progress-fill {
          height: 100%;
          background: var(--accent);
          border-radius: 2px;
          transition: width 50ms linear;
        }

        /* ── Slides (carousel horizontal) ── */
        .hero-slides {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
        }
        .hero-slide {
          position: absolute;
          inset: 0;
          will-change: transform;
        }
        .hero-slide-bg {
          position: absolute;
          inset: -5%;
        }
        .hero-slide-bg-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 20%;
          filter: brightness(0.5);
          transform: scale(1.12);
          transition: transform 8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .hero-slide-bg-img--cover {
          object-position: center top;
          filter: blur(4px) brightness(0.4);
          transform: scale(1.15);
        }
        .hero-slide:nth-child(2) .hero-slide-bg-img { transition-delay: 0.1s; }

        /* Ken Burns zoom on active slide */
        .hero-slide[style*="translateX(0)"] .hero-slide-bg-img {
          transform: scale(1);
        }

        /* Sweep overlay on active slide entrance */
        .hero-slide-sweep {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: var(--bg-base);
          pointer-events: none;
          animation: hero-sweep 1.2s cubic-bezier(0.77, 0, 0.18, 1) forwards;
        }
        @keyframes hero-sweep {
          0%   { opacity: 0.5; clip-path: inset(0 100% 0 0); }
          40%  { opacity: 0.15; clip-path: inset(0 0% 0 0); }
          100% { opacity: 0; clip-path: inset(0 0% 0 0); }
        }

        /* Content stagger */
        @keyframes hero-stagger {
          from { opacity: 0; transform: translateY(24px); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        /* ── Gradients ── */
        .hero-gradient-left {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(to right, rgba(10,10,15,0.93) 0%, rgba(10,10,15,0.5) 45%, transparent 75%);
        }
        .hero-gradient-right {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(to left, rgba(10,10,15,0.5) 0%, transparent 35%);
        }
        .hero-gradient-bottom {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(to top, var(--bg-base) 0%, rgba(10,10,15,0.2) 35%, transparent 65%);
        }
        .hero-noise {
          position: absolute;
          inset: 0;
          z-index: 1;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        /* ── Inner (content + cards row) ── */
        .hero-inner {
          position: relative;
          z-index: 2;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
        }

        /* ── Content (left side) ── */
        .hero-body {
          max-width: 580px;
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }
        .hero-body > * {
          animation: hero-stagger 0.5s ease both;
        }
        .hero-genres  { animation-delay: 0s; }
        .hero-title   { animation-delay: 0.1s; }
        .hero-title-jp{ animation-delay: 0.15s; }
        .hero-meta    { animation-delay: 0.2s; }
        .hero-synopsis{ animation-delay: 0.3s; }
        .hero-actions { animation-delay: 0.4s; }

        @keyframes hero-stagger {
          from { opacity: 0; transform: translateY(20px); }
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
          padding: 0.25rem 0.7rem;
        }

        /* Title */
        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.08;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 24px rgba(0,0,0,0.6);
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-word;
        }
        .hero-title-jp {
          font-size: 0.9375rem;
          color: var(--text-muted);
          font-style: italic;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
          padding: 0.8rem 2rem;
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
          padding: 0.8rem 1.5rem;
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

        /* ── Thumbnail cards (right side, grid 3 cols → 2 rows) ── */
        .hero-cards {
          flex-shrink: 0;
          transform: translate(30px, 50px);
        }
        .hero-cards-track {
          display: grid;
          grid-template-columns: repeat(3, 110px);
          grid-template-rows: auto auto;
          gap: 0.5rem;
        }
        .hero-card:nth-child(1) { grid-row: 1; grid-column: 2; }
        .hero-card:nth-child(2) { grid-row: 1; grid-column: 1; }
        .hero-card:nth-child(3) { grid-row: 2; grid-column: 1; }
        .hero-card:nth-child(4) { grid-row: 2; grid-column: 2; }
        .hero-card:nth-child(5) { grid-row: 2; grid-column: 3; }
        .hero-card {
          position: relative;
          aspect-ratio: 1 / 1;
          border-radius: var(--radius-md);
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          background: var(--bg-elevated);
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0;
          text-align: left;
          color: var(--text-primary);
          animation: card-enter 0.5s ease both;
        }
        .hero-card:nth-child(2) { animation-delay: 0.05s; }
        .hero-card:nth-child(1) { animation-delay: 0.1s; }
        .hero-card:nth-child(5) { animation-delay: 0.15s; }
        .hero-card:nth-child(4) { animation-delay: 0.2s; }
        .hero-card:nth-child(3) { animation-delay: 0.25s; }
        @keyframes card-enter {
          from { opacity: 0; transform: translateX(120px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .hero-card-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .hero-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.15) 45%, transparent 70%);
          transition: opacity 0.3s ease;
        }
        .hero-card-title {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 1rem 0.6rem 0.6rem;
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 700;
          line-height: 1.25;
          color: #fff;
          text-shadow: 0 2px 12px rgba(0,0,0,0.9);
          z-index: 1;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-word;
        }
        .hero-card:hover {
          transform: scale(1.05);
          z-index: 2;
        }
        .hero-card:hover .hero-card-img {
          transform: scale(1.12);
        }
        .hero-card--active {
          border-color: var(--accent);
          box-shadow: 0 0 24px rgba(230,57,70,0.3), 0 8px 32px rgba(0,0,0,0.5);
          transform: scale(1.05);
        }
        .hero-card--active .hero-card-img {
          transform: scale(1.1);
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .hero-cards { transform: translate(20px, 35px); }
          .hero-cards-track { grid-template-columns: repeat(3, 95px); gap: 0.4rem; }
          .hero-card-title { font-size: 0.6rem; padding: 0.6rem 0.4rem 0.4rem; }
        }
        @media (max-width: 768px) {
          .hero { height: clamp(480px, 75vh, 620px); }
          .hero-gradient-left {
            background: linear-gradient(to right, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0.7) 60%, rgba(10,10,15,0.4) 100%);
          }
          .hero-gradient-right { display: none; }
          .hero-synopsis { display: none; }
          .hero-body { max-width: 100%; }
          .hero-title { font-size: clamp(1.5rem, 6vw, 2rem); }
          .hero-inner { gap: 1.25rem; }
        }
        @media (max-width: 640px) {
          .hero { height: clamp(440px, 75vh, 560px); }
          .hero-cards { transform: translate(12px, 20px); }
          .hero-cards-track { grid-template-columns: repeat(3, 80px); gap: 0.35rem; }
          .hero-card-title { font-size: 0.5rem; padding: 0.4rem 0.25rem 0.25rem; }
          .hero-progress { padding: 0 0.5rem; }
          .hero-progress-segment { height: 2px; }
          .hero-inner { gap: 0.75rem; }
        }
        @media (max-width: 480px) {
          .hero-cards { transform: translate(8px, 14px); }
          .hero-cards-track { grid-template-columns: repeat(3, 70px); gap: 0.3rem; }
          .hero-card-title { font-size: 0.4375rem; padding: 0.3rem 0.2rem 0.2rem; }
        }
      `}</style>
    </section>
  )
}
