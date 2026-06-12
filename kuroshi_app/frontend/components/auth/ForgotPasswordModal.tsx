'use client'
import { useState } from 'react'
import { authApi } from '@/lib/api'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function ForgotPasswordModal({ isOpen, onClose }: Props) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError('')
    try {
      await authApi.forgotPassword(email.trim())
      setSent(true)
    } catch (err: any) {
      setError(err?.message ?? 'Error al enviar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <h2 className="modal-title">¿Olvidaste tu contraseña?</h2>

        {sent ? (
          <p className="modal-success">
            Si el email existe, recibirás un correo con instrucciones para cambiar tu contraseña. Revisa tu bandeja de entrada.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <p className="modal-desc">
              Ingresa el email vinculado a tu cuenta. Te enviaremos un correo de confirmación.
            </p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="input"
              required
              autoFocus
              disabled={loading}
            />
            {error && <p className="modal-error">{error}</p>}
            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={loading || !email.trim()}>
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>
        )}

        <style>{`
          .modal-overlay {
            position: fixed; inset: 0; z-index: 1000;
            display: flex; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.6);
            animation: fadeIn 0.2s ease;
          }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .modal-card {
            position: relative;
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-xl);
            padding: 2rem;
            width: 90%; max-width: 400px;
            animation: slideUp 0.25s ease;
          }
          @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          .modal-close {
            position: absolute; top: 0.75rem; right: 0.75rem;
            background: none; border: none; cursor: pointer;
            color: var(--text-muted); padding: 0.25rem;
            transition: color var(--transition-fast);
          }
          .modal-close:hover { color: var(--text-primary); }
          .modal-title {
            font-family: var(--font-display); font-size: 1.25rem; font-weight: 700;
            color: var(--text-primary); margin: 0 0 1rem;
          }
          .modal-desc {
            font-size: 0.875rem; color: var(--text-secondary); margin: 0 0 1rem;
            line-height: 1.5;
          }
          .modal-form { display: flex; flex-direction: column; gap: 0.75rem; }
          .modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem; }
          .modal-error { color: var(--accent); font-size: 0.8125rem; margin: 0; }
          .modal-success { color: var(--success, #22c55e); font-size: 0.875rem; line-height: 1.5; margin: 0; }
          .btn-secondary {
            padding: 0.5rem 1rem; font-size: 0.8125rem;
            font-family: var(--font-display); font-weight: 600;
            border-radius: var(--radius-md); cursor: pointer;
            border: 1px solid var(--border);
            background: var(--bg-overlay); color: var(--text-secondary);
            transition: all var(--transition-fast);
          }
          .btn-secondary:hover { border-color: var(--border-hover); color: var(--text-primary); }
          .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
        `}</style>
      </div>
    </div>
  )
}
