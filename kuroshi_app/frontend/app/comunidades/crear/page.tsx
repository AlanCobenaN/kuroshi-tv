'use client'
// app/comunidades/crear/page.tsx
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { communitiesApi } from '@/lib/api'

export default function CreateCommunityPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName]   = useState('')
  const [desc, setDesc]   = useState('')
  const [error, setError] = useState('')

  // Auto-generar slug desde el nombre
  const slug = name.trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)

  const handleCreate = () => {
    if (!name.trim() || !slug) return
    setError('')

    startTransition(async () => {
      const token = (window as any).__kuroshi_token__ as string | undefined
      if (!token) { setError('Debes iniciar sesión.'); return }

      try {
        const community: any = await communitiesApi.create(
          { name: name.trim(), description: desc.trim() || undefined },
          token
        )
        router.push(`/comunidad/${community.slug ?? slug}`)
      } catch (e: any) {
        setError(e?.message ?? 'No se pudo crear la comunidad. El nombre puede estar en uso.')
      }
    })
  }

  return (
    <div className="create-page container">
      <div className="create-card">
        {/* Breadcrumb */}
        <nav className="create-breadcrumb" aria-label="Breadcrumb">
          <Link href="/comunidades" className="breadcrumb-link">Comunidades</Link>
          <span className="breadcrumb-sep" aria-hidden="true">/</span>
          <span className="breadcrumb-current">Crear</span>
        </nav>

        <h1 className="create-title">Crear comunidad</h1>
        <p className="create-subtitle">
          Las comunidades se crean como <strong>no oficiales</strong>. Pueden volverse oficiales al alcanzar un umbral de miembros activos.
        </p>

        <div className="create-form">
          {/* Nombre */}
          <div className="create-field">
            <label htmlFor="comm-name" className="create-label">
              Nombre de la comunidad <span className="required" aria-hidden="true">*</span>
            </label>
            <input
              id="comm-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Naruto Shippuden fans"
              className="input"
              maxLength={80}
              required
              aria-required="true"
              autoFocus
            />
            <span className="create-char">{name.length}/80</span>
          </div>

          {/* Slug preview */}
          {slug && (
            <div className="create-slug-preview" aria-live="polite">
              <span className="slug-label">URL:</span>
              <span className="slug-value">kuroshi.lat/comunidad/<strong>{slug}</strong></span>
            </div>
          )}

          {/* Descripción */}
          <div className="create-field">
            <label htmlFor="comm-desc" className="create-label">
              Descripción <span className="optional">(opcional)</span>
            </label>
            <textarea
              id="comm-desc"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="¿De qué trata tu comunidad? ¿Qué pueden esperar los miembros?"
              className="input create-textarea"
              rows={4}
              maxLength={500}
            />
            <span className="create-char">{desc.length}/500</span>
          </div>

          {/* Info de funcionamiento */}
          <div className="create-info">
            <div className="create-info-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Serás el <strong>creador</strong> con permisos de moderación completos.
            </div>
            <div className="create-info-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              Invita a otros para crecer y alcanzar el estado <strong>oficial</strong>.
            </div>
          </div>

          {error && <p className="create-error" role="alert">{error}</p>}

          <div className="create-actions">
            <Link href="/comunidades" className="btn-secondary">
              Cancelar
            </Link>
            <button
              onClick={handleCreate}
              disabled={isPending || !name.trim()}
              className="btn-primary create-submit"
              aria-label="Crear comunidad"
            >
              {isPending ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round"/>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </svg>
                  Creando…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Crear comunidad
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .create-page {
          padding-top: 2rem;
          padding-bottom: 4rem;
          display: flex;
          justify-content: center;
        }
        .create-card {
          width: 100%;
          max-width: 560px;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Breadcrumb */
        .create-breadcrumb { display: flex; align-items: center; gap: 0.5rem; }
        .breadcrumb-link { font-family: var(--font-display); font-size: 0.8125rem; font-weight: 600; color: var(--text-muted); text-decoration: none; transition: color var(--transition-fast); }
        .breadcrumb-link:hover { color: var(--text-secondary); }
        .breadcrumb-sep { color: var(--text-muted); font-size: 0.75rem; }
        .breadcrumb-current { font-family: var(--font-display); font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary); }

        /* Títulos */
        .create-title {
          font-family: var(--font-display);
          font-size: clamp(1.5rem, 3vw, 2rem);
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          margin: 0;
        }
        .create-subtitle {
          font-size: 0.9375rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0;
        }
        .create-subtitle strong { color: var(--text-primary); }

        /* Formulario */
        .create-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .create-field { display: flex; flex-direction: column; gap: 0.5rem; }
        .create-label {
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .required { color: var(--accent); }
        .optional { font-weight: 400; color: var(--text-muted); font-size: 0.8125rem; }
        .create-char { font-size: 0.75rem; color: var(--text-muted); align-self: flex-end; }
        .create-textarea { resize: vertical; min-height: 100px; }

        /* Slug preview */
        .create-slug-preview {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 0.8125rem;
        }
        .slug-label { font-family: var(--font-display); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
        .slug-value { color: var(--text-secondary); font-family: monospace; }
        .slug-value strong { color: var(--accent); }

        /* Info */
        .create-info {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
          padding: 1rem 1.125rem;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
        }
        .create-info-item {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .create-info-item svg { color: var(--accent); flex-shrink: 0; margin-top: 2px; }
        .create-info-item strong { color: var(--text-primary); }

        /* Error */
        .create-error { font-size: 0.875rem; color: var(--accent); margin: 0; }

        /* Acciones */
        .create-actions { display: flex; gap: 0.75rem; justify-content: flex-end; padding-top: 0.5rem; }
        .create-submit { font-size: 0.9375rem; padding: 0.625rem 1.5rem; }
      `}</style>
    </div>
  )
}
