'use client'
// components/layout/Footer.tsx
import Link from 'next/link'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="kuroshi-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">
            <span style={{ color: 'var(--text-primary)' }}>kuro</span>
            <span style={{ color: 'var(--accent)' }}>shi</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 400 }}>.lat</span>
          </span>
          <p className="footer-tagline">
            Anime + comunidad, todo en un lugar.
          </p>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <h4 className="footer-col-title">Contenido</h4>
            <Link href="/anime" className="footer-link">Catálogo</Link>
            <Link href="/anime?status=en_emision" className="footer-link">En emisión</Link>
            <Link href="/anime?order=rating" className="footer-link">Mejor valorados</Link>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Comunidad</h4>
            <Link href="/comunidades" className="footer-link">Explorar</Link>
            <Link href="/comunidades?type=oficial" className="footer-link">Oficiales</Link>
          </div>
          <div className="footer-col">
            <h4 className="footer-col-title">Cuenta</h4>
            <Link href="/registro" className="footer-link">Registrarse</Link>
            <Link href="/login" className="footer-link">Iniciar sesión</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copy">
          © {year} Kuroshi.lat — Hecho para la comunidad otaku latinoamericana
        </p>
        <p className="footer-disclaimer">
          Kuroshi.lat no almacena videos. Todo el contenido pertenece a sus respectivos titulares.
        </p>
      </div>

      <style>{`
        .kuroshi-footer {
          border-top: 1px solid var(--border);
          background: var(--bg-surface);
          margin-top: 4rem;
        }

        .footer-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 2.5rem 2rem;
          display: flex;
          gap: 3rem;
          flex-wrap: wrap;
          justify-content: space-between;
        }

        .footer-brand {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .footer-logo {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .footer-tagline {
          font-size: 0.8125rem;
          color: var(--text-muted);
          max-width: 200px;
        }

        .footer-links {
          display: flex;
          gap: 3rem;
          flex-wrap: wrap;
        }

        .footer-col {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .footer-col-title {
          font-family: var(--font-display);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 0.25rem;
        }

        .footer-link {
          font-size: 0.875rem;
          color: var(--text-secondary);
          text-decoration: none;
          transition: color var(--transition-fast);
        }
        .footer-link:hover { color: var(--text-primary); }

        .footer-bottom {
          border-top: 1px solid var(--border);
          max-width: 1280px;
          margin: 0 auto;
          padding: 1rem 2rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: space-between;
          align-items: center;
        }

        .footer-copy,
        .footer-disclaimer {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        @media (max-width: 640px) {
          .footer-inner { padding: 2rem 1rem; gap: 2rem; }
          .footer-links { gap: 2rem; }
          .footer-bottom { padding: 1rem; flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </footer>
  )
}
