'use client'
// app/configuracion/SettingsClient.tsx
import { useState, useTransition } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { usersApi, uploadsApi, authApi } from '@/lib/api'
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal'

interface Props {
  username: string
  email: string
  accessToken: string
  provider?: string
  avatarUrl?: string
  emailVerified?: boolean
}

type SectionId = 'perfil' | 'cuenta' | 'privacidad' | 'apariencia'

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  {
    id: 'perfil', label: 'Perfil',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
  {
    id: 'cuenta', label: 'Cuenta',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  },
  {
    id: 'privacidad', label: 'Privacidad',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  },
  {
    id: 'apariencia', label: 'Apariencia',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
  },
]

export function SettingsClient({ username: initialUsername, email, accessToken, provider, avatarUrl: initialAvatarUrl, emailVerified = false }: Props) {
  const [activeSection, setActiveSection] = useState<SectionId>('perfil')
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const { update } = useSession()

  const showSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="settings-page">
      {/* Título */}
      <div className="settings-header">
        <h1 className="settings-title">Configuración</h1>
        {saved && (
          <div className="settings-saved" role="status" aria-live="polite">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Guardado
          </div>
        )}
      </div>

      <div className="settings-layout">
        {/* Sidebar de navegación */}
        <nav className="settings-nav" aria-label="Secciones de configuración">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`settings-nav-item ${activeSection === s.id ? 'settings-nav-item--active' : ''}`}
              aria-current={activeSection === s.id ? 'page' : undefined}
            >
              <span className="settings-nav-icon" aria-hidden="true">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </nav>

        {/* Contenido */}
        <div className="settings-content">
          {activeSection === 'perfil' && (
            <ProfileSection
              username={initialUsername}
              accessToken={accessToken}
              avatarUrl={initialAvatarUrl}
              onSaved={showSaved}
              isPending={isPending}
              startTransition={startTransition}
              updateSession={update}
            />
          )}
          {activeSection === 'cuenta' && (
            <AccountSection email={email} provider={provider} accessToken={accessToken} emailVerified={emailVerified} />
          )}
          {activeSection === 'privacidad' && (
            <PrivacySection
              accessToken={accessToken}
              onSaved={showSaved}
              isPending={isPending}
              startTransition={startTransition}
            />
          )}
          {activeSection === 'apariencia' && (
            <AppearanceSection />
          )}
        </div>
      </div>

      <style>{`
        .settings-page {
          max-width: 880px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .settings-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .settings-title {
          font-family: var(--font-display);
          font-size: clamp(1.5rem, 3vw, 2rem);
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          margin: 0;
        }
        .settings-saved {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.35rem 0.875rem;
          background: rgba(74,222,128,0.1);
          border: 1px solid rgba(74,222,128,0.25);
          border-radius: var(--radius-full);
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          color: #4ade80;
          animation: fade-in-fast 0.2s ease;
        }

        .settings-layout {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 2rem;
          align-items: start;
        }

        /* Nav lateral */
        .settings-nav {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          position: sticky;
          top: calc(var(--total-nav) + 1rem);
        }
        .settings-nav-item {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.625rem 0.875rem;
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          text-align: left;
          transition: all var(--transition-fast);
        }
        .settings-nav-item:hover { color: var(--text-secondary); background: var(--bg-surface); }
        .settings-nav-item--active { color: var(--text-primary); background: var(--bg-surface); }
        .settings-nav-icon { color: inherit; display: flex; align-items: center; }

        /* Contenido */
        .settings-content { min-width: 0; }

        @media (max-width: 640px) {
          .settings-layout { grid-template-columns: 1fr; }
          .settings-nav { position: static; flex-direction: row; overflow-x: auto; scrollbar-width: none; }
          .settings-nav::-webkit-scrollbar { display: none; }
          .settings-nav-item { white-space: nowrap; }
        }
      `}</style>
    </div>
  )
}

/* ─── Sección Perfil ─────────────────────────────────────── */

