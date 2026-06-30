import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'
const INTERNAL = process.env.INTERNAL_API_URL ?? 'http://localhost:4000/api'

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) return null
  return res.json()
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                  lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE_URL}/anime`,       lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE_URL}/comunidades`, lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE_URL}/buscar`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${BASE_URL}/terminos`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.2 },
    { url: `${BASE_URL}/privacidad`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.2 },
    { url: `${BASE_URL}/dmca`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.2 },
    { url: `${BASE_URL}/contacto`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.2 },
    { url: `${BASE_URL}/login`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/registro`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  let animeRoutes: MetadataRoute.Sitemap = []
  let episodeRoutes: MetadataRoute.Sitemap = []
  let communityRoutes: MetadataRoute.Sitemap = []

  // ── Animes ──
  try {
    const animeData = await fetchJson(`${INTERNAL}/anime?limit=200&page=1`)
    if (animeData) {
      const animes = Array.isArray(animeData) ? animeData : animeData.data ?? []

      animeRoutes = animes.map((anime: any) => ({
        url:             `${BASE_URL}/anime/${anime.slug}`,
        lastModified:    new Date(),
        changeFrequency: anime.status === 'en_emision' ? 'daily' : 'weekly' as const,
        priority:        anime.status === 'en_emision' ? 0.85 : 0.7,
      }))

      // ── Episodios por anime ──
      const episodeFetchPromises = animes.slice(0, 50).map(async (anime: any) => {
        try {
          const epData = await fetchJson(`${INTERNAL}/anime/${anime.slug}/episodes?order=asc`)
          if (!epData) return []
          const seasons = Array.isArray(epData) ? epData : epData.data ?? []
          const episodes: any[] = []
          for (const season of seasons) {
            const eps = season.episodes ?? []
            for (const ep of eps) {
              episodes.push({
                slug: anime.slug,
                number: ep.number,
                status: anime.status,
              })
            }
          }
          return episodes
        } catch {
          return []
        }
      })

      const episodeGroups = await Promise.all(episodeFetchPromises)
      for (const group of episodeGroups) {
        for (const ep of group) {
          episodeRoutes.push({
            url:             `${BASE_URL}/anime/${ep.slug}/episodio/${ep.number}`,
            lastModified:    new Date(),
            changeFrequency: ep.status === 'en_emision' ? 'daily' : 'monthly' as const,
            priority:        0.6,
          })
        }
      }
    }
  } catch {}

  // ── Comunidades ──
  try {
    const commData = await fetchJson(`${INTERNAL}/communities?limit=100&page=1`)
    if (commData) {
      const communities = Array.isArray(commData) ? commData : commData.data ?? []

      communityRoutes = communities.map((c: any) => ({
        url:             `${BASE_URL}/comunidad/${c.slug}`,
        lastModified:    new Date(),
        changeFrequency: 'daily' as const,
        priority:        c.type === 'oficial' ? 0.75 : 0.6,
      }))
    }
  } catch {}

  return [...staticRoutes, ...animeRoutes, ...episodeRoutes, ...communityRoutes]
}
