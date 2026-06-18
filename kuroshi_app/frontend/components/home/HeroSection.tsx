'use client'
// components/home/HeroSection.tsx
import Link from 'next/link'
import { Anime } from '@/types'

interface Props {
  anime: Anime & { synopsis?: string }
}

export function HeroSection({ anime }: Props) {
  return (
    <section className="hero" aria-label="Anime destacado">
      {/* Banner a sangre */}
      <div className="hero-bg">
        <img
          src={anime.banner_url || anime.cover_url}
          alt=""
          className={`hero-bg-img${!anime.banner_url ? ' hero-bg-img--cover' : ''}`}
          aria-hidden="true"
        />
        {/* Gradientes superpuestos */}
        <div className="hero-gradient-left"  aria-hidden="true" />
        <div className="hero-gradient-bottom" aria-hidden="true" />
        <div className="hero-noise"           aria-hidden="true" />
      </div>

      {/* Contenido */}
      <div className="hero-content container">
        <div className="hero-body">
          {/* Géneros */}
          <div className="hero-genres">
            {anime.genres?.slice(0, 3).map((g, i) => (
              <span key={typeof g === 'string' ? g : g.id} className="hero-genre">{typeof g === 'string' ? g : g.name}</span>
            ))}
          </div>

          {/* Título */}
          <h1 className="hero-title">{anime.title_es}</h1>
          {anime.title_jp && (
            <p className="hero-title-jp">{anime.title_jp}</p>
          )}

          {/* Meta */}
          <div className="hero-meta">
            {anime.mal_rating && (
              <span className="hero-meta-item hero-rating">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {anime.mal_rating.toFixed(1)} MAL
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

          {/* Sinopsis */}
          {anime.synopsis && (
            <p className="hero-synopsis">{anime.synopsis}</p>
          )}

          {/* CTAs */}
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

      <style>{`
        .hero {
          position: relative;
          height: clamp(480px, 65vh, 680px);
          display: flex;
          align-items: flex-end;
          overflow: hidden;
          /* Compensa el nav fijo */
          margin-top: calc(var(--total-nav) * -1);
          padding-top: var(--total-nav);
        }

        /* Imagen de fondo */
        .hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        .hero-bg-img {
          object-fit: cover;
          object-position: center 20%;
          filter: brightness(0.6);
        }
        .hero-bg-img--cover {
          object-position: center top;
          filter: blur(2px) brightness(0.45);
          transform: scale(1.08);
        }

        /* Gradientes de legibilidad */
        .hero-gradient-left {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to right,
            rgba(10, 10, 15, 0.92) 0%,
            rgba(10, 10, 15, 0.6) 45%,
            transparent 75%
          );
        }
        .hero-gradient-bottom {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            var(--bg-base) 0%,
            rgba(10, 10, 15, 0.4) 30%,
            transparent 70%
          );
        }
        /* Textura sutil de ruido */
        .hero-noise {
          position: absolute;
          inset: 0;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
        }

        /* Contenido */
        .hero-content {
          position: relative;
          z-index: 1;
          width: 100%;
          padding-bottom: 3.5rem;
        }

        .hero-body {
          max-width: 560px;
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
          animation: fade-in 0.6s ease both;
        }

        /* Géneros */
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
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-full);
          padding: 0.2rem 0.65rem;
        }

        /* Título */
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
        .hero-live {
          color: #4ade80;
        }
        .hero-live-dot {
          width: 7px;
          height: 7px;
          background: #4ade80;
          border-radius: 50%;
          animation: pulse-accent 1.5s ease infinite;
        }

        /* Sinopsis */
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

        /* Botones */
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

        @media (max-width: 640px) {
          .hero { height: clamp(400px, 70vh, 540px); }
          .hero-synopsis { display: none; }
          .hero-body { gap: 0.625rem; }
        }
      `}</style>
    </section>
  )
}
