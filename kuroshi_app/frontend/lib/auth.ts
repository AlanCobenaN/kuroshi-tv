// ============================================================
// KUROSHI.LAT — lib/auth.ts
// Configuración de NextAuth.js
//
// Proveedores: Google OAuth, Discord OAuth, Credentials (email)
// El token JWT de NestJS se almacena en la sesión de NextAuth
// para usarlo en las llamadas a la API REST
// ============================================================

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { authApi } from './api'
import { User } from '@/types'

declare module 'next-auth' {
  interface Session {
    accessToken: string
    provider?: string
    user: {
      id: string
      username: string
      email: string
      role: string
      avatar_url?: string
      email_verified: boolean
    image?: string
    }
  }

  interface User {
    accessToken: string
    username: string
    role: string
    avatar_url?: string
    email_verified?: boolean
    image?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string
    username: string
    role: string
    userId: string
    avatar_url?: string
    provider?: string
    email_verified: boolean
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    // ── Credenciales (email + contraseña) ────────────────────
    CredentialsProvider({
      id: 'credentials',
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
        turnstileToken: { label: 'Turnstile', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const response = await authApi.login({
            email: credentials.email,
            password: credentials.password,
            turnstileToken: credentials.turnstileToken,
          }) as { access_token: string; user: User }

          if (response.access_token && response.user) {
            return {
              id: response.user.id,
              email: response.user.email,
              name: response.user.username,
              username: response.user.username,
              role: response.user.role,
              avatar_url: response.user.avatar_url,
              image: response.user.avatar_url,
              accessToken: response.access_token,
              email_verified: response.user.email_verified ?? false,
            }
          }
          return null
        } catch {
          return null
        }
      },
    }),

    // ── JWT de Kuroshi (para OAuth vía backend) ─────────────
    CredentialsProvider({
      id: 'kuroshi',
      name: 'Kuroshi Token',
      credentials: {
        token: { label: 'Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null
        try {
          const res = await fetch(`${process.env.INTERNAL_API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${credentials.token}` },
          })
          if (!res.ok) return null
          const user = await res.json()
          return {
            id: user.id,
            email: user.email,
            name: user.username,
            username: user.username,
            role: user.role,
            avatar_url: user.avatarUrl,
            image: user.avatarUrl,
            accessToken: credentials.token,
            email_verified: user.emailVerified ?? true,
          }
        } catch {
          return null
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account, trigger, session: sessionData }) {
      if (user) {
        token.accessToken = (user as any).accessToken ?? token.accessToken
        token.username = (user as any).username ?? user.name ?? ''
        token.role = (user as any).role ?? 'usuario'
        token.userId = user.id
        token.email_verified = (user as any).email_verified ?? false
        const avatarUrl = (user as any).avatar_url ?? (user as any).image ?? undefined
        token.avatar_url = avatarUrl
        token.picture = avatarUrl ?? null
      }

      if (trigger === 'update') {
        const updatedAvatar = sessionData?.avatar_url ?? sessionData?.image
        if (updatedAvatar) {
          token.avatar_url = updatedAvatar
          token.picture = updatedAvatar
        }
      }

      if (account?.provider) {
        token.provider = account.provider
      }

      return token
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.provider = token.provider
      const resolvedAvatar = token.avatar_url ?? token.picture ?? undefined
      session.user = {
        id: token.userId,
        username: token.username,
        email: session.user.email ?? '',
        role: token.role,
        avatar_url: resolvedAvatar,
        image: resolvedAvatar,
        email_verified: token.email_verified,
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',
}
