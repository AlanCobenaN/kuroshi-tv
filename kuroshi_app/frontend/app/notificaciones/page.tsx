// app/notificaciones/page.tsx
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { usersApi } from '@/lib/api'
import { Notification, PaginatedResponse } from '@/types'
import { NotificationsClient } from './NotificationsClient'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'Notificaciones',
  description: 'Tus notificaciones en Kuroshi.tv',
}

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  let initial: Notification[] = []
  let unread = 0

  try {
    const data = await usersApi.getNotifications({ page: 1 }, session.accessToken) as PaginatedResponse<Notification> | Notification[]
    const items: Notification[] = Array.isArray(data) ? data : (data as PaginatedResponse<Notification>).data ?? []
    initial = items
    unread  = items.filter(n => !n.is_read).length
  } catch {}

  return (
    <>
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <NotificationsClient
          initialNotifications={initial}
          initialUnread={unread}
          userId={session.user.id}
          accessToken={session.accessToken}
          currentUsername={session.user.username}
        />
      </div>
      <Footer />
    </>
  )
}
