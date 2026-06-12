'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authApi } from '@/lib/api'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token no proporcionado.')
      return
    }

    authApi.confirmResetPassword(token)
      .then((res: any) => {
        setStatus('success')
        setMessage(res.message ?? 'Te hemos enviado una contraseña temporal a tu correo.')
      })
      .catch((err: any) => {
        const msg = err?.message ?? ''
        if (msg.toLowerCase().includes('expirado')) {
          setStatus('expired')
          setMessage('El token ha expirado. Solicita uno nuevo.')
        } else {
          setStatus('error')
          setMessage(msg || 'Error al confirmar el cambio de contraseña.')
        }
      })
  }, [token, router])

  return (
    <div className="reset-page">
      <div className={`reset-card reset-card--${status}`}>
        {status === 'loading' && (
          <>
            <div className="reset-spinner" />
            <h1 className="reset-title">Confirmando cambio de contraseña...</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="reset-icon reset-icon--success">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1 className="reset-title">Contraseña restablecida</h1>
            <p className="reset-message">{message}</p>
            <p className="reset-hint">Revisa tu bandeja de entrada. Luego inicia sesión con la contraseña temporal.</p>
            <Link href="/login" className="reset-btn">Ir a iniciar sesión</Link>
          </>
        )}

        {status === 'expired' && (
          <>
            <div className="reset-icon reset-icon--expired">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h1 className="reset-title">Token expirado</h1>
            <p className="reset-message">{message}</p>
            <Link href="/login" className="reset-btn">Solicitar de nuevo</Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="reset-icon reset-icon--error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 className="reset-title">Error</h1>
            <p className="reset-message">{message || 'Ocurrió un error al confirmar el cambio de contraseña.'}</p>
            <Link href="/login" className="reset-btn">Volver a inicio de sesión</Link>
          </>
        )}
      </div>

      <style>{`
        .reset-page {
          min-height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .reset-card {
          max-width: 420px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 2.5rem 2rem;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          text-align: center;
        }
        .reset-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(230,57,70,0.2);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .reset-title {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }
        .reset-message {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.6;
        }
        .reset-hint {
          font-size: 0.8125rem;
          color: var(--text-muted);
          margin: 0;
        }
        .reset-btn {
          display: inline-block;
          padding: 0.625rem 1.5rem;
          background: var(--accent);
          color: #fff;
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 700;
          border-radius: var(--radius-md);
          text-decoration: none;
          transition: background var(--transition-fast);
        }
        .reset-btn:hover { background: var(--accent-dim); }
        .reset-icon { line-height: 0; }
        .reset-icon--success { color: #4ade80; }
        .reset-icon--expired { color: #fbbf24; }
        .reset-icon--error { color: var(--accent); }
      `}</style>
    </div>
  )
}
