// app/anime/[slug]/episodio/[number]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { animeApi } from '@/lib/api'
import { Anime, AnimeSummary, Episode } from '@/types'
import { EpisodePlayerClient } from './EpisodePlayerClient'
import { Footer } from '@/components/layout/Footer'
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd'
import { EpisodeJsonLd } from '@/components/seo/EpisodeJsonLd'
import { WebPageJsonLd } from '@/components/seo/WebPageJsonLd'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'

interface Props {
  params: Promise<{ slug: string; number: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, number } = await params
  const epNum = parseInt(number, 10)

  try {
    const episode = await animeApi.getEpisode(slug, epNum) as Episode & { anime?: Anime }
    const animeTitle = episode.anime?.title_es ?? slug
    const title = `Ver ${animeTitle} — Episodio ${epNum}${episode.title ? ': ' + episode.title : ''} | Kuroshi.lat`
    const description = episode.synopsis ?? `Ver episodio ${epNum} de ${animeTitle} en Kuroshi.tv`
    const keywords = [
      animeTitle.toLowerCase(),
      `episodio ${epNum} ${animeTitle.toLowerCase()}`,
      `ver ${animeTitle.toLowerCase()} episodio ${epNum}`,
      `${animeTitle.toLowerCase()} capitulo ${epNum}`,
      `${animeTitle.toLowerCase()} sub español`,
      'anime online',
      'ver anime gratis',
    ]

    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        url: `${BASE_URL}/anime/${slug}/episodio/${epNum}`,
        type: 'video.episode',
        siteName: 'Kuroshi.lat',
        images: [{ url: episode.thumbnail_url ?? episode.anime?.banner_url ?? episode.anime?.cover_url ?? '/og-default.svg', width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [episode.thumbnail_url ?? episode.anime?.banner_url ?? episode.anime?.cover_url ?? '/og-default.svg'],
      },
      alternates: {
        canonical: `/anime/${slug}/episodio/${epNum}`,
      },
    }
  } catch {
    return { title: `Episodio ${epNum}` }
  }
}

export default async function EpisodePlayerPage({ params }: Props) {
  const { slug, number } = await params
  const epNum = parseInt(number, 10)

  if (isNaN(epNum)) notFound()

  const session = await getServerSession(authOptions)

  // Fetch paralelo: datos del episodio + lista de episodios para la navegación
  const [episodeRes, allEpisodesRes, animeRes] = await Promise.allSettled([
    animeApi.getEpisode(slug, epNum, undefined, session?.accessToken),
    animeApi.getEpisodes(slug, { order: 'asc' }),
    animeApi.getBySlug(slug, session?.accessToken),
  ])

  if (episodeRes.status === 'rejected') notFound()

  const episode     = episodeRes.value as Episode & { anime?: Anime }
  const anime       = animeRes.status === 'fulfilled' ? (animeRes.value as Anime) : null
  const allEpisodesRaw = allEpisodesRes.status === 'fulfilled'
    ? (Array.isArray(allEpisodesRes.value) ? allEpisodesRes.value : (allEpisodesRes.value as any).data ?? [])
    : []

  const seasonsData: any[] = Array.isArray(allEpisodesRaw)
    ? allEpisodesRaw
    : []

  const allEpisodes: Episode[] = seasonsData.flatMap((item: any) => item.episodes ?? [item])

  // Navegación entre temporadas: si estamos en el último capítulo de una temp,
  // el siguiente es el primero de la temp siguiente, y viceversa
  const currentSeasonIdx = seasonsData.findIndex((s: any) =>
    (s.episodes ?? []).some((ep: any) => ep.number === epNum)
  )
  const currentSeason = currentSeasonIdx !== -1 ? seasonsData[currentSeasonIdx] : null
  const currentSeasonEpisodes: any[] = currentSeason?.episodes ?? []
  const currentEpIndex = currentSeasonEpisodes.findIndex((ep: any) => ep.number === epNum)

  let prevEpisode = allEpisodes.find(ep => ep.number === epNum - 1)
  let nextEpisode = allEpisodes.find(ep => ep.number === epNum + 1)

  // Si no hay siguiente en misma temporada, buscar primera de la siguiente
  if (!nextEpisode && currentSeasonIdx < seasonsData.length - 1) {
    const nextSeason = seasonsData[currentSeasonIdx + 1]
    nextEpisode = nextSeason?.episodes?.[0] ?? null
  }

  // Si no hay anterior en misma temporada, buscar última de la anterior
  if (!prevEpisode && currentSeasonIdx > 0) {
    const prevSeason = seasonsData[currentSeasonIdx - 1]
    const prevEps = prevSeason?.episodes ?? []
    prevEpisode = prevEps[prevEps.length - 1] ?? null
  }

  // Fetch de animes relacionados (mismo género)
  let relatedAnimes: AnimeSummary[] = []
  try {
    const genre = anime?.genres?.[0]?.name?.toLowerCase().replace(/ /g, '_')
    if (genre && process.env.INTERNAL_API_URL) {
      const res = await fetch(
        `${process.env.INTERNAL_API_URL}/anime?genre=${genre}&limit=8`,
        { next: { revalidate: 3600 } }
      )
      if (res.ok) {
        const data = await res.json()
        const items: AnimeSummary[] = Array.isArray(data) ? data : data.data ?? []
        relatedAnimes = items.filter(a => a.slug !== slug).slice(0, 6)
      }
    }
  } catch {}

  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Inicio', item: BASE_URL },
        { name: 'Anime', item: `${BASE_URL}/anime` },
        { name: anime?.title_es ?? slug, item: `${BASE_URL}/anime/${slug}` },
        { name: `Episodio ${epNum}`, item: `${BASE_URL}/anime/${slug}/episodio/${epNum}` },
      ]} />
      <EpisodeJsonLd episode={episode} anime={anime} />
      <WebPageJsonLd
        name={`Ver ${anime?.title_es ?? slug} — Episodio ${epNum}${episode.title ? `: ${episode.title}` : ''} | Kuroshi.lat`}
        description={episode.synopsis?.slice(0, 300) ?? `Ver episodio ${epNum} de ${anime?.title_es ?? slug} en Kuroshi.tv`}
        url={`${BASE_URL}/anime/${slug}/episodio/${epNum}`}
        mainEntity={{
          '@type': 'TVEpisode',
          name: episode.title || `Episodio ${epNum}`,
          url: `${BASE_URL}/anime/${slug}/episodio/${epNum}`,
        }}
        breadcrumb={{
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/anime/${slug}/episodio/${epNum}#breadcrumb`,
        }}
      />
      <EpisodePlayerClient
        animeSlug={slug}
        anime={anime}
        episode={episode}
        allEpisodes={allEpisodes}
        prevEpisode={prevEpisode}
        nextEpisode={nextEpisode}
        isLoggedIn={!!session}
        userId={session?.user?.id}
        relatedAnimes={relatedAnimes}
      />
      <Footer />
    </>
  )
}