function ProfileSection({ username, accessToken, avatarUrl, onSaved, isPending, startTransition, updateSession }: any) {
  const [newUsername, setNewUsername] = useState(username)
  const [bio, setBio]                 = useState('')
  const [error, setError]             = useState('')

  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl || '')
  const [previewUrl, setPreviewUrl]       = useState('')
  const [uploading, setUploading]         = useState(false)

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setError('Formato no soportado. Usa JPG, PNG, GIF o WebP.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no puede superar 2MB.')
      return
    }

    setError('')
    const reader = new FileReader()
    reader.onload = () => setPreviewUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleAvatarUpload = () => {
    if (!previewUrl) return
    setUploading(true)
    setError('')

    const base64 = previewUrl.split(',')[1]
    const mimeType = previewUrl.split(';')[0].split(':')[1]

    startTransition(async () => {
      try {
        const { url } = await uploadsApi.uploadImage(base64, mimeType, accessToken)
        await usersApi.updateMe({ avatarUrl: url }, accessToken)
        setCurrentAvatar(url)
        setPreviewUrl('')
        updateSession({ avatar_url: url, image: url })
        onSaved()
      } catch (e: any) {
        setError(e?.message ?? 'Error al subir la imagen.')
      } finally {
        setUploading(false)
      }
    })
  }

  const handleSave = () => {
    setError('')
    startTransition(async () => {
      try {
        await usersApi.updateMe({ bio }, accessToken)
        onSaved()
      } catch {
        setError('Error al guardar. Intenta de nuevo.')
      }
    })
  }

  const handleUsernameChange = () => {
    if (!newUsername.trim() || newUsername === username) return
    startTransition(async () => {
      try {
        await usersApi.updateUsername(newUsername.trim(), accessToken)
        onSaved()
      } catch (e: any) {
        setError(e?.message ?? 'No se pudo cambiar el nombre de usuario.')
      }
    })
  }

  return (
    <div className="settings-section">
      <h2 className="section-title">Perfil</h2>

      <AvatarSection
        currentAvatar={currentAvatar}
        previewUrl={previewUrl}
        uploading={uploading}
        onSelect={handleAvatarSelect}
        onUpload={handleAvatarUpload}
      />

      <SettingsField label="Nombre de usuario" hint="Solo permitido cada 30 días">
        <div className="input-row">
          <input
            type="text"
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
            className="input"
            maxLength={30}
            pattern="[a-zA-Z0-9_]+"
            aria-label="Nombre de usuario"
          />
          <button
            onClick={handleUsernameChange}
            disabled={isPending || newUsername === username || !newUsername.trim()}
            className="settings-save-btn"
          >
            Cambiar
          </button>
        </div>
      </SettingsField>

      <SettingsField label="Bio" hint="Máximo 150 caracteres">
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          className="input settings-textarea"
          rows={3}
          maxLength={150}
          placeholder="Cuéntanos algo sobre ti..."
          aria-label="Bio"
        />
        <span className="char-count">{bio.length}/150</span>
      </SettingsField>

      {error && <p className="settings-error" role="alert">{error}</p>}

      <button onClick={handleSave} disabled={isPending} className="settings-primary-btn">
        {isPending ? 'Guardando…' : 'Guardar cambios'}
      </button>

      <SectionStyles />
    </div>
  )
}

