'use client'
// hooks/useFriendshipRealtime.ts
import { useEffect } from 'react'
import { userNotificationsChannel } from '@/lib/supabase'

export interface FriendshipUpdatePayload {
  friendship_id: string
  status: 'pendiente' | 'aceptada' | 'rechazada'
  actor_id: string
  other_user_id: string
  other_username: string
  other_avatar_url?: string
}

export function useFriendshipRealtime(
  userId: string | undefined,
  onUpdate: (payload: FriendshipUpdatePayload) => void
) {
  useEffect(() => {
    if (!userId) return

    const channel = userNotificationsChannel(userId)
    if (!channel) return

    channel
      .on('broadcast', { event: 'friendship_update' }, ({ payload }: { payload: FriendshipUpdatePayload }) => {
        onUpdate(payload)
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userId, onUpdate])
}
