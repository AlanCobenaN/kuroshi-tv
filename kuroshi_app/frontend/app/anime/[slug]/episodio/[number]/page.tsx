// app/anime/[slug]/episodio/[number]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { animeApi } from '@/lib/api'
import { Anime, AnimeSummary, Episode } from '@/types'
import { EpisodePlayerClient } from './EpisodePlayerClient'
import { Footer } from '@/components/layout/Footer'

interface Props {
  params: Promise<{ slug: string; number: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, number } = await params
  const epNum = parseInt(number, 10)

  try {
    const episode = await animeApi.getEpisode(slug, epNum) as Episode & { anime?: Anime }
    const animeTitle = episode.anime?.title_es ?? slug
    return {
      title: `${animeTitle} — Episodio ${epNum}${episode.title ? ': ' + episode.title : ''}`,
      description: episode.synopsis ?? `Ver episodio ${epNum} de ${animeTitle} en Kuroshi.tv`,
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
    animeApi.getEpisode(slug, epNum, session?.accessToken),
    animeApi.getEpisodes(slug, { order: 'asc' }),
    animeApi.getBySlug(slug, session?.accessToken),
  ])

  if (episodeRes.status === 'rejected') notFound()

  const episode     = episodeRes.value as Episode & { anime?: Anime }
  const anime       = animeRes.status === 'fulfilled' ? (animeRes.value as Anime) : null
  const allEpisodesRaw = allEpisodesRes.status === 'fulfilled'
    ? (Array.isArray(allEpisodesRes.value) ? allEpisodesRes.value : (allEpisodesRes.value as any).data ?? [])
    : []

  const allEpisodes: Episode[] = Array.isArray(allEpisodesRaw)
    ? allEpisodesRaw.flatMap((item: any) => item.episodes ?? [item])
    : []

  const prevEpisode = allEpisodes.find(ep => ep.number === epNum - 1)
  const nextEpisode = allEpisodes.find(ep => ep.number === epNum + 1)

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
