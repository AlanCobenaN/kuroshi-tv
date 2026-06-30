import type { Metadata } from 'next'
import { scheduleApi } from '@/lib/api'
import { ScheduleDay } from '@/types'
import { CalendarioClient } from './CalendarioClient'
import { Footer } from '@/components/layout/Footer'

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'

export const metadata: Metadata = {
  title: 'Calendario de Emisión',
  description: 'Calendario de episodios de anime. Descubrí qué sale hoy, mañana y esta semana.',
  alternates: { canonical: '/calendario' },
  openGraph: {
    title: 'Calendario de Emisión | Kuroshi.lat',
    description: 'Calendario de episodios de anime. Descubrí qué sale hoy, mañana y esta semana.',
    url: `${BASE_URL}/calendario`,
    images: [{ url: '/og-default.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calendario de Emisión | Kuroshi.lat',
    description: 'Calendario de episodios de anime.',
    images: ['/og-default.svg'],
  },
}

export default async function CalendarioPage() {
  let schedule: ScheduleDay[] = []
  try {
    schedule = await scheduleApi.get()
  } catch {}

  return (
    <div className="calendario-page">
      <div className="calendario-header">
        <h1 className="calendario-title">Calendario de Emisión</h1>
        <p className="calendario-subtitle">Episodios próximos sincronizados con AniList</p>
      </div>
      <div className="calendario-grid-wrapper">
        <CalendarioClient initialSchedule={schedule} />
      </div>
      <Footer />
      <style>{`
        .calendario-page {
          padding: 1.5rem 0 3rem;
        }
        .calendario-header {
          text-align: center;
          margin-bottom: 1.5rem;
          max-width: 960px;
          margin-left: auto;
          margin-right: auto;
          padding: 0 1rem;
        }
        .calendario-title {
          font-family: var(--font-display);
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0 0 0.375rem;
        }
        .calendario-subtitle {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin: 0;
        }
        .calendario-grid-wrapper {
          padding: 0 0.75rem;
        }
      `}</style>
    </div>
  )
}
