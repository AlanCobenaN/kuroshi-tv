'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface MiniPlayerState {
  embedUrl: string
  serverName: string
  animeTitle: string
  animeSlug: string
  episodeNumber: number
}

interface MiniPlayerContextValue {
  player: MiniPlayerState | null
  minimize: (data: MiniPlayerState) => void
  expand: () => void
  close: () => void
}

const STORAGE_KEY = 'kuroshi_miniplayer'

const MiniPlayerContext = createContext<MiniPlayerContextValue | null>(null)

export function MiniPlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<MiniPlayerState | null>(null)
  const router = useRouter()

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setPlayer(JSON.parse(saved))
    } catch {}
  }, [])

  const minimize = useCallback((data: MiniPlayerState) => {
    setPlayer(data)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
  }, [])

  const expand = useCallback(() => {
    if (!player) return
    router.push(`/anime/${player.animeSlug}/episodio/${player.episodeNumber}`)
  }, [player, router])

  const close = useCallback(() => {
    setPlayer(null)
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }, [])

  return (
    <MiniPlayerContext.Provider value={{ player, minimize, expand, close }}>
      {children}
    </MiniPlayerContext.Provider>
  )
}

export function useMiniPlayer() {
  const ctx = useContext(MiniPlayerContext)
  if (!ctx) throw new Error('useMiniPlayer must be inside MiniPlayerProvider')
  return ctx
}
