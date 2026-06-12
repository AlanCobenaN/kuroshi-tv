'use client'
// hooks/useNotifications.ts
// ✅ CORREGIDO: maneja userNotificationsChannel null gracefully

import { useState, useEffect, useRef, useCallback } from 'react'
import { userNotificationsChannel } from '@/lib/supabase'
import { WsNotification, Notification } from '@/types'
import { usersApi } from '@/lib/api'

interface UseNotificationsOptions {
  userId: string
  accessToken: string
}

export function useNotifications({ userId, accessToken }: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const [isLoading, setIsLoading]         = useState(true)

  // Cargar notificaciones iniciales vía REST
  useEffect(() => {
    setIsLoading(true)
    usersApi
      .getNotifications({ page: 1 }, accessToken)
      .then((data: any) => {
        const items: Notification[] = Array.isArray(data) ? data : data.data ?? []
        setNotifications(items)
        setUnreadCount(data.unreadCount ?? items.filter((n: Notification) => !n.is_read).length)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [accessToken])

  // Suscribirse al canal user:{id} para notificaciones push
  useEffect(() => {
    if (!userId) return

    const channel = userNotificationsChannel(userId)

    // ✅ Si Supabase no está configurado, las notificaciones
    // siguen funcionando vía REST (polling manual o refresh)
    if (!channel) return

    channel
      .on('broadcast', { event: 'notification' }, ({ payload }: { payload: WsNotification }) => {
        const newNotif: Notification = {
          id:            payload.id,
          user_id:       userId,
          type:          payload.type,
          title:         payload.title,
          body:          payload.body,
          is_read:       false,
          stacked_count: 1,
          metadata:      payload.metadata,
          created_at:    payload.created_at ?? new Date().toISOString(),
        }

        setNotifications(prev => [newNotif, ...prev])
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [userId])

  const markAllRead = useCallback(async () => {
    try {
      await usersApi.markAllNotificationsRead(accessToken)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {}
  }, [accessToken])

  return { notifications, unreadCount, isLoading, markAllRead }
}