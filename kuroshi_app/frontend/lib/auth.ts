// ============================================================
// KUROSHI.LAT — lib/auth.ts
// Configuración de NextAuth.js
//
// Proveedores: Google OAuth, Discord OAuth, Credentials (email)
// El token JWT de NestJS se almacena en la sesión de NextAuth
// para usarlo en las llamadas a la API REST
// ============================================================

import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import DiscordProvider from 'next-auth/providers/discord'
import CredentialsProvider from 'next-auth/providers/credentials'
import { authApi } from './api'
import { User } from '@/types'

// Extender tipos de NextAuth para incluir nuestros campos
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
    // ── Google OAuth ─────────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: { prompt: 'consent', access_type: 'offline', response_type: 'code' },
      },
    }),

    // ── Discord OAuth (prioritario para el público otaku) ────
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: 'identify email' } },
    }),

    // ── Credenciales (email + contraseña) ────────────────────
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const response = await authApi.login({
            email: credentials.email,
            password: credentials.password,
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
  ],

  callbacks: {
    // ── Conectar OAuth con el backend de NestJS ──────────────
    async signIn({ user, account }) {
      // Para OAuth (Google/Discord), el backend valida el token
      // y crea/actualiza el usuario. El access_token del backend
      // llega como campo extra tras el callback de NestJS.
      // En producción, el flujo OAuth redirige a NestJS primero.
      if (account?.provider === 'google' || account?.provider === 'discord') {
        // El token del proveedor se enviará al endpoint de NestJS
        // GET /auth/google o GET /auth/discord que maneja el callback
        // y devuelve el JWT de Kuroshi. Esto se gestiona vía redirect.
        return true
      }
      return true
    },

    // ── JWT: guardar el access_token de NestJS ───────────────
    async jwt({ token, user, account, trigger, session: sessionData }) {
      // Primera vez que se crea el token (tras login)
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

      // Actualizar token cuando el usuario modifica su perfil
      if (trigger === 'update') {
        const updatedAvatar = sessionData?.avatar_url ?? sessionData?.image
        if (updatedAvatar) {
          token.avatar_url = updatedAvatar
          token.picture = updatedAvatar
        }
      }

      // Guardar proveedor de autenticación
      if (account?.provider) {
        token.provider = account.provider
      }

      // Para OAuth, el backend devuelve el token en el account
      if (account?.access_token && account.provider !== 'credentials') {
        token.accessToken = account.access_token
      }

      return token
    },

    // ── Session: exponer lo necesario al cliente ──────────────
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
    maxAge: 7 * 24 * 60 * 60, // 7 días — mismo que JWT_EXPIRES_IN del backend
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',
}
