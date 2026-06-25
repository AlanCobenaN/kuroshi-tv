'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const LS_KEY = 'kuroshi_welcome_banner_dismissed'

export function WelcomeBanner() {
  const [visible, setVisible] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(LS_KEY)
    if (!dismissed) setVisible(true)
  }, [])

  const handleClose = () => {
    if (dontShowAgain) localStorage.setItem(LS_KEY, 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="wb-wrap">
      <div className="wb-card">
        <button onClick={handleClose} className="wb-close" aria-label="Cerrar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>

        <div className="wb-icon-wrap">
          <svg className="wb-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>

        <h2 className="wb-title">Kuroshi está creciendo</h2>

        <p className="wb-text">
          Estamos subiendo <strong>animes nuevos cada día</strong>.
          Si tienes alguna recomendación o quieres compartir tu opinión,
          puedes hacerlo en la sección de{' '}
          <Link href="/comunidades" className="wb-link" onClick={handleClose}>comunidades</Link>.
          ¡Tu feedback nos ayuda a mejorar!
        </p>

        <div className="wb-actions">
          <label className="wb-checkbox-label">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={e => setDontShowAgain(e.target.checked)}
              className="wb-checkbox"
            />
            <span className="wb-checkmark" />
            No mostrar de nuevo
          </label>

          <button onClick={handleClose} className="wb-btn">
            Entendido
          </button>
        </div>
      </div>

      <style>{`
        .wb-wrap {
          width: 100%;
          max-width: 680px;
          margin: 0 auto 1.5rem;
          animation: fadeIn 0.4s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .wb-card {
          position: relative;
          background: linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 1.75rem 2rem 1.5rem;
          box-shadow: 0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03);
          overflow: hidden;
        }
        .wb-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--accent), var(--amber), var(--accent));
          border-radius: var(--radius-xl) var(--radius-xl) 0 0;
        }
        .wb-close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 50%;
          color: var(--text-muted);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .wb-close:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .wb-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--accent-glow);
          margin-bottom: 1rem;
        }
        .wb-icon {
          color: var(--accent);
        }
        .wb-title {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 0.5rem;
        }
        .wb-text {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: var(--text-secondary);
          margin: 0 0 1.25rem;
          max-width: 520px;
        }
        .wb-link {
          color: var(--accent);
          text-decoration: none;
          font-weight: 600;
        }
        .wb-link:hover {
          text-decoration: underline;
        }
        .wb-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .wb-checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.8125rem;
          color: var(--text-muted);
          user-select: none;
          transition: color var(--transition-fast);
        }
        .wb-checkbox-label:hover {
          color: var(--text-secondary);
        }
        .wb-checkbox {
          display: none;
        }
        .wb-checkmark {
          width: 16px;
          height: 16px;
          border: 2px solid var(--text-muted);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }
        .wb-checkbox:checked + .wb-checkmark {
          background: var(--accent);
          border-color: var(--accent);
        }
        .wb-checkbox:checked + .wb-checkmark::after {
          content: '';
          width: 5px;
          height: 9px;
          border: solid #fff;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
          margin-top: -1px;
        }
        .wb-btn {
          padding: 0.5rem 1.5rem;
          background: var(--accent);
          color: #fff;
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 700;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background var(--transition-fast);
        }
        .wb-btn:hover {
          background: var(--accent-dim);
        }
        @media (max-width: 640px) {
          .wb-card { padding: 1.25rem 1.25rem 1rem; }
          .wb-title { font-size: 1.1rem; }
          .wb-text { font-size: 0.875rem; }
          .wb-actions { flex-direction: column-reverse; align-items: stretch; }
          .wb-btn { width: 100%; text-align: center; }
          .wb-checkbox-label { justify-content: center; }
        }
      `}</style>
    </div>
  )
}
