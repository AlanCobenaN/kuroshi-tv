// app/layout.tsx
import type { Metadata } from 'next'
import localFont from 'next/font/local'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { TokenProvider } from '@/components/providers/TokenProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

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
export const metadata: Metadata = {
  title: {
    default: 'Kuroshi.lat — Anime + Comunidad',
    template: '%s | Kuroshi.lat',
  },
  description:
    'Plataforma de streaming de anime con red social integrada. Ve anime, comenta al minuto, únete a comunidades de fans.',
  keywords: ['anime', 'streaming', 'comunidad', 'latino', 'kuroshi'],
  openGraph: {
    siteName: 'Kuroshi.lat',
    locale: 'es_LA',
    type: 'website',
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'
  ),
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'monetag': '292505d3a0386646497d135b6ac37745',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="es" className={`${syne.variable} ${dmSans.variable}`}>
      <body>
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
