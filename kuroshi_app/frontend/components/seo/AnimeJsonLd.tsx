import { JsonLd } from './JsonLd'

type AnimeWithType = {
  id: string
  slug: string
  title_es: string
  title_jp?: string
  synopsis?: string
  cover_url: string
  banner_url?: string
  mal_rating?: number
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

  const data: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: anime.title_es,
    alternateName: anime.title_jp || undefined,
    url: `${BASE_URL}/anime/${anime.slug}`,
    image: anime.banner_url ?? anime.cover_url,
    description: anime.synopsis?.slice(0, 500),
    genre: genreNames.length > 0 ? genreNames : undefined,
    dateCreated: anime.created_at?.split('T')[0],
  }

  if (schemaType === 'TVSeries') {
    data.numberOfEpisodes = anime.total_episodes ?? undefined
    data.numberOfSeasons = anime.seasons?.length ?? undefined
  }

  if (anime.mal_rating) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: anime.mal_rating,
      bestRating: 10,
      worstRating: 0,
      ratingCount: anime.community_rating_count ?? 1,
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
