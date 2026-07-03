// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Imgur — imágenes de usuarios y posts
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'imgur.com' },

      // CDN de banners/covers de MAL y AniList
      { protocol: 'https', hostname: 'cdn.myanimelist.net' },
      { protocol: 'https', hostname: 'api.myanimelist.net' },
      { protocol: 'https', hostname: 's4.anilist.co' },

      // Avatares de OAuth (Google, Discord)
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'cdn.discordapp.com' },

      // Cloudinary — imágenes subidas por el panel admin y usuarios
      { protocol: 'https', hostname: 'res.cloudinary.com' },

      // Self-hosted (para cuando sirvan imágenes del propio servidor)
      { protocol: 'https', hostname: 'kuroshi.lat' },
    ],
    // Formatos modernos
    formats: ['image/avif', 'image/webp'],
  },

  // Reescrituras para el proxy de la API (desarrollo)
  async rewrites() {
    return [
      // En dev, redirige /api/* al backend NestJS
      {
        source: '/backend/:path*',
        destination: `${process.env.INTERNAL_API_URL ?? 'http://localhost:4000/api'}/:path*`,
      },
    ]
  },

  // Headers de seguridad + caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), notifications=(), push=(), midi=(), sync-xhr=(), accelerometer=(), gyroscope=(), magnetometer=(), ambient-light-sensor=(), bluetooth=(), usb=(), serial=(), payment=(), autoplay=(self), fullscreen=*, picture-in-picture=*' },
        ],
      },
      // Cache estáticos largos (fonts, images, svg)
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/og-default.svg',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },
      // sw.js (Monetag service worker) — no cachear
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ]
  },

  // Evitar exponer datos del servidor al bundle del cliente
  serverExternalPackages: [],

  // Strict mode en dev para detectar problemas
  reactStrictMode: true,
}

export default nextConfig
