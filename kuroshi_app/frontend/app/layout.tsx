// app/layout.tsx
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { TokenProvider } from '@/components/providers/TokenProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { JsonLd } from '@/components/seo/JsonLd'

import { Header } from '@/components/layout/Header'
import { SubNav } from '@/components/layout/SubNav'
import './globals.css'

const syne = localFont({
  src: '../public/fonts/Syne.woff2',
  variable: '--font-syne',
  weight: '400 800',
  display: 'swap',
})

const dmSans = localFont({
  src: '../public/fonts/DM_Sans.woff2',
  variable: '--font-dm-sans',
  weight: '300 500',
  display: 'swap',
})

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'

export const metadata: Metadata = {
  title: {
    default: 'Kuroshi.lat — Anime + Comunidad',
    template: '%s | Kuroshi.lat',
  },
  description:
    'Plataforma de streaming de anime con red social integrada. Ve anime, comenta al minuto, únete a comunidades de fans. Kuroshi es el hogar de la comunidad anime latinoamericana.',
  keywords: ['anime', 'streaming anime', 'ver anime online', 'comunidad anime', 'anime latino', 'kuroshi', 'anime sub español', 'anime online gratis'],
  metadataBase: new URL(BASE_URL),
  openGraph: {
    siteName: 'Kuroshi.lat',
    locale: 'es_LA',
    type: 'website',
    title: 'Kuroshi.lat — Anime + Comunidad',
    description:
      'Plataforma de streaming de anime con red social integrada. Ve anime, comenta al minuto exacto del video, únete a comunidades de fans.',
    url: BASE_URL,
    images: [{ url: '/og-default.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kuroshi.lat — Anime + Comunidad',
    description:
      'Plataforma de streaming de anime con red social integrada. Ve anime, comenta al minuto, únete a comunidades.',
    images: ['/og-default.svg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
  alternates: {
    canonical: BASE_URL,
  },
  other: {
    'monetag': '292505d3a0386646497d135b6ac37745',
    'google-site-verification': 'ZgiALJv64eMU_Qt8jZAzJSiAyZaMEYlu1SzZ-8QwHtU',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Kuroshi.lat',
    url: BASE_URL,
    description:
      'Plataforma de streaming de anime con red social integrada.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/buscar?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kuroshi.lat',
    url: BASE_URL,
    logo: `${BASE_URL}/og-default.svg`,
    description: 'Streaming de anime y comunidad para Latinoamérica.',
  }

  return (
    <html lang="es" className={`${syne.variable} ${dmSans.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <Script
          src="https://quge5.com/88/tag.min.js"
          data-zone="253345"
          strategy="beforeInteractive"
          data-cfasync="false"
        />
        </head>
      <body>
        <JsonLd data={websiteJsonLd} />
        <JsonLd data={organizationJsonLd} />
        <SessionProvider session={session}>
          <TokenProvider>
            <ThemeProvider>
              <Header />
              <SubNav />
              <main className="page-content">
                {children}
              </main>
            </ThemeProvider>
          </TokenProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
