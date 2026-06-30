import type { Metadata } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Ponte en contacto con el equipo de Kuroshi.lat.',
  alternates: { canonical: '/contacto' },
  openGraph: {
    title: 'Contacto | Kuroshi.lat',
    description: 'Ponte en contacto con el equipo de Kuroshi.lat.',
    url: `${BASE_URL}/contacto`,
  },
}

export default function ContactoPage() {
  return (
    <div className="legal-page">
      <article className="legal-container">
        <h1 className="legal-title">Contacto</h1>
        <p className="legal-date">Estamos aquí para ayudarte</p>

        <section className="legal-section">
          <h2>¿Cómo podemos ayudarte?</h2>
          <p>
            Si necesitas reportar un problema, enviar una notificación DMCA o tienes
            alguna pregunta, puedes contactarnos a través de los siguientes canales:
          </p>
        </section>

        <div className="contact-cards">
          <div className="contact-card">
            <div className="contact-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <h3 className="contact-card-title">DMCA / Derechos de Autor</h3>
            <p className="contact-card-text">
              Para reportar infracción de derechos de autor, envía un correo a:
            </p>
            <a href="mailto:dmca@kuroshi.lat" className="contact-card-link">dmca@kuroshi.lat</a>
          </div>

          <div className="contact-card">
            <div className="contact-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="contact-card-title">Soporte General</h3>
            <p className="contact-card-text">
              ¿Problemas con tu cuenta, reportes de bug o sugerencias?
            </p>
            <a href="mailto:support@kuroshi.lat" className="contact-card-link">support@kuroshi.lat</a>
          </div>

          <div className="contact-card">
            <div className="contact-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10h-10V2z" />
                <path d="M22 12a10 10 0 0 0-10-10v10h10z" />
              </svg>
            </div>
            <h3 className="contact-card-title">Privacidad</h3>
            <p className="contact-card-text">
              Para ejercer tus derechos de privacidad (acceso, rectificación, eliminación):
            </p>
            <a href="mailto:privacidad@kuroshi.lat" className="contact-card-link">privacidad@kuroshi.lat</a>
          </div>
        </div>

        <section className="legal-section">
          <h2>Tiempo de Respuesta</h2>
          <p>
            Nos esforzamos por responder a todas las consultas dentro de las 24 a 72 horas
            hábiles. Para asuntos DMCA, el tiempo de respuesta es prioritario.
          </p>
        </section>
      </article>

      <style>{`
        .legal-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 3rem 1.5rem 5rem;
        }

        .legal-container {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .legal-title {
          font-family: var(--font-syne);
          font-size: clamp(1.5rem, 3vw, 2rem);
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.2;
        }

        .legal-date {
          font-size: 0.8125rem;
          color: var(--text-muted);
          margin: -1rem 0 0;
        }

        .legal-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .legal-section h2 {
          font-family: var(--font-syne);
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .legal-section p {
          font-size: 0.9375rem;
          color: var(--text-secondary);
          line-height: 1.75;
          margin: 0;
        }

        .contact-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
        }

        .contact-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .contact-card-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-overlay);
          border-radius: var(--radius-md);
          color: var(--accent);
        }

        .contact-card-title {
          font-family: var(--font-syne);
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .contact-card-text {
          font-size: 0.875rem;
          color: var(--text-muted);
          line-height: 1.5;
          margin: 0;
        }

        .contact-card-link {
          font-family: var(--font-syne);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--accent);
          text-decoration: none;
          padding: 0.5rem 0.75rem;
          background: var(--accent-glow);
          border-radius: var(--radius-md);
          text-align: center;
          transition: background var(--transition-fast);
        }
        .contact-card-link:hover {
          background: rgba(230, 57, 70, 0.2);
        }

        @media (max-width: 640px) {
          .legal-page { padding: 2rem 1rem 4rem; }
          .contact-cards { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
