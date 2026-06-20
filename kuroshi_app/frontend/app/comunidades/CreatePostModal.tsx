'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { communitiesApi, uploadsApi } from '@/lib/api'
import { TenorSearch } from '@/components/community/TenorSearch'

interface Props {
  selectedSlug: string | null
  accessToken: string
  onClose: () => void
  communities?: { slug: string; name: string }[]
}

export function CreatePostModal({ selectedSlug, accessToken, onClose, communities }: Props) {
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [targetSlug, setTargetSlug] = useState(selectedSlug || '')
  const [showTenor, setShowTenor] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTargetSlug(selectedSlug || '')
  }, [selectedSlug])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const wrapText = useCallback((prefix: string, suffix: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.substring(start, end)
    const wrapped = prefix + selected + suffix
    setContent(content.substring(0, start) + wrapped + content.substring(end))
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
    }, 0)
  }, [content])

  const handleTenorSelect = (url: string) => {
    setContent(prev => prev + (prev ? '\n' : '') + url)
    setShowTenor(false)
  }

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile) return
    setSending(true)
    try {
      let imageUrl: string | undefined
      if (imageFile) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => { const r = reader.result as string; resolve(r.split(',')[1]) }
          reader.onerror = reject
          reader.readAsDataURL(imageFile)
        })
        const mimeType = imageFile.type || 'image/jpeg'
        const res = await uploadsApi.uploadImage(base64, mimeType, accessToken)
        imageUrl = res?.url
      }

      const slug = targetSlug || undefined
      if (slug) {
        await communitiesApi.createPost(slug, { content: content.trim(), imageUrl }, accessToken)
      } else {
        const myComms: any = await communitiesApi.getMyCommunities(accessToken)
        if (Array.isArray(myComms) && myComms.length > 0) {
          await communitiesApi.createPost(myComms[0].slug, { content: content.trim(), imageUrl }, accessToken)
        }
      }
      onClose()
    } catch {} finally { setSending(false) }
  }

  return (
    <div className="cpm-overlay">
      <div className="cpm-modal" ref={modalRef} role="dialog" aria-modal="true" aria-label="Crear publicación">
        <div className="cpm-header">
          <h2 className="cpm-title">Crear publicación</h2>
          <button onClick={onClose} className="cpm-close" aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Community target */}
        {!selectedSlug && communities && communities.length > 0 ? (
          <div className="cpm-target">
            <label className="cpm-label">Publicar en</label>
            <select
              value={targetSlug}
              onChange={e => setTargetSlug(e.target.value)}
              className="cpm-input cpm-select"
            >
              <option value="">Selecciona una comunidad</option>
              {communities.map((c: { slug: string; name: string }) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
        ) : !selectedSlug ? (
          <div className="cpm-target">
            <label className="cpm-label">Publicar en</label>
            <input
              type="text"
              value={targetSlug}
              onChange={e => setTargetSlug(e.target.value)}
              placeholder="Slug de la comunidad (ej: mi-comunidad)"
              className="cpm-input"
            />
          </div>
        ) : null}

        {/* Toolbar */}
        <div className="cpm-toolbar">
          <button onClick={() => wrapText('**', '**')} className="cpm-tb-btn" title="Negrita" aria-label="Negrita">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" /></svg>
          </button>
          <button onClick={() => wrapText('*', '*')} className="cpm-tb-btn" title="Cursiva" aria-label="Cursiva">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" /></svg>
          </button>
          <button onClick={() => wrapText('***', '***')} className="cpm-tb-btn" title="Negrita + Cursiva" aria-label="Negrita y cursiva">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" /></svg>
          </button>
          <button onClick={() => wrapText('~~', '~~')} className="cpm-tb-btn" title="Tachado" aria-label="Tachado">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 12h12M3 6l2.5 3M21 6l-2.5 3M12 18V6" /></svg>
          </button>
          <button onClick={() => wrapText('__', '__')} className="cpm-tb-btn" title="Subrayado" aria-label="Subrayado">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3M4 21h16" /></svg>
          </button>
          <span className="cpm-tb-sep" />
          <button onClick={() => wrapText('<small>', '</small>')} className="cpm-tb-btn" title="Pequeño" aria-label="Texto pequeño">T<sub>s</sub></button>
          <button onClick={() => wrapText('<large>', '</large>')} className="cpm-tb-btn" title="Grande" aria-label="Texto grande">T<sup>l</sup></button>
          <button onClick={() => wrapText('<xlarge>', '</xlarge>')} className="cpm-tb-btn" title="Extra grande" aria-label="Texto extra grande">T<sup>xl</sup></button>
          <span className="cpm-tb-sep" />
          <button onClick={() => fileRef.current?.click()} className="cpm-tb-btn" title="Imagen" aria-label="Adjuntar imagen">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
          </button>
          <button onClick={() => setShowTenor(!showTenor)} className={`cpm-tb-btn ${showTenor ? 'cpm-tb-btn--active' : ''}`} title="GIF de Tenor" aria-label="Insertar GIF de Tenor">
            <span style={{ fontWeight: 800, fontSize: '10px' }}>GIF</span>
          </button>
        </div>

        {/* Text editor */}
        <div className="cpm-editor">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Escribe lo que quieras compartir..."
            className="cpm-textarea"
            rows={10}
            maxLength={2000}
            disabled={sending}
          />
        </div>

        {/* Tenor / Image section */}
        {showTenor && (
          <div className="cpm-tenor">
            <TenorSearch onSelect={handleTenorSelect} onClose={() => setShowTenor(false)} />
          </div>
        )}

        {/* Image preview */}
        {imagePreview && (
          <div className="cpm-img-preview">
            <img src={imagePreview} alt="" className="cpm-img-preview-img" />
            <button onClick={() => { setImageFile(null); setImagePreview(null) }} className="cpm-img-remove">✕</button>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" onChange={e => {
          const f = e.target.files?.[0]
          if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)) }
        }} className="cpm-file" />

        {/* Footer */}
        <div className="cpm-footer">
          <span className="cpm-count">{content.length}/2000</span>
          <button onClick={handleSubmit} disabled={sending || (!content.trim() && !imageFile)} className="cpm-submit">
            {sending ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>

      <style>{`
        .cpm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 1rem;
        }
        .cpm-modal {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 720px;
          max-height: 90dvh;
          overflow-y: auto;
          box-shadow: var(--shadow-lg);
        }
        .cpm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border);
        }
        .cpm-title { font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin: 0; color: var(--text-primary); }
        .cpm-close { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 0.25rem; border-radius: 50%; display: flex; }
        .cpm-close:hover { color: var(--text-primary); }

        .cpm-target { padding: 0.75rem 1.25rem; display: flex; align-items: center; gap: 0.75rem; }
        .cpm-label { font-family: var(--font-display); font-size: 0.75rem; font-weight: 600; color: var(--text-muted); white-space: nowrap; }
        .cpm-input {
          flex: 1;
          padding: 0.5rem 0.75rem;
          background: var(--bg-overlay);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.8125rem;
          outline: none;
        }
        .cpm-input:focus { border-color: var(--border-focus); }
        .cpm-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234e4d5c' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.625rem center;
          padding-right: 2rem;
          cursor: pointer;
        }
        .cpm-select option { background: var(--bg-surface); color: var(--text-primary); }

        .cpm-toolbar {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem 1.25rem;
          border-bottom: 1px solid var(--border);
          flex-wrap: wrap;
        }
        .cpm-tb-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          color: var(--text-muted);
          cursor: pointer;
          font-family: var(--font-display);
          font-size: 0.75rem;
          transition: all var(--transition-fast);
        }
        .cpm-tb-btn:hover { background: var(--bg-overlay); color: var(--text-secondary); }
        .cpm-tb-btn--active { background: var(--accent-glow); color: var(--accent); }
        .cpm-tb-sep { width: 1px; height: 20px; background: var(--border); margin: 0 0.25rem; }

        .cpm-editor { padding: 0.5rem 1.25rem; }
        .cpm-textarea {
          width: 100%;
          padding: 0.5rem 0;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.9375rem;
          line-height: 1.6;
          resize: none;
          min-height: 120px;
        }
        .cpm-textarea::placeholder { color: var(--text-muted); }

        .cpm-tenor { padding: 0 1.25rem 0.75rem; }

        .cpm-img-preview { position: relative; margin: 0 1.25rem 0.75rem; border-radius: var(--radius-md); overflow: hidden; max-height: 200px; }
        .cpm-img-preview-img { width: 100%; height: 200px; object-fit: cover; display: block; }
        .cpm-img-remove { position: absolute; top: 0.5rem; right: 0.5rem; width: 28px; height: 28px; background: rgba(0,0,0,0.7); color: #fff; border: none; border-radius: 50%; cursor: pointer; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; }
        .cpm-file { display: none; }

        .cpm-footer { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; border-top: 1px solid var(--border); }
        .cpm-count { font-size: 0.75rem; color: var(--text-muted); }
        .cpm-submit {
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
        .cpm-submit:hover:not(:disabled) { background: var(--accent-dim); }
        .cpm-submit:disabled { background: var(--bg-overlay); color: var(--text-muted); cursor: not-allowed; }
      `}</style>
    </div>
  )
}
