// app/not-found.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '404 — Página no encontrada',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="notfound-page">
      <div className="notfound-content">
        <span className="notfound-code" aria-hidden="true">404</span>
        <h1 className="notfound-title">Página no encontrada</h1>
        <p className="notfound-sub">
          La página que buscas no existe o fue movida.
        </p>
        <div className="notfound-actions">
          <Link href="/" className="btn-primary">
            Volver al inicio
          </Link>
          <Link href="/anime" className="btn-secondary">
            Ver catálogo
          </Link>
        </div>
      </div>

      <style>{`
        .notfound-page {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .notfound-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          text-align: center;
          animation: fade-in 0.4s ease;
        }
        .notfound-code {
          font-family: var(--font-display);
          font-size: clamp(5rem, 15vw, 9rem);
          font-weight: 800;
          color: var(--bg-elevated);
          letter-spacing: -0.05em;
          line-height: 1;
          /* Borde del texto para que se vea como contorno */
          -webkit-text-stroke: 2px var(--border-hover);
        }
        .notfound-title {
          font-family: var(--font-display);
          font-size: clamp(1.25rem, 3vw, 1.75rem);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .notfound-sub {
          font-size: 0.9375rem;
          color: var(--text-muted);
          max-width: 320px;
          margin: 0;
          line-height: 1.6;
        }
        .notfound-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  )
}
