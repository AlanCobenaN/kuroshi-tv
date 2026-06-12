'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const error = searchParams.get('error')
  const linked = searchParams.get('linked')
  const created = searchParams.get('created')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      return
    }

    signIn('kuroshi', { token, redirect: false }).then(result => {
      if (result?.ok) {
        setStatus('success')
        setTimeout(() => {
          const params = new URLSearchParams()
          if (linked) params.set('linked', linked)
          if (created) params.set('created', '1')
          const qs = params.toString()
          router.push(qs ? `/?${qs}` : '/')
        }, 1500)
      } else {
        setStatus('error')
      }
    })
  }, [token, router, linked, created])

  if (error === 'email_exists') {
    return (
      <div className="callback-container">
        <div className="callback-card">
          <h1>Email ya registrado</h1>
          <p>Este email ya está vinculado a una cuenta con contraseña. Iniciá sesión con tu email y contraseña.</p>
          <Link href="/login" className="btn-primary">Ir a iniciar sesión</Link>
        </div>
        <style>{`
          .callback-container { min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
          .callback-card { max-width: 400px; text-align: center; display: flex; flex-direction: column; gap: 1rem; }
          .callback-card h1 { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0; }
          .callback-card p { color: var(--text-secondary); line-height: 1.6; margin: 0; }
        `}</style>
      </div>
    )
  }

  const linkedLabel = linked === 'google' ? 'Google' : linked === 'discord' ? 'Discord' : null

  return (
    <div className="callback-container">
      <div className="callback-card">
        {status === 'loading' && (
          <>
            <div className="callback-spinner" />
            <p>Completando inicio de sesión...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="callback-check" />
            {created ? (
              <p>Cuenta creada exitosamente. Bienvenido.</p>
            ) : linked ? (
              <p>Se vinculó {linkedLabel} a tu cuenta existente.</p>
            ) : (
              <p>Inicio de sesión exitoso. Redirigiendo...</p>
            )}
          </>
        )}
        {status === 'error' && (
          <>
            <h1>Error al iniciar sesión</h1>
            <p>No se pudo completar el inicio de sesión. Intentalo de nuevo.</p>
            <Link href="/login" className="btn-primary">Volver</Link>
          </>
        )}
      </div>
      <style>{`
        .callback-container { min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 2rem; }
        .callback-card { max-width: 400px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
        .callback-card h1 { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0; }
        .callback-card p { color: var(--text-secondary); margin: 0; }
        .callback-spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .callback-check { width: 32px; height: 32px; border-radius: 50%; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
      `}</style>
    </div>
  )
}
