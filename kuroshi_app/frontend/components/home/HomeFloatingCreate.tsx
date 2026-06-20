'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { communitiesApi, usersApi } from '@/lib/api'
import { CreatePostModal } from '@/app/comunidades/CreatePostModal'

interface Props {
  accessToken?: string
}

function HomeProfilePostModal({ accessToken, onClose }: { accessToken: string; onClose: () => void }) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

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
    setContent(content.substring(0, start) + prefix + selected + suffix + content.substring(end))
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
    }, 0)
  }, [content])

  const handleSubmit = async () => {
    if (!content.trim() || sending) return
    setSending(true)
    try {
      await usersApi.createPost({ content: content.trim() }, accessToken)
      onClose()
    } catch {} finally { setSending(false) }
  }

  return (
    <div className="hpm-overlay">
      <div className="hpm-modal" ref={modalRef} role="dialog" aria-modal="true" aria-label="Publicar en mi perfil">
        <div className="hpm-header">
          <h2 className="hpm-title">Publicar en mi perfil</h2>
          <button onClick={onClose} className="hpm-close" aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div className="hpm-toolbar">
          <button onClick={() => wrapText('**', '**')} className="hpm-tb-btn" title="Negrita" aria-label="Negrita">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" /></svg>
          </button>
          <button onClick={() => wrapText('*', '*')} className="hpm-tb-btn" title="Cursiva" aria-label="Cursiva">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" /></svg>
          </button>
          <button onClick={() => wrapText('***', '***')} className="hpm-tb-btn" title="Negrita + Cursiva" aria-label="Negrita y cursiva">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" /></svg>
          </button>
          <button onClick={() => wrapText('~~', '~~')} className="hpm-tb-btn" title="Tachado" aria-label="Tachado">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 12h12M3 6l2.5 3M21 6l-2.5 3M12 18V6" /></svg>
          </button>
          <button onClick={() => wrapText('__', '__')} className="hpm-tb-btn" title="Subrayado" aria-label="Subrayado">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3M4 21h16" /></svg>
          </button>
          <span className="hpm-tb-sep" />
          <button onClick={() => wrapText('<small>', '</small>')} className="hpm-tb-btn" title="Pequeño" aria-label="Texto pequeño">T<sub>s</sub></button>
          <button onClick={() => wrapText('<large>', '</large>')} className="hpm-tb-btn" title="Grande" aria-label="Texto grande">T<sup>l</sup></button>
          <button onClick={() => wrapText('<xlarge>', '</xlarge>')} className="hpm-tb-btn" title="Extra grande" aria-label="Texto extra grande">T<sup>xl</sup></button>
        </div>
        <div className="hpm-editor">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="¿Qué estás pensando?"
            className="hpm-textarea"
            rows={8}
            maxLength={2000}
            disabled={sending}
          />
        </div>
        <div className="hpm-footer">
          <span className="hpm-count">{content.length}/2000</span>
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || sending}
            className="hpm-submit"
          >
            {sending ? 'Publicando…' : 'Publicar'}
          </button>
        </div>
      </div>

      <style>{`
        .hpm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 1rem; }
        .hpm-modal { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl); width: 100%; max-width: 600px; max-height: 90dvh; overflow-y: auto; box-shadow: var(--shadow-lg); }
        .hpm-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); }
        .hpm-title { font-family: var(--font-display); font-size: 1rem; font-weight: 700; margin: 0; color: var(--text-primary); }
        .hpm-close { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 0.25rem; border-radius: 50%; display: flex; }
        .hpm-close:hover { color: var(--text-primary); }
        .hpm-toolbar { display: flex; align-items: center; gap: 0.25rem; padding: 0.5rem 1.25rem; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
        .hpm-tb-btn { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: transparent; border: none; border-radius: var(--radius-md); color: var(--text-muted); cursor: pointer; font-family: var(--font-display); font-size: 0.75rem; transition: all var(--transition-fast); }
        .hpm-tb-btn:hover { background: var(--bg-overlay); color: var(--text-secondary); }
        .hpm-tb-sep { width: 1px; height: 20px; background: var(--border); margin: 0 0.25rem; }
        .hpm-editor { padding: 0.5rem 1.25rem; }
        .hpm-textarea { width: 100%; padding: 0.5rem 0; background: transparent; border: none; outline: none; color: var(--text-primary); font-family: var(--font-body); font-size: 0.9375rem; line-height: 1.6; resize: none; min-height: 120px; }
        .hpm-textarea::placeholder { color: var(--text-muted); }
        .hpm-footer { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; border-top: 1px solid var(--border); }
        .hpm-count { font-size: 0.75rem; color: var(--text-muted); }
        .hpm-submit { padding: 0.5rem 1.5rem; background: var(--accent); color: #fff; font-family: var(--font-display); font-size: 0.875rem; font-weight: 700; border: none; border-radius: var(--radius-md); cursor: pointer; transition: background var(--transition-fast); }
        .hpm-submit:hover:not(:disabled) { background: var(--accent-dim); }
        .hpm-submit:disabled { background: var(--bg-overlay); color: var(--text-muted); cursor: not-allowed; }
      `}</style>
    </div>
  )
}

