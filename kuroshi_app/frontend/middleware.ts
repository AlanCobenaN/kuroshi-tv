// ============================================================
// KUROSHI.TV — middleware.ts
// Protección de rutas según nivel de autenticación + modo mantenimiento
//
// Rutas protegidas (requieren sesión activa):
//   /notificaciones, /configuracion
//   /u/[username]/lista (escritura)
//   /admin (solo owner/moderador — validación en la página)
// ============================================================

import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const PUBLIC_MAINTENANCE_PATHS = ['/login', '/registro', '/mantenimiento']

export default withAuth(
  async function middleware(req) {
    const { token } = req.nextauth
    const { pathname } = req.nextUrl
    const res = NextResponse.next()

    // Ruta de admin — solo owner y moderador
    if (pathname.startsWith('/admin')) {
      if (!token || !['owner', 'moderador'].includes(token.role as string)) {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    // Verificar modo mantenimiento (solo si el middleware matcher lo cubre)
    const isPublicPath = PUBLIC_MAINTENANCE_PATHS.some(p => pathname.startsWith(p))
    const isAdmin = token && ['owner', 'moderador'].includes(token.role as string)

    if (!isPublicPath && !isAdmin) {
      try {
        const baseUrl = process.env.INTERNAL_API_URL ?? 'http://localhost:4000/api'
        const maintRes = await fetch(`${baseUrl}/admin/maintenance-status`, {
          signal: AbortSignal.timeout(3000),
        })
        if (maintRes.ok) {
          const data = await maintRes.json()
          const maintenanceMode = data.maintenance_mode ?? data.maintenanceMode ?? false
          if (maintenanceMode) {
            return NextResponse.redirect(new URL('/mantenimiento', req.url))
          }
        }
      } catch { /* si falla, se ignora */ }
    }

    return res
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        if (PUBLIC_MAINTENANCE_PATHS.some(p => pathname.startsWith(p))) {
          return true
        }

        const protectedRoutes = [
          '/notificaciones',
          '/configuracion',
          '/admin',
        ]

        const isProtected = protectedRoutes.some(route =>
          pathname.startsWith(route)
        )

        if (isProtected) return !!token
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
