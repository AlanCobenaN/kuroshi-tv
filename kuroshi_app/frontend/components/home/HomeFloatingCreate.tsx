'use client'

import { useState, useEffect, useRef } from 'react'
import { communitiesApi } from '@/lib/api'
import { CreatePostModal } from '@/app/comunidades/CreatePostModal'

interface Props {
  accessToken?: string
}

export function HomeFloatingCreate({ accessToken }: Props) {
  const [showFab, setShowFab] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [myComms, setMyComms] = useState<{ slug: string; name: string }[]>([])
  const sentinelRef = useRef<HTMLDivElement>(null)
  const fetched = useRef(false)

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

  const handleOpen = async () => {
    if (!accessToken) return
    if (!fetched.current) {
      fetched.current = true
      try {
        const data = await communitiesApi.getMyCommunities(accessToken)
        const list = Array.isArray(data) ? data : (data as any)?.data ?? []
        setMyComms(list.map((c: any) => ({ slug: c.slug, name: c.name })))
      } catch {}
    }
    setShowModal(true)
  }

  if (!accessToken) return null

  return (
    <>
      <button
        onClick={handleOpen}
        className={`home-fab ${showFab ? 'home-fab--visible' : ''}`}
        aria-label="Crear publicación"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {showModal && (
        <CreatePostModal
          selectedSlug={null}
          accessToken={accessToken}
          onClose={() => setShowModal(false)}
          communities={myComms.length > 0 ? myComms : undefined}
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
        @media (max-width: 768px) {
          .home-fab { bottom: 1.5rem; right: 1.5rem; width: 48px; height: 48px; }
        }
      `}</style>
    </>
  )
}
