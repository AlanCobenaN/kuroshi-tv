import Link from 'next/link'

export function MaintenancePage({ message }: { message?: string }) {
  return (
    <div className="maintenance-page">
      <div className="maintenance-corner">
        <Link href="/login" className="maintenance-login-btn">
          Iniciar sesión
        </Link>
      </div>
      <div className="maintenance-card">
        <div className="maintenance-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>
        <h1 className="maintenance-title">En Mantenimiento</h1>
        <p className="maintenance-desc">
          {message ?? 'Estamos realizando mejoras en Kuroshi.lat. Volvemos en unos momentos.'}
        </p>
        <div className="maintenance-dots">
          <span className="dot" /><span className="dot" /><span className="dot" />
        </div>
      </div>

      <style>{`
        .maintenance-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: var(--bg-primary);
          padding: 2rem;
          position: relative;
        }
        .maintenance-corner {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 100;
        }
        .maintenance-login-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--accent);
          background: transparent;
          border: 1px solid var(--border-color, #333);
          border-radius: 8px;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.2s, border-color 0.2s;
        }
        .maintenance-login-btn:hover {
          background: var(--accent);
          color: #fff;
          border-color: var(--accent);
        }
        .maintenance-card {
          text-align: center;
          max-width: 420px;
        }
        .maintenance-icon {
          color: var(--accent);
          margin-bottom: 1.5rem;
          opacity: 0.8;
        }
        .maintenance-title {
          font-family: var(--font-display, var(--font-syne));
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0 0 0.75rem;
        }
        .maintenance-desc {
          font-size: 1rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin: 0 0 2rem;
        }
        .maintenance-dots {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
