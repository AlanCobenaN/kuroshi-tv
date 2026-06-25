import { JsonLd } from './JsonLd'
import { Anime, Episode } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'

export function EpisodeJsonLd({ episode, anime }: { episode: Episode; anime?: Anime | null }) {
  const animeTitle = anime?.title_es ?? ''
  const slug = anime?.slug ?? ''
  const epNumber = episode.number

  const episodeData: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'TVEpisode',
    name: episode.title || `Episodio ${epNumber}`,
    url: `${BASE_URL}/anime/${slug}/episodio/${epNumber}`,
    image: episode.thumbnail_url ?? anime?.banner_url ?? anime?.cover_url,
    description: episode.synopsis?.slice(0, 500) || `Ver episodio ${epNumber} de ${animeTitle}`,
    episodeNumber: epNumber,
    datePublished: episode.air_date?.split('T')[0],
    duration: episode.duration_minutes ? `PT${episode.duration_minutes}M` : undefined,
  }

  if (anime) {
    episodeData.partOfSeries = {
      '@type': 'TVSeries',
      name: anime.title_es,
      url: `${BASE_URL}/anime/${anime.slug}`,
    }
  }

  const videoData: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: episode.title || `Episodio ${epNumber} de ${animeTitle}`,
    description: episode.synopsis?.slice(0, 500) || `Ver episodio ${epNumber} de ${animeTitle}`,
    thumbnailUrl: episode.thumbnail_url ?? anime?.banner_url ?? anime?.cover_url,
    uploadDate: episode.air_date?.split('T')[0] ?? new Date().toISOString().split('T')[0],
    duration: episode.duration_minutes ? `PT${episode.duration_minutes}M` : undefined,
    contentUrl: `${BASE_URL}/anime/${slug}/episodio/${epNumber}`,
    embedUrl: `${BASE_URL}/anime/${slug}/episodio/${epNumber}`,
    interactionStatistic: episode.views ? {
      '@type': 'InteractionCounter',
      interactionType: 'WatchAction',
      userInteractionCount: episode.views,
    } : undefined,
    partOfSeries: anime ? {
      '@type': 'TVSeries',
      name: anime.title_es,
      url: `${BASE_URL}/anime/${anime.slug}`,
    } : undefined,
  }

  return (
    <>
      <JsonLd data={episodeData} />
      <JsonLd data={videoData} />
    </>
  )
}