export function HomeFloatingCreate({ accessToken }: Props) {
  const [showFab, setShowFab] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCommunityModal, setShowCommunityModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [myComms, setMyComms] = useState<{ slug: string; name: string }[]>([])
  const fetchedComms = useRef(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession()
  const username = session?.user?.username

  useEffect(() => {
    const el = document.getElementById('trending-sentinel')
    if (!el) return
    const onScroll = () => {
      const rect = el.getBoundingClientRect()
      if (rect.top <= 0) setShowFab(true)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!showDropdown) return
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showDropdown])

  const handleOpenCommunityModal = async () => {
    setShowDropdown(false)
    if (!accessToken) return
    if (!fetchedComms.current) {
      fetchedComms.current = true
      try {
        const data = await communitiesApi.getMyCommunities(accessToken)
        const list = Array.isArray(data) ? data : (data as any)?.data ?? []
        setMyComms(list.map((c: any) => ({ slug: c.slug, name: c.name })))
      } catch {}
    }
    setShowCommunityModal(true)
  }

  if (!accessToken) return null

  return (
    <>
      <button
        onClick={() => setShowDropdown(prev => !prev)}
        className={`home-fab ${showFab ? 'home-fab--visible' : ''}`}
        aria-label="Crear publicación"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {showDropdown && (
        <div className="home-fab-dropdown" ref={dropdownRef}>
          <button className="hfd-item" onClick={handleOpenCommunityModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            Postear en comunidad
          </button>
          {username && (
            <Link href={`/u/${username}`} className="hfd-item" onClick={() => setShowDropdown(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              Ir a mi perfil
            </Link>
          )}
          <button className="hfd-item" onClick={() => { setShowDropdown(false); setShowProfileModal(true) }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            Postear en mi perfil
          </button>
        </div>
      )}

      {showCommunityModal && (
        <CreatePostModal
          selectedSlug={null}
          accessToken={accessToken}
          onClose={() => setShowCommunityModal(false)}
          communities={myComms.length > 0 ? myComms : undefined}
        />
      )}

      {showProfileModal && (
        <HomeProfilePostModal
          accessToken={accessToken}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      <style>{`
        .home-fab {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 56px;
          height: 56px;
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(230,57,70,0.4);
          transition: opacity var(--transition-normal), transform var(--transition-fast), box-shadow var(--transition-fast);
          opacity: 0;
          transform: scale(0.8);
          pointer-events: none;
          z-index: 100;
        }
        .home-fab--visible {
          opacity: 1;
          transform: scale(1);
          pointer-events: auto;
        }
        .home-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 24px rgba(230,57,70,0.5);
        }
        .home-fab-dropdown {
          position: fixed;
          bottom: 5.5rem;
          right: 1.5rem;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          z-index: 101;
          min-width: 200px;
          overflow: hidden;
        }
        .hfd-item {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: all var(--transition-fast);
        }
        .hfd-item:hover { background: var(--bg-hover); color: var(--text-primary); }
        .hfd-item svg { flex-shrink: 0; }
        @media (max-width: 768px) {
          .home-fab { bottom: 1.5rem; right: 1.5rem; width: 48px; height: 48px; }
          .home-fab-dropdown { right: 1rem; bottom: 4.5rem; min-width: 180px; }
        }
      `}</style>
    </>
  )
}
