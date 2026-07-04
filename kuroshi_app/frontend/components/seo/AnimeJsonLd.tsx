import { JsonLd } from './JsonLd'

type AnimeWithType = {
  id: string
  slug: string
  title_es: string
  title_en?: string
  title_jp?: string
  aliases?: string[]
  same_as?: string[]
  synopsis?: string
  cover_url: string
  banner_url?: string
  mal_rating?: number
  community_rating?: number
  community_rating_count?: number
  genres: { id: string; name: string }[]
  seasons?: { id: string; number: number }[]
  studio?: string
  year?: number
  total_episodes?: number
  total_views?: number
  is_visible: boolean
  created_at: string
  type?: string
  contentRating?: string
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'

const animeTypeMap: Record<string, string> = {
  tv: 'TVSeries',
  pelicula: 'Movie',
  ova: 'Movie',
  especial: 'Movie',
}

function getGenreNames(anime: AnimeWithType): string[] {
  return anime.genres?.map(g => g.name) ?? []
}

export function AnimeJsonLd({ anime }: { anime: AnimeWithType }) {
  const schemaType = (anime.type && animeTypeMap[anime.type]) || 'TVSeries'
  const genreNames = getGenreNames(anime)
  const animeUrl = `${BASE_URL}/anime/${anime.slug}`

  const alternateNames: string[] = []
  if (anime.title_en) alternateNames.push(anime.title_en)
  if (anime.title_jp) alternateNames.push(anime.title_jp)
  if (anime.aliases && Array.isArray(anime.aliases)) {
    for (const alias of anime.aliases) {
      if (!alternateNames.includes(alias)) alternateNames.push(alias)
    }
  }

  const data: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: anime.title_es,
    ...(alternateNames.length > 0 ? { alternateName: alternateNames.length === 1 ? alternateNames[0] : alternateNames } : {}),
    ...(anime.same_as && Array.isArray(anime.same_as) && anime.same_as.length > 0 ? { sameAs: anime.same_as } : {}),
    url: animeUrl,
    image: anime.banner_url ?? anime.cover_url,
    description: anime.synopsis?.slice(0, 500),
    genre: genreNames.length > 0 ? genreNames : undefined,
    dateCreated: anime.created_at?.split('T')[0],
    inLanguage: 'es',
    author: {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
    },
    ...(genreNames.length > 0 ? { about: genreNames.map(g => ({ '@type': 'Thing', name: g })) } : {}),
  }

  if (schemaType === 'TVSeries') {
    data.numberOfEpisodes = anime.total_episodes ?? undefined
    data.numberOfSeasons = anime.seasons?.length ?? undefined
  }

  if (anime.total_views && anime.total_views > 0) {
    data.interactionStatistic = {
      '@type': 'InteractionCounter',
      interactionType: 'WatchAction',
      userInteractionCount: anime.total_views,
    }
  }

  if (anime.contentRating) {
    data.contentRating = anime.contentRating
  }

  const ratingValue = anime.mal_rating ?? anime.community_rating
  if (ratingValue) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue,
      bestRating: 10,
      worstRating: 0,
      ratingCount: Math.max(1, anime.community_rating_count ?? 1),
    }
  }

  if (anime.studio) {
    data.productionCompany = {
      '@type': 'Organization',
      name: anime.studio,
    }
  }

  if (anime.year) {
    data.datePublished = `${anime.year}`
  }

  return <JsonLd data={data} />
}
