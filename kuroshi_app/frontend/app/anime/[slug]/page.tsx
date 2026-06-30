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
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd'
import { AnimeJsonLd } from '@/components/seo/AnimeJsonLd'
import { WebPageJsonLd } from '@/components/seo/WebPageJsonLd'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'

interface Props {
  params: Promise<{ slug: string }>
}

function buildKeywords(anime: Anime): string[] {
  const keywords = new Set<string>()
  keywords.add(anime.title_es.toLowerCase())
  if (anime.title_en) keywords.add(anime.title_en.toLowerCase())
  if (anime.title_jp) keywords.add(anime.title_jp.toLowerCase())
  if (anime.aliases) anime.aliases.forEach(a => keywords.add(a.toLowerCase()))
  keywords.add(`ver ${anime.title_es.toLowerCase()} online`)
  keywords.add(`${anime.title_es.toLowerCase()} anime`)
  keywords.add(`ver ${anime.title_es.toLowerCase()} sub español`)
  if (anime.genres) anime.genres.forEach(g => keywords.add(g.name.toLowerCase()))
  keywords.add('anime online')
  keywords.add('ver anime gratis')
  keywords.add('kuroshi')
  return Array.from(keywords)
}

function buildDescription(anime: Anime): string {
  const parts: string[] = []
  if (anime.synopsis) parts.push(anime.synopsis.slice(0, 160))
  const titleVariants = [anime.title_es]
  if (anime.title_en) titleVariants.push(anime.title_en)
  if (anime.title_jp) titleVariants.push(anime.title_jp)
  parts.push(`Ver ${titleVariants.join(', ')} online en Kuroshi.lat`)
  return parts.join(' — ')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const anime = await animeApi.getBySlug(slug) as Anime
    const title = `${anime.title_es} — Ver anime online`
    return {
      title,
      description: buildDescription(anime),
      keywords: buildKeywords(anime),
      openGraph: {
        title: anime.title_es,
        description: anime.synopsis?.slice(0, 160) ?? `Ver ${anime.title_es} online en Kuroshi.tv`,
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
      <BreadcrumbJsonLd items={[
        { name: 'Inicio', item: BASE_URL },
        { name: 'Anime', item: `${BASE_URL}/anime` },
        { name: anime.title_es, item: `${BASE_URL}/anime/${slug}` },
      ]} />
      <AnimeJsonLd anime={anime} />
      <WebPageJsonLd
        name={`${anime.title_es} — Ver anime online | Kuroshi.lat`}
        description={anime.synopsis?.slice(0, 300) ?? `Ver ${anime.title_es} online en Kuroshi.tv`}
        url={`${BASE_URL}/anime/${slug}`}
        mainEntity={{
          '@type': (anime as any).type === 'pelicula' ? 'Movie' : 'TVSeries',
          name: anime.title_es,
          url: `${BASE_URL}/anime/${slug}`,
        }}
        breadcrumb={{
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/anime/${slug}#breadcrumb`,
        }}
      />
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
