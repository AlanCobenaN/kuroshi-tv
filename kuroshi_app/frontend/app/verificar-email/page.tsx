'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authApi } from '@/lib/api'
import Link from 'next/link'

export default function VerificarEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token de verificación no proporcionado.')
      return
    }

    authApi.verifyEmail(token)
      .then((res: any) => {
        setStatus('success')
        setMessage(res.message ?? 'Email verificado exitosamente')
        setTimeout(() => router.push('/configuracion'), 3000)
      })
      .catch((err: any) => {
        const msg = err?.message ?? ''
        if (msg.toLowerCase().includes('expirado')) {
          setStatus('expired')
          setMessage('El token de verificación ha expirado.')
        } else {
          setStatus('error')
          setMessage(msg || 'Error al verificar el email.')
        }
      })
  }, [token, router])

  return (
    <div className="verify-page">
      <div className={`verify-card verify-card--${status}`}>
        {status === 'loading' && (
          <>
            <div className="verify-spinner" />
            <h1 className="verify-title">Verificando tu email...</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="verify-icon verify-icon--success">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1 className="verify-title">Email verificado</h1>
            <p className="verify-message">{message}</p>
            <p className="verify-redirect">Redirigiendo a configuración...</p>
            <Link href="/configuracion" className="verify-btn">Ir a configuración</Link>
          </>
        )}

        {status === 'expired' && (
          <>
            <div className="verify-icon verify-icon--expired">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h1 className="verify-title">Token expirado</h1>
            <p className="verify-message">{message}</p>
            <p className="verify-hint">Ve a configuración para solicitar un nuevo enlace de verificación.</p>
            <Link href="/configuracion" className="verify-btn">Ir a configuración</Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="verify-icon verify-icon--error">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 className="verify-title">Error</h1>
            <p className="verify-message">{message || 'Ocurrió un error al verificar tu email.'}</p>
            <Link href="/configuracion" className="verify-btn">Ir a configuración</Link>
          </>
        )}
      </div>

      <style>{`
        .verify-page {
          min-height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .verify-card {
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
        .verify-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(230,57,70,0.2);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .verify-title {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }
        .verify-message {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.6;
        }
        .verify-redirect {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: 0;
        }
        .verify-hint {
          font-size: 0.8125rem;
          color: var(--text-muted);
          margin: 0;
        }
        .verify-btn {
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
        .verify-btn:hover { background: var(--accent-dim); }
        .verify-icon { line-height: 0; }
        .verify-icon--success { color: #4ade80; }
        .verify-icon--expired { color: #fbbf24; }
        .verify-icon--error { color: var(--accent); }
      `}</style>
    </div>
  )
}