function AvatarSection({ currentAvatar, previewUrl, uploading, onSelect, onUpload }: {
  currentAvatar: string
  previewUrl: string
  uploading: boolean
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onUpload: () => void
}) {
  const displayUrl = previewUrl || currentAvatar
  const hasNewImage = !!previewUrl

  return (
    <div className="avatar-section">
      <div className="avatar-preview-wrap">
        {displayUrl ? (
          <img src={displayUrl} alt="Avatar" className="avatar-preview-img" />
        ) : (
          <div className="avatar-preview-placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        )}
        {uploading && <div className="avatar-uploading-overlay"><div className="avatar-spinner" /></div>}
      </div>

      <div className="avatar-actions">
        <label className={`avatar-btn avatar-btn--select ${uploading ? 'avatar-btn--disabled' : ''}`}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={onSelect}
            disabled={uploading}
            className="sr-only"
          />
          {hasNewImage ? 'Cambiar imagen' : 'Seleccionar imagen'}
        </label>

        {hasNewImage && (
          <button
            onClick={onUpload}
            disabled={uploading}
            className="avatar-btn avatar-btn--upload"
          >
            {uploading ? 'Subiendo…' : 'Guardar foto'}
          </button>
        )}
      </div>

      <p className="avatar-hint">JPG, PNG, GIF o WebP. Máximo 2MB.</p>

      <style>{`
        .avatar-section {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1rem;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          flex-wrap: wrap;
        }
        .avatar-preview-wrap {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          background: var(--bg-overlay);
          border: 2px solid var(--border-hover);
        }
        .avatar-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-preview-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }
        .avatar-uploading-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .avatar-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: avatar-spin 0.6s linear infinite;
        }
        @keyframes avatar-spin { to { transform: rotate(360deg); } }
        .avatar-actions {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .avatar-btn {
          padding: 0.5rem 1rem;
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
        }
        .avatar-btn--select {
          background: var(--bg-overlay);
          color: var(--text-secondary);
          border: 1px solid var(--border-hover);
        }
        .avatar-btn--select:hover { color: var(--text-primary); border-color: var(--accent); }
        .avatar-btn--upload {
          background: var(--accent);
          color: #fff;
          border: none;
        }
        .avatar-btn--upload:hover { background: var(--accent-dim); }
        .avatar-btn--disabled { opacity: 0.5; pointer-events: none; }
        .avatar-hint {
          width: 100%;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: 0;
        }
      `}</style>
    </div>
  )
}

/* ─── Sección Cuenta ─────────────────────────────────────── */

function AccountSection({ email, provider, accessToken, emailVerified }: { email: string; provider?: string; accessToken?: string; emailVerified?: boolean }) {
  const [showDanger, setShowDanger]        = useState(false)
  const [confirmText, setConfirmText]      = useState('')
  const [currentPassword, setCurrentPass]  = useState('')
  const [newPassword, setNewPass]          = useState('')
  const [confirmPassword, setConfirmPass]  = useState('')
  const [passError, setPassError]          = useState('')
  const [passSuccess, setPassSuccess]      = useState(false)
  const [changingPass, setChangingPass]    = useState(false)
  const [sendingVerification, setSendingVerification] = useState(false)
  const [verifyMessage, setVerifyMessage]             = useState('')
  const [verifyError, setVerifyError]                 = useState(false)
  const [showForgotPass, setShowForgotPass]           = useState(false)

  const isEmailAccount = !provider || provider === 'email' || provider === 'credentials'

  const linkedAccounts: { id: string; label: string; icon: React.ReactNode }[] = []
  if (provider === 'discord') {
    linkedAccounts.push({ id: 'discord', label: 'Discord', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.1.118 18.14.148 18.17c2.052 1.507 4.04 2.422 5.992 3.029a.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028c1.961-.607 3.95-1.522 6.002-3.029a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg> })
  } else if (provider === 'google') {
    linkedAccounts.push({ id: 'google', label: 'Google', icon: <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> })
  } else {
    linkedAccounts.push({ id: 'email', label: 'Email', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> })
  }

  const handleChangePassword = () => {
    setPassError('')
    setPassSuccess(false)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassError('Completa todos los campos.')
      return
    }
    if (newPassword.length < 8) {
      setPassError('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPassError('Las contraseñas nuevas no coinciden.')
      return
    }

    setChangingPass(true)
    authApi.changePassword({ currentPassword, newPassword }, accessToken!)
      .then(() => {
        setPassSuccess(true)
        setCurrentPass('')
        setNewPass('')
        setConfirmPass('')
        setTimeout(() => setPassSuccess(false), 3000)
      })
      .catch((e: any) => {
        setPassError(e?.message ?? 'Error al cambiar la contraseña.')
      })
      .finally(() => setChangingPass(false))
  }

  const handleResendVerification = () => {
    setSendingVerification(true)
    setVerifyMessage('')
    setVerifyError(false)

    authApi.resendVerification(accessToken!)
      .then(() => {
        setVerifyMessage('Email de verificación enviado. Revisa tu bandeja de entrada.')
        setVerifyError(false)
      })
      .catch((e: any) => {
        setVerifyMessage(e?.message ?? 'Error al enviar el email.')
        setVerifyError(true)
      })
      .finally(() => setSendingVerification(false))
  }

  return (
    <div className="settings-section">
      <h2 className="section-title">Cuenta</h2>

      <SettingsField label="Email">
        <div className="input-with-badge">
          <input
            type="email"
            defaultValue={email}
            className="input"
            disabled
            aria-label="Email"
          />
          {emailVerified ? (
            <span className="verified-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Verificado
            </span>
          ) : (
            <div className="verify-actions">
              <span className="verify-pending-label">No verificado</span>
              <button
                onClick={handleResendVerification}
                disabled={sendingVerification}
                className="verify-resend-btn"
              >
                {sendingVerification ? 'Enviando...' : 'Reenviar verificación'}
              </button>
            </div>
          )}
        </div>
        {verifyMessage && (
          <p className={`verify-feedback ${verifyError ? 'settings-error' : 'settings-success'}`} role="status">
            {verifyMessage}
          </p>
        )}
      </SettingsField>

      {linkedAccounts.length > 0 && (
        <SettingsField label="Cuenta vinculada">
          <div className="linked-accounts">
            {linkedAccounts.map(acc => (
              <div key={acc.id} className="linked-account">
                <span className={`linked-icon linked-icon--${acc.id}`}>{acc.icon}</span>
                <span className="linked-name">{acc.label}</span>
                <span className="linked-status linked-status--connected">Conectado</span>
              </div>
            ))}
          </div>
        </SettingsField>
      )}

      {/* Cambiar contraseña (solo para cuentas email) */}
      {isEmailAccount && (
        <>
          <div className="settings-divider" />
          <h3 className="settings-subtitle">Cambiar contraseña</h3>

          <SettingsField label="Contraseña actual">
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPass(e.target.value)}
              className="input"
              placeholder="••••••••"
              aria-label="Contraseña actual"
            />
          </SettingsField>

          <SettingsField label="Nueva contraseña" hint="Mínimo 8 caracteres">
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPass(e.target.value)}
              className="input"
              placeholder="••••••••"
              aria-label="Nueva contraseña"
            />
          </SettingsField>

          <SettingsField label="Confirmar nueva contraseña">
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPass(e.target.value)}
              className="input"
              placeholder="••••••••"
              aria-label="Confirmar nueva contraseña"
            />
          </SettingsField>

          {passError && <p className="settings-error" role="alert">{passError}</p>}
          {passSuccess && (
            <p className="settings-success" role="status">
              Contraseña actualizada exitosamente.
            </p>
          )}

          <button
            onClick={handleChangePassword}
            disabled={changingPass || !currentPassword || !newPassword || !confirmPassword}
            className="settings-primary-btn"
          >
            {changingPass ? 'Cambiando…' : 'Cambiar contraseña'}
          </button>
        </>
      )}

      {/* Olvidaste tu contraseña (solo email accounts) */}
      {isEmailAccount && (
        <>
          <div className="settings-divider" />
          <button onClick={() => setShowForgotPass(true)} className="forgot-pass-btn">
            ¿Olvidaste tu contraseña?
          </button>
          <ForgotPasswordModal isOpen={showForgotPass} onClose={() => setShowForgotPass(false)} />
        </>
      )}

      {/* Zona de peligro */}
      <div className="settings-divider" />
      <div className="danger-zone">
        <h3 className="danger-title">Zona de peligro</h3>
        <div className="danger-actions">
          <button
            onClick={() => setShowDanger(v => !v)}
            className="danger-btn"
            aria-expanded={showDanger}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Eliminar cuenta permanentemente
          </button>
        </div>

        {showDanger && (
          <div className="danger-confirm" role="alert">
            <p className="danger-warning">
              Esta acción es <strong>irreversible</strong>. Se eliminarán todos tus datos, comentarios, lista de anime y comunidades creadas.
            </p>
            <p className="danger-instruction">
              Escribe <strong>tu nombre de usuario</strong> para confirmar:
            </p>
            <div className="input-row">
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="Escribe tu username"
                className="input input--danger"
                aria-label="Confirmar eliminación de cuenta"
              />
              <button
                className="danger-confirm-btn"
                disabled={confirmText !== 'kuroshi'} // placeholder — debería ser el username real
                onClick={() => signOut({ callbackUrl: '/' })}
                aria-label="Confirmar eliminación de cuenta"
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </div>

      <SectionStyles />
    </div>
  )
}

/* ─── Sección Privacidad ─────────────────────────────────── */

function PrivacySection({ accessToken, onSaved, isPending, startTransition }: any) {
  const [profileVisibility, setProfileVisibility] = useState('publico')
  const [listVisibility, setListVisibility]       = useState('publico')
  const [activityVisibility, setActivityVisibility] = useState('publico')
  const [friendRequests, setFriendRequests]       = useState('todos')
  const [showOnline, setShowOnline]               = useState(true)

  const handleSave = () => {
    startTransition(async () => {
      try {
        await usersApi.updateMe({ visibility: profileVisibility as any }, accessToken)
        onSaved()
      } catch {}
    })
  }

  return (
    <div className="settings-section">
      <h2 className="section-title">Privacidad</h2>

      <SettingsField label="Visibilidad del perfil">
        <VisibilitySelect
          value={profileVisibility}
          onChange={setProfileVisibility}
          aria-label="Visibilidad del perfil"
        />
      </SettingsField>

      <SettingsField label="Visibilidad de mi lista de anime">
        <VisibilitySelect
          value={listVisibility}
          onChange={setListVisibility}
          aria-label="Visibilidad de la lista"
        />
      </SettingsField>

      <SettingsField label="Visibilidad de mi actividad">
        <VisibilitySelect
          value={activityVisibility}
          onChange={setActivityVisibility}
          aria-label="Visibilidad de la actividad"
        />
      </SettingsField>

      <SettingsField label="Quién puede enviarme solicitudes de amistad">
        <select
          value={friendRequests}
          onChange={e => setFriendRequests(e.target.value)}
          className="input"
          aria-label="Solicitudes de amistad"
        >
          <option value="todos">Todos los usuarios</option>
          <option value="nadie">Nadie</option>
        </select>
      </SettingsField>

      <SettingsField label="Aparecer en usuarios activos ahora">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={showOnline}
            onChange={e => setShowOnline(e.target.checked)}
            className="toggle-input"
            aria-label="Mostrar como activo"
          />
          <span className="toggle-track">
            <span className="toggle-thumb" />
          </span>
          <span className="toggle-text">{showOnline ? 'Visible' : 'Oculto'}</span>
        </label>
      </SettingsField>

      <button onClick={handleSave} disabled={isPending} className="settings-primary-btn">
        {isPending ? 'Guardando…' : 'Guardar privacidad'}
      </button>

      <SectionStyles />
    </div>
  )
}

/* ─── Sección Apariencia ─────────────────────────────────── */

function AppearanceSection() {
  const [theme, setTheme] = useState<'oscuro' | 'claro'>('oscuro')

  return (
    <div className="settings-section">
      <h2 className="section-title">Apariencia</h2>

      <SettingsField label="Tema" hint="El tema claro está en desarrollo">
        <div className="theme-options" role="radiogroup" aria-label="Tema">
          {(['oscuro', 'claro'] as const).map(t => (
            <label key={t} className={`theme-option ${theme === t ? 'theme-option--active' : ''} ${t === 'claro' ? 'theme-option--disabled' : ''}`}>
              <input
                type="radio"
                name="theme"
                value={t}
                checked={theme === t}
                onChange={() => t === 'oscuro' && setTheme(t)}
                disabled={t === 'claro'}
                className="sr-only"
                aria-label={`Tema ${t}`}
              />
              <div className={`theme-preview theme-preview--${t}`} aria-hidden="true">
                <div className="preview-bar" />
                <div className="preview-content">
                  <div className="preview-line preview-line--lg" />
                  <div className="preview-line" />
                </div>
              </div>
              <span className="theme-label">
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {t === 'claro' && <span className="theme-soon">Próximamente</span>}
              </span>
            </label>
          ))}
        </div>
      </SettingsField>

      <SettingsField label="Idioma" hint="Más idiomas en Fase 2">
        <select className="input" defaultValue="es" aria-label="Idioma">
          <option value="es">Español</option>
          <option value="en" disabled>English (próximamente)</option>
        </select>
      </SettingsField>

      <SectionStyles />
    </div>
  )
}

/* ─── Componentes auxiliares ─────────────────────────────── */

function SettingsField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="settings-field">
      <div className="field-label-row">
        <label className="field-label">{label}</label>
        {hint && <span className="field-hint">{hint}</span>}
      </div>
      {children}
      <style>{`
        .settings-field { display: flex; flex-direction: column; gap: 0.5rem; }
        .field-label-row { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; }
        .field-label { font-family: var(--font-display); font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); }
        .field-hint { font-size: 0.75rem; color: var(--text-muted); }
      `}</style>
    </div>
  )
}

