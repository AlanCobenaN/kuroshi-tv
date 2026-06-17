'use client'
// app/login/LoginForm.tsx
import { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal'

interface Props {
  mode: 'login' | 'register'
}

export function LoginForm({ mode }: Props) {
  const router = useRouter()
  const { update } = useSession()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('') // solo en registro
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError]            = useState('')
  const [loading, setLoading]   = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'discord' | null>(null)
  const [showForgotPass, setShowForgotPass] = useState(false)

  const isRegister = mode === 'register'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isRegister) {
      // Registro directo a la API de NestJS
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
          }
        )
        const data = await res.json()

        if (!res.ok) {
          setError(data.message ?? 'Error al registrarse')
          return
        }

        // Tras registrar, hacer login automáticamente
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.ok) {
          await update()
          router.push('/')
        } else {
          router.push('/login')
        }
      } catch {
        setError('Error de conexión. Intenta de nuevo.')
      } finally {
        setLoading(false)
      }
      return
    }

    // Login con credenciales
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.ok) {
      await update()
      router.push('/')
    } else {
      setError('Email o contraseña incorrectos')
    }
  }

  const handleOAuth = async (provider: 'google' | 'discord') => {
    setOauthLoading(provider)
    window.location.href = `/backend/auth/${provider}`
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <Link href="/" className="auth-logo">
          <span style={{ color: 'var(--text-primary)' }}>kuro</span>
          <span style={{ color: 'var(--accent)' }}>shi</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 400 }}>.tv</span>
        </Link>

        <h1 className="auth-title">
          {isRegister ? 'Crea tu cuenta' : 'Bienvenido de vuelta'}
        </h1>
        <p className="auth-subtitle">
          {isRegister
            ? 'Únete a la comunidad otaku latinoamericana'
            : 'Ingresa para continuar viendo y comentando'}
        </p>

        {/* OAuth */}
        <div className="oauth-buttons">
          <button
            onClick={() => handleOAuth('discord')}
            disabled={!!oauthLoading}
            className="oauth-btn oauth-discord"
            aria-label="Continuar con Discord"
          >
            {oauthLoading === 'discord' ? (
              <Spinner />
            ) : (
              <DiscordIcon />
            )}
            Continuar con Discord
          </button>

          <button
            onClick={() => handleOAuth('google')}
            disabled={!!oauthLoading}
            className="oauth-btn oauth-google"
            aria-label="Continuar con Google"
          >
            {oauthLoading === 'google' ? (
              <Spinner />
            ) : (
              <GoogleIcon />
            )}
            Continuar con Google
          </button>
        </div>

        {/* Separador */}
        <div className="auth-divider">
          <span className="auth-divider-text">o con email</span>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {isRegister && (
            <div className="form-field">
              <label htmlFor="username" className="form-label">
                Nombre de usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="otaku_san_99"
                className="input"
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_]+"
                autoComplete="username"
                autoFocus
              />
              <span className="form-hint">Solo letras, números y guiones bajos</span>
            </div>
          )}

          <div className="form-field">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="input"
              required
              autoComplete="email"
              autoFocus={!isRegister}
            />
          </div>

          <div className="form-field">
            <label htmlFor="password" className="form-label">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={isRegister ? 'Mínimo 8 caracteres' : '••••••••'}
              className="input"
              required
              minLength={isRegister ? 8 : 1}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
            {!isRegister && (
              <button
                type="button"
                onClick={() => setShowForgotPass(true)}
                className="forgot-link"
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </div>

          {error && (
            <div className="auth-error" role="alert">
              <ErrorIcon />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (isRegister && !acceptTerms)}
            className="btn-primary auth-submit"
          >
            {loading ? <Spinner /> : null}
            {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </form>

        {/* Nota de verificación */}
          {isRegister && (
            <>
              <label className="terms-checkbox">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={e => setAcceptTerms(e.target.checked)}
                  required
                  aria-label="Acepto los términos y condiciones"
                />
                <span className="terms-checkbox-text">
                  Acepto los{' '}
                  <a href="/terminos" target="_blank" className="terms-link" rel="noopener noreferrer">
                    Términos y Condiciones
                  </a>{' '}
                  y la{' '}
                  <a href="/privacidad" target="_blank" className="terms-link" rel="noopener noreferrer">
                    Política de Privacidad
                  </a>
                </span>
              </label>
              <p className="auth-note">
                Al registrarte puedes usar el sitio de inmediato. Te enviaremos un email de verificación, pero no es obligatorio para empezar.
              </p>
            </>
          )}

        {/* Link al otro modo */}
        <p className="auth-switch">
          {isRegister ? (
            <>¿Ya tienes cuenta? <Link href="/login" className="auth-switch-link">Inicia sesión</Link></>
          ) : (
            <>¿No tienes cuenta? <Link href="/registro" className="auth-switch-link">Regístrate</Link></>
          )}
        </p>
        <ForgotPasswordModal isOpen={showForgotPass} onClose={() => setShowForgotPass(false)} />
      </div>

      <style>{`
        .auth-page {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          background: var(--bg-base);
          /* Patrón sutil de fondo */
          background-image: radial-gradient(circle at 20% 50%, rgba(230, 57, 70, 0.04) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(244, 162, 97, 0.03) 0%, transparent 50%);
        }

        .auth-card {
          width: 100%;
          max-width: 400px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 2.5rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          animation: fade-in 0.4s ease;
        }

        .auth-logo {
          display: block;
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 0.25rem;
          text-decoration: none;
        }

        .auth-title {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .auth-subtitle {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
        }

        /* OAuth */
        .oauth-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
          margin-top: 0.5rem;
        }

        .oauth-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          width: 100%;
          height: 42px;
          border-radius: var(--radius-md);
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--border-hover);
          transition: background var(--transition-fast), transform var(--transition-fast), border-color var(--transition-fast);
        }
        .oauth-btn:hover { transform: translateY(-1px); }
        .oauth-btn:active { transform: none; }
        .oauth-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .oauth-discord {
          background: rgba(88, 101, 242, 0.12);
          color: #7289da;
          border-color: rgba(88, 101, 242, 0.2);
        }
        .oauth-discord:hover { background: rgba(88, 101, 242, 0.2); border-color: rgba(88, 101, 242, 0.35); }

        .oauth-google {
          background: var(--bg-overlay);
          color: var(--text-primary);
        }
        .oauth-google:hover { background: var(--bg-hover); }

        /* Separador */
        .auth-divider {
          position: relative;
          text-align: center;
          margin: 0.25rem 0;
        }
        .auth-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: var(--border);
        }
        .auth-divider-text {
          position: relative;
          background: var(--bg-surface);
          padding: 0 0.75rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        /* Formulario */
        .auth-form { display: flex; flex-direction: column; gap: 0.875rem; }

        .form-field { display: flex; flex-direction: column; gap: 0.375rem; }

        .form-label {
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .form-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .auth-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 0.875rem;
          background: rgba(230, 57, 70, 0.08);
          border: 1px solid rgba(230, 57, 70, 0.2);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          color: var(--accent);
        }

        .auth-submit {
          width: 100%;
          height: 42px;
          justify-content: center;
          font-size: 0.9375rem;
          margin-top: 0.25rem;
        }

        .terms-checkbox {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          cursor: pointer;
          padding: 0.5rem 0;
        }
        .terms-checkbox input[type="checkbox"] {
          margin-top: 2px;
          accent-color: var(--accent);
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }
        .terms-checkbox-text {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .terms-link {
          color: var(--accent);
          text-decoration: none;
          font-weight: 600;
        }
        .terms-link:hover {
          text-decoration: underline;
        }
        .auth-note {
          font-size: 0.75rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin: 0;
        }

        .auth-switch {
          text-align: center;
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .auth-switch-link {
          color: var(--accent);
          font-weight: 600;
          text-decoration: none;
        }
        .auth-switch-link:hover { text-decoration: underline; }
        .forgot-link { background: none; border: none; cursor: pointer; padding: 0; margin-top: 0.375rem; font-size: 0.75rem; color: var(--text-muted); text-align: left; transition: color var(--transition-fast); align-self: flex-start; }
        .forgot-link:hover { color: var(--accent); }
      `}</style>
    </div>
  )
}

/* ─── Componentes auxiliares ─────────────────────────────────── */

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round"/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}

function DiscordIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.1.118 18.14.148 18.17c2.052 1.507 4.04 2.422 5.992 3.029a.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028c1.961-.607 3.95-1.522 6.002-3.029a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
