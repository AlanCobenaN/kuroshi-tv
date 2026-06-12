'use client'
// components/providers/TokenProvider.tsx
// El token de NestJS vive en la sesión de NextAuth (server-side).
// Este provider lo inyecta en window.__kuroshi_token__ para que
// los hooks del cliente puedan usarlo sin prop drilling.

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.accessToken) {
      ;(window as any).__kuroshi_token__ = session.accessToken
    } else {
      delete (window as any).__kuroshi_token__
    }
  }, [session?.accessToken])

  return <>{children}</>
}
