'use client'
// app/anime/[slug]/not-found.tsx
import Link from 'next/link'

export default function AnimeNotFound() {
  return (
    <div className="notfound">
      <span className="notfound-icon" aria-hidden="true">404</span>
      <h1 className="notfound-title">Anime no encontrado</h1>
      <p className="notfound-sub">
        El anime que buscas no existe o fue eliminado del catálogo.
      </p>
      <Link href="/anime" className="btn-primary">
        Explorar catálogo
      </Link>

      <style>{`
        .notfound {
          min-height: 60vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          text-align: center;
          padding: 2rem;
        }
        .notfound-icon {
          font-family: var(--font-display);
          font-size: 5rem;
          font-weight: 800;
          color: var(--bg-elevated);
          letter-spacing: -0.05em;
          line-height: 1;
        }
        .notfound-title {
          font-family: var(--font-display);
          font-size: 1.5rem;
          color: var(--text-primary);
          margin: 0;
        }
        .notfound-sub {
          color: var(--text-muted);
          font-size: 0.9375rem;
          max-width: 360px;
          margin: 0;
        }
      `}</style>
    </div>
  )
}
