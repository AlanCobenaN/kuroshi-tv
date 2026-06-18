// app/page.tsx
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { animeApi, usersApi } from '@/lib/api'
import { HeroSection } from '@/components/home/HeroSection'
import { LatestEpisodes } from '@/components/home/LatestEpisodes'
import { TrendingSection } from '@/components/home/TrendingSection'
import { AiringCarousel } from '@/components/home/AiringCarousel'
import { ContinueWatchingSection } from '@/components/home/ContinueWatchingSection'
import { PendingSection } from '@/components/home/PendingSection'
import { Footer } from '@/components/layout/Footer'
import { FeedWithAds } from '@/components/ads/FeedWithAds'
import { AdBanner } from '@/components/ads/AdBanner'
import { HomeFloatingCreate } from '@/components/home/HomeFloatingCreate'
import { Anime, AnimeSummary } from '@/types'

export const metadata: Metadata = {
  description:
    'Ve anime, comenta al minuto exacto del video y únete a comunidades de fans. La plataforma de streaming de anime para la comunidad latinoamericana.',
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  const token = session?.accessToken

  // Fetch paralelo de todos los datos necesarios
  const username = session?.user?.username

  const [trendingRes, airingRes, continueWatchingRes, watchlistRes] = await Promise.allSettled([
    animeApi.getTrending(),
    animeApi.getAiring(),
    token ? usersApi.getContinueWatching(token) : Promise.resolve(undefined),
    token && username ? usersApi.getWatchlist(username, token) : Promise.resolve(undefined),
  ])

  const trending = trendingRes.status === 'fulfilled'
    ? (trendingRes.value as AnimeSummary[])
    : []

  const airing = airingRes.status === 'fulfilled'
    ? (airingRes.value as (AnimeSummary & { latest_episode?: { number: number; air_date: string } })[])
    : []

  const continueWatching = continueWatchingRes.status === 'fulfilled'
    ? (continueWatchingRes.value as any[]) ?? []
    : []

  const watchlistData = watchlistRes.status === 'fulfilled'
    ? (watchlistRes.value as any) ?? {}
    : {}
  const pendingItems = watchlistData.grouped?.pendiente ?? []

  // El hero usa el primer anime en tendencias
  const heroAnime = trending[0] as (Anime & { synopsis?: string }) | undefined

  return (
    <>
      <div className="home-page">
        {/* Hero con el anime más popular */}
        {heroAnime && <HeroSection anime={heroAnime} />}

        <div className="home-content container">
          {/* Continuar viendo — solo para usuarios logueados con progreso */}
          {continueWatching.length > 0 && (
            <ContinueWatchingSection items={continueWatching} />
          )}

          {/* Pendientes — solo para usuarios logueados con lista pendiente */}
          {pendingItems.length > 0 && (
            <PendingSection items={pendingItems} username={username} />
          )}

          {/* Animes en emisión — carrusel horizontal */}
          {airing.length > 0 && (
            <section className="home-section" aria-labelledby="airing-title">
              <AiringCarousel animes={airing} />
            </section>
          )}

          {/* Anuncio horizontal */}
          <section className="home-section" aria-label="Publicidad">
            <AdBanner />
          </section>

          {/* Últimos episodios */}
          <section className="home-section" aria-labelledby="latest-title">
            <LatestEpisodes />
          </section>

          {/* Tendencias de la semana */}
          {trending.length > 0 && (
            <section className="home-section" aria-labelledby="trending-title">
              <TrendingSection animes={trending} />
            </section>
          )}

          {/* Sentinel para el floating button */}
          <div id="trending-sentinel" aria-hidden="true" />
        </div>

        {/* Feed de comunidades con anuncios verticales — full-width */}
        <section className="home-section home-section--feed" aria-label="Feed de la comunidad">
          <FeedWithAds isLoggedIn={!!session} accessToken={token ?? undefined} />
        </section>
      </div>

      <HomeFloatingCreate accessToken={token ?? undefined} />

      <Footer />
    </>
  )
}
