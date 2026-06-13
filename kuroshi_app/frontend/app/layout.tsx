// app/layout.tsx
import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { TokenProvider } from '@/components/providers/TokenProvider'

import { Header } from '@/components/layout/Header'
import { SubNav } from '@/components/layout/SubNav'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
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
            <Header />
            <SubNav />
            <main className="page-content">
              {children}
            </main>
          </TokenProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
