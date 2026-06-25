// app/anime/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { animeApi, authApi } from '@/lib/api'
import { Anime, User } from '@/types'
import { AnimeBanner } from './AnimeBanner'
import { AnimeInfo } from './AnimeInfo'
import { EpisodeList } from './EpisodeList'
import { AnimeActions } from './AnimeActions'
import { RelatedAnimes } from './RelatedAnimes'
import { Footer } from '@/components/layout/Footer'
import { AnimeDetailWithAds } from '@/components/ads/AnimeDetailWithAds'
import { AdBanner } from '@/components/ads/AdBanner'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const anime = await animeApi.getBySlug(slug) as Anime
    return {
      title: `${anime.title_es} — Ver anime online`,
      description: anime.synopsis?.slice(0, 160) ?? `Ver ${anime.title_es} online en Kuroshi.tv`,
      openGraph: {
        title: anime.title_es,
        description: anime.synopsis?.slice(0, 160),
        url: `${BASE_URL}/anime/${slug}`,
        images: anime.banner_url ? [{ url: anime.banner_url }] : [{ url: anime.cover_url }],
      },
      twitter: {
        card: 'summary_large_image',
        title: anime.title_es,
        description: anime.synopsis?.slice(0, 160),
        images: anime.banner_url ? [anime.banner_url] : [anime.cover_url],
      },
      alternates: {
        canonical: `/anime/${slug}`,
      },
    }
  } catch {
    return { title: 'Anime no encontrado' }
  }
}

export default async function AnimeDetailPage({ params }: Props) {
  const { slug } = await params
  const session  = await getServerSession(authOptions)

  // Obtener el anime favorito del usuario autenticado
  let favoriteAnimeId: string | undefined
  if (session?.accessToken) {
    try {
      const me = await authApi.me(session.accessToken) as User
      favoriteAnimeId = me.favorite_anime_id
    } catch {
      // Si falla, simplemente no mostramos favorito
    }
  }

  let anime: Anime
  try {
    anime = await animeApi.getBySlug(slug, session?.accessToken) as Anime
  } catch {
    notFound()
  }

  // Fetch de episodios: Api devuelve seasons con episodios anidados
  let episodesData: any = { data: [] }
  try {
    episodesData = await animeApi.getEpisodes(slug, { order: 'asc' })
  } catch {
    // episodesData permanece vacío
  }

  const seasonsWithEpisodes = Array.isArray(episodesData) ? episodesData : episodesData.data ?? []
  const episodes: any[] = []
  for (const season of seasonsWithEpisodes) {
    for (const ep of (season.episodes ?? [])) {
      episodes.push({ ...ep, season_id: season.id, season_number: season.number })
    }
  }

  return (
    <>
      <div className="anime-detail-page">
        {/* Banner a sangre con overlay */}
        <AnimeBanner anime={anime} />

        {/* Contenido principal */}
        <AnimeDetailWithAds>
          <div className="anime-detail-body" style={{ position: 'relative', zIndex: 1 }}>
            <div className="anime-detail-layout">
              {/* Columna izquierda: poster + acciones */}
              <aside className="anime-detail-sidebar">
                <AnimeActions anime={anime} isLoggedIn={!!session} favoriteAnimeId={favoriteAnimeId} />
              </aside>

              {/* Columna principal: info + episodios */}
              <main className="anime-detail-main">
                <AnimeInfo anime={anime} isLoggedIn={!!session} />

                <AdBanner />

                <div className="anime-detail-episodes">
                  <EpisodeList
                    animeSlug={slug}
                    seasons={anime.seasons ?? []}
                    initialEpisodes={episodes}
                    userProgress={anime.user_progress}
                  />
                </div>
              </main>
            </div>

            {/* Relacionados */}
            <RelatedAnimes currentAnime={anime} />
          </div>
        </AnimeDetailWithAds>
      </div>

      <Footer />
    </>
  )
}
