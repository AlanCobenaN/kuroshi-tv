'use client'
import { useState } from 'react'
import { reportsApi } from '@/lib/api'

interface Props {
  isOpen: boolean
  onClose: () => void
  contentType: 'post' | 'usuario' | 'episodio' | 'comment' | 'episode_comment'
  contentId: string
  contentLabel?: string
}

const REASON_OPTIONS: Record<string, { value: string; label: string }[]> = {
  post: [
    { value: 'spam', label: 'Spam o publicidad' },
    { value: 'contenido_inapropiado', label: 'Contenido inapropiado' },
    { value: 'acoso', label: 'Acoso o insultos' },
    { value: 'violencia', label: 'Violencia o gore' },
    { value: 'desinformacion', label: 'Desinformación' },
    { value: 'otro', label: 'Otro' },
  ],
  usuario: [
    { value: 'acoso', label: 'Acoso o insultos' },
    { value: 'spam', label: 'Spam o publicidad' },
    { value: 'suplantacion', label: 'Suplantación de identidad' },
    { value: 'contenido_inapropiado', label: 'Contenido inapropiado en perfil' },
    { value: 'otro', label: 'Otro' },
  ],
  episodio: [
    { value: 'link_caido', label: 'Link caído / no funciona' },
    { value: 'calidad_baja', label: 'Calidad de video baja' },
    { value: 'audio_incorrecto', label: 'Audio incorrecto o desincronizado' },
    { value: 'subtitulos_incorrectos', label: 'Subtítulos incorrectos' },
    { value: 'episodio_incorrecto', label: 'No corresponde al episodio' },
    { value: 'otro', label: 'Otro' },
  ],
  comment: [
    { value: 'spam', label: 'Spam o publicidad' },
    { value: 'acoso', label: 'Acoso o insultos' },
    { value: 'contenido_inapropiado', label: 'Contenido inapropiado' },
    { value: 'spoiler', label: 'Spoiler sin marcar' },
    { value: 'otro', label: 'Otro' },
  ],
  episode_comment: [
    { value: 'spam', label: 'Spam o publicidad' },
    { value: 'acoso', label: 'Acoso o insultos' },
    { value: 'contenido_inapropiado', label: 'Contenido inapropiado' },
    { value: 'spoiler', label: 'Spoiler sin marcar' },
    { value: 'otro', label: 'Otro' },
  ],
}

export function ReportModal({ isOpen, onClose, contentType, contentId, contentLabel }: Props) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const reasons = REASON_OPTIONS[contentType] ?? REASON_OPTIONS.otro

  const toggleReason = (value: string) => {
    setSelectedReasons(prev =>
      prev.includes(value)
        ? prev.filter(r => r !== value)
        : [...prev, value]
    )
  }

  const handleSubmit = async () => {
    if (selectedReasons.length === 0) {
      setError('Selecciona al menos un motivo')
      return
    }
    const token = (window as any).__kuroshi_token__ as string | undefined
    if (!token) {
      setError('Debes iniciar sesión para reportar')
      return
    }
    setSending(true)
    setError('')
    try {
      await reportsApi.createReport({ contentType, contentId, reasons: selectedReasons, description: description || undefined }, token)
      setSuccess(true)
      setTimeout(() => { onClose(); setSuccess(false); setSelectedReasons([]); setDescription('') }, 2000)
    } catch (err: any) {
      setError(err?.message || 'Error al enviar el reporte')
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    onClose()
    setSelectedReasons([])
    setDescription('')
    setError('')
    setSuccess(false)
  }

  const typeLabel: Record<string, string> = {
    post: 'publicación',
    usuario: 'usuario',
    episodio: 'episodio',
    comment: 'comentario',
    episode_comment: 'comentario',
  }

  return (
    <div className="report-overlay" onClick={handleClose}>
      <div className="report-modal" onClick={e => e.stopPropagation()}>
        {success ? (
          <div className="report-success">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <h3>Reporte enviado</h3>
            <p>Gracias, lo revisaremos pronto.</p>
          </div>
        ) : (
          <>
            <div className="report-header">
              <h3>Reportar {typeLabel[contentType] ?? 'contenido'}</h3>
              {contentLabel && <p className="report-content-label">{contentLabel}</p>}
              <button className="report-close" onClick={handleClose} aria-label="Cerrar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <p className="report-subtitle">Selecciona los motivos del reporte:</p>

            <div className="report-reasons">
              {reasons.map(r => (
                <label key={r.value} className={`report-reason-item ${selectedReasons.includes(r.value) ? 'report-reason-item--active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedReasons.includes(r.value)}
                    onChange={() => toggleReason(r.value)}
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>

            <div className="report-description">
              <label htmlFor="report-desc">Descripción opcional:</label>
              <textarea
                id="report-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Añade más detalles si lo deseas..."
                rows={3}
                maxLength={1000}
              />
            </div>

            {error && <p className="report-error">{error}</p>}

            <div className="report-actions">
              <button className="report-btn report-btn--cancel" onClick={handleClose}>Cancelar</button>
              <button className="report-btn report-btn--submit" onClick={handleSubmit} disabled={sending}>
                {sending ? 'Enviando...' : 'Reportar'}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        .report-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .report-modal {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          max-width: 480px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: fade-in-fast 0.15s ease;
        }
        .report-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 2rem;
          text-align: center;
        }
        .report-success h3 { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin: 0; }
        .report-success p { color: var(--text-secondary); margin: 0; }
        .report-header {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .report-header h3 { font-family: var(--font-display); font-size: 1.125rem; font-weight: 700; color: var(--text-primary); margin: 0; flex: 1; }
        .report-content-label { font-size: 0.875rem; color: var(--text-muted); margin: 0.25rem 0 0 0; }
        .report-close {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.25rem;
          flex-shrink: 0;
        }
        .report-close:hover { color: var(--text-primary); }
        .report-subtitle { font-size: 0.875rem; color: var(--text-secondary); margin: 0 0 1rem 0; }
        .report-reasons { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
        .report-reason-item {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.625rem 0.875rem;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        .report-reason-item:hover { border-color: var(--border-hover); background: var(--bg-hover); }
        .report-reason-item--active { border-color: var(--accent); background: var(--accent-glow); color: var(--text-primary); }
        .report-reason-item input { accent-color: var(--accent); }
        .report-description { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
        .report-description label { font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary); }
        .report-description textarea {
          width: 100%;
          padding: 0.625rem;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.875rem;
          resize: vertical;
        }
        .report-description textarea:focus { outline: none; border-color: var(--accent); }
        .report-error { font-size: 0.8125rem; color: var(--accent); margin: 0 0 0.75rem 0; }
        .report-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
        .report-btn {
          padding: 0.5rem 1.125rem;
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          border: 1px solid;
        }
        .report-btn--cancel { background: transparent; color: var(--text-secondary); border-color: var(--border-hover); }
        .report-btn--cancel:hover { color: var(--text-primary); background: var(--bg-hover); }
        .report-btn--submit { background: var(--accent); color: #fff; border-color: var(--accent); }
        .report-btn--submit:hover { background: var(--accent-dim); }
        .report-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  )
}
