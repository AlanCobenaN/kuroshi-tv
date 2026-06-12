'use client'
// hooks/useEpisodePresence.ts
// Canal: presence:episode:{episode_id}
// Propósito: contador "X usuarios viendo ahora" (§3.2)

import { useState, useEffect, useRef } from 'react'
import { episodePresenceChannel } from '@/lib/supabase'

interface UseEpisodePresenceOptions {
  episodeId: string
  userId?: string  // undefined si es visitante
}

export function useEpisodePresence({ episodeId, userId }: UseEpisodePresenceOptions) {
  const [viewerCount, setViewerCount] = useState(0)
  const channelRef = useRef<ReturnType<typeof episodePresenceChannel> | null>(null)

  useEffect(() => {
    const channel = episodePresenceChannel(episodeId)
    if (!channel) return
    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setViewerCount(Object.keys(state).length)
      })
      .on('presence', { event: 'join' }, () => {
        setViewerCount(prev => prev + 1)
      })
      .on('presence', { event: 'leave' }, () => {
        setViewerCount(prev => Math.max(0, prev - 1))
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          const presenceKey = userId ?? `anon-${Math.random().toString(36).slice(2)}`
          await channel.track({ user_id: presenceKey, online_at: new Date().toISOString() })
        }
      })

    return () => {
      channel.untrack()
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [episodeId, userId])

  return { viewerCount }
}