function VisibilitySelect({ value, onChange, ...props }: { value: string; onChange: (v: string) => void; [k: string]: any }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className="input" {...props}>
      <option value="publico">Público — visible para todos</option>
      <option value="solo_amigos">Solo amigos</option>
      <option value="privado">Privado</option>
    </select>
  )
}

function SectionStyles() {
  return (
    <style>{`
      .settings-section { display: flex; flex-direction: column; gap: 1.5rem; }
      .section-title { font-family: var(--font-display); font-size: 1.125rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.25rem; }
      .settings-subtitle { font-family: var(--font-display); font-size: 0.9375rem; font-weight: 700; color: var(--text-primary); margin: 0; }
      .settings-divider { border: none; border-top: 1px solid var(--border); margin: 0.5rem 0; }
      .settings-success { font-size: 0.875rem; color: #4ade80; margin: 0; }


      /* Input row */
      .input-row { display: flex; gap: 0.625rem; }
      .input-row .input { flex: 1; }

      /* Char count */
      .char-count { font-size: 0.75rem; color: var(--text-muted); align-self: flex-end; }

      /* Textarea */
      .settings-textarea { resize: vertical; min-height: 80px; }

      /* Error */
      .settings-error { font-size: 0.875rem; color: var(--accent); margin: 0; }

      /* Primary button */
      .settings-primary-btn {
        align-self: flex-start;
        padding: 0.625rem 1.5rem;
        background: var(--accent);
        color: #fff;
        font-family: var(--font-display);
        font-size: 0.875rem;
        font-weight: 700;
        border: none;
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: background var(--transition-fast), transform var(--transition-fast);
      }
      .settings-primary-btn:hover:not(:disabled) { background: var(--accent-dim); transform: translateY(-1px); }
      .settings-primary-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
      .settings-save-btn {
        padding: 0.625rem 1rem;
        background: var(--bg-overlay);
        color: var(--text-secondary);
        font-family: var(--font-display);
        font-size: 0.8125rem;
        font-weight: 600;
        border: 1px solid var(--border-hover);
        border-radius: var(--radius-md);
        cursor: pointer;
        white-space: nowrap;
        transition: all var(--transition-fast);
      }
      .settings-save-btn:hover:not(:disabled) { color: var(--text-primary); border-color: var(--accent); }
      .settings-save-btn:disabled { opacity: 0.4; cursor: not-allowed; }

      /* Linked accounts */
      .linked-accounts { display: flex; flex-direction: column; gap: 0.5rem; }
      .linked-account { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); }
      .linked-icon { width: 32px; height: 32px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .linked-icon--discord { background: rgba(88,101,242,0.15); color: #7289da; }
      .linked-icon--google  { background: rgba(66,133,244,0.1); }
      .linked-name { font-family: var(--font-display); font-size: 0.875rem; font-weight: 600; color: var(--text-primary); flex: 1; }
      .linked-status { font-family: var(--font-display); font-size: 0.75rem; font-weight: 700; }
      .linked-status--connected { color: #4ade80; }

      /* Danger zone */
      .danger-zone { border: 1px solid rgba(230,57,70,0.2); border-radius: var(--radius-xl); padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; background: rgba(230,57,70,0.03); }
      .danger-title { font-family: var(--font-display); font-size: 0.875rem; font-weight: 700; color: var(--accent); margin: 0; text-transform: uppercase; letter-spacing: 0.06em; }
      .danger-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: transparent; color: var(--accent); font-family: var(--font-display); font-size: 0.875rem; font-weight: 600; border: 1px solid rgba(230,57,70,0.3); border-radius: var(--radius-md); cursor: pointer; transition: all var(--transition-fast); align-self: flex-start; }
      .danger-btn:hover { background: var(--accent-glow); border-color: var(--accent); }
      .danger-confirm { display: flex; flex-direction: column; gap: 0.875rem; }
      .danger-warning { font-size: 0.875rem; color: var(--text-secondary); margin: 0; line-height: 1.6; }
      .danger-instruction { font-size: 0.875rem; color: var(--text-muted); margin: 0; }
      .input--danger { border-color: rgba(230,57,70,0.3); }
      .danger-confirm-btn { padding: 0.5rem 1rem; background: var(--accent); color: #fff; font-family: var(--font-display); font-size: 0.875rem; font-weight: 700; border: none; border-radius: var(--radius-md); cursor: pointer; white-space: nowrap; transition: background var(--transition-fast); }
      .danger-confirm-btn:hover:not(:disabled) { background: #b91c1c; }
      .danger-confirm-btn:disabled { opacity: 0.4; cursor: not-allowed; }

      /* Toggle */
      .toggle-label { display: flex; align-items: center; gap: 0.75rem; cursor: pointer; user-select: none; }
      .toggle-input { position: absolute; opacity: 0; width: 0; height: 0; }
      .toggle-track { position: relative; width: 40px; height: 22px; background: var(--bg-overlay); border: 1px solid var(--border-hover); border-radius: var(--radius-full); transition: background var(--transition-fast); flex-shrink: 0; }
      .toggle-input:checked + .toggle-track { background: var(--accent); border-color: var(--accent); }
      .toggle-thumb { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: #fff; border-radius: 50%; transition: transform var(--transition-fast); }
      .toggle-input:checked + .toggle-track .toggle-thumb { transform: translateX(18px); }
      .toggle-text { font-family: var(--font-display); font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); }

      /* Theme options */
      .theme-options { display: flex; gap: 1rem; }
      .theme-option { display: flex; flex-direction: column; gap: 0.5rem; cursor: pointer; }
      .theme-option--disabled { opacity: 0.4; cursor: not-allowed; }
      .theme-preview { width: 120px; height: 80px; border-radius: var(--radius-lg); overflow: hidden; border: 2px solid var(--border); transition: border-color var(--transition-fast); display: flex; flex-direction: column; }
      .theme-option--active .theme-preview { border-color: var(--accent); }
      .theme-preview--oscuro { background: #0a0a0f; }
      .theme-preview--claro  { background: #f5f5f5; }
      .preview-bar { height: 12px; background: rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.06); }
      .theme-preview--claro .preview-bar { background: rgba(0,0,0,0.05); border-bottom: 1px solid rgba(0,0,0,0.08); }
      .preview-content { flex: 1; padding: 8px; display: flex; flex-direction: column; gap: 6px; justify-content: center; }
      .preview-line { height: 6px; border-radius: 3px; background: rgba(255,255,255,0.08); }
      .theme-preview--claro .preview-line { background: rgba(0,0,0,0.08); }
      .preview-line--lg { width: 70%; }
      .theme-label { font-family: var(--font-display); font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; gap: 0.375rem; }
      .theme-soon { font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); background: var(--bg-overlay); border-radius: var(--radius-full); padding: 0.1rem 0.4rem; }

      /* Screen reader only */
      .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }

      /* Verification badge */
      .input-with-badge { display: flex; gap: 0.625rem; align-items: center; }
      .input-with-badge .input { flex: 1; }
      .verified-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.4rem 0.875rem;
        background: rgba(74,222,128,0.1);
        border: 1px solid rgba(74,222,128,0.25);
        border-radius: var(--radius-full);
        font-family: var(--font-display);
        font-size: 0.8125rem;
        font-weight: 700;
        color: #4ade80;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .verify-pending-label {
        font-size: 0.8125rem;
        color: #fbbf24;
        font-weight: 600;
      }
      .verify-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-shrink: 0;
      }
      .verify-resend-btn {
        padding: 0.4rem 1rem;
        background: var(--bg-overlay);
        color: var(--text-secondary);
        font-family: var(--font-display);
        font-size: 0.75rem;
        font-weight: 600;
        border: 1px solid var(--border-hover);
        border-radius: var(--radius-md);
        cursor: pointer;
        white-space: nowrap;
        transition: all var(--transition-fast);
      }
      .verify-resend-btn:hover:not(:disabled) { color: var(--text-primary); border-color: var(--accent); }
      .verify-resend-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .verify-feedback { margin: 0.25rem 0 0; }
      .forgot-pass-btn { background: none; border: none; cursor: pointer; padding: 0; font-family: var(--font-display); font-size: 0.8125rem; color: var(--text-muted); transition: color var(--transition-fast); }
      .forgot-pass-btn:hover { color: var(--accent); }
    `}</style>
  )
}
