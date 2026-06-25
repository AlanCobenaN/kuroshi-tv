// app/sitemap.ts
import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Rutas estáticas siempre presentes
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

  // Rutas dinámicas: páginas de anime
  // Cada URL de anime y episodio genera tráfico orgánico permanente (§8.2 del doc)
  let animeRoutes: MetadataRoute.Sitemap = []
  let communityRoutes: MetadataRoute.Sitemap = []

  try {
    const INTERNAL = process.env.INTERNAL_API_URL ?? 'http://localhost:4000/api'

    // Fetch del catálogo completo para el sitemap
    const animeRes = await fetch(`${INTERNAL}/anime?limit=200&page=1`, {
      next: { revalidate: 3600 },
    })

    if (animeRes.ok) {
      const animeData = await animeRes.json()
      const animes = Array.isArray(animeData) ? animeData : animeData.data ?? []

      animeRoutes = animes.map((anime: any) => ({
        url:             `${BASE_URL}/anime/${anime.slug}`,
        lastModified:    new Date(),
        changeFrequency: anime.status === 'en_emision' ? 'daily' : 'weekly',
        priority:        anime.status === 'en_emision' ? 0.85 : 0.7,
      }))
    }
  } catch {
    // Si el backend no responde en build time, el sitemap solo tendrá rutas estáticas
  }

  try {
    const INTERNAL = process.env.INTERNAL_API_URL ?? 'http://localhost:4000/api'

    const commRes = await fetch(`${INTERNAL}/communities?limit=100&page=1`, {
      next: { revalidate: 3600 },
    })

    if (commRes.ok) {
      const commData = await commRes.json()
      const communities = Array.isArray(commData) ? commData : commData.data ?? []

      communityRoutes = communities.map((c: any) => ({
        url:             `${BASE_URL}/comunidad/${c.slug}`,
        lastModified:    new Date(),
        changeFrequency: 'daily',
        priority:        c.type === 'oficial' ? 0.75 : 0.6,
      }))
    }
  } catch {}

  return [...staticRoutes, ...animeRoutes, ...communityRoutes]
}
