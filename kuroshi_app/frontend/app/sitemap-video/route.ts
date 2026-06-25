// app/sitemap-video/route.ts
import { animeApi } from '@/lib/api'
import { AnimeSummary, Episode } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildVideoUrl(
  animeTitle: string,
  animeSlug: string,
  ep: Episode,
): string {
  const epUrl = `${BASE_URL}/anime/${animeSlug}/episodio/${ep.number}`
  const title = escapeXml(`${animeTitle} — Episodio ${ep.number}${ep.title ? `: ${ep.title}` : ''}`)
  const description = escapeXml(ep.synopsis?.slice(0, 300) ?? `Ver episodio ${ep.number} de ${animeTitle} en Kuroshi.tv`)
  const thumbnail = escapeXml(ep.thumbnail_url ?? '')
  const duration = ep.duration_minutes ?? ''
  const pubDate = ep.air_date?.split('T')[0] ?? new Date().toISOString().split('T')[0]

  return `  <url>
    <loc>${escapeXml(epUrl)}</loc>
    <video:video>
      <video:thumbnail_loc>${thumbnail}</video:thumbnail_loc>
      <video:title>${title}</video:title>
      <video:description>${description}</video:description>
      <video:player_loc>${escapeXml(epUrl)}</video:player_loc>
      ${duration ? `<video:duration>${duration}</video:duration>` : ''}
      <video:publication_date>${pubDate}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:restriction relationship="allow">ES MX AR CL</video:restriction>
    </video:video>
  </url>`
}

export async function GET() {
  const urls: string[] = []

  try {
    // 1. Fetch latest episodes (rápido, devuelve episodios recientes con anime)
    const latest = await animeApi.getLatestEpisodes() as (Episode & {
      anime?: { title_es: string; slug: string; banner_url?: string }
    })[]

    if (Array.isArray(latest)) {
      for (const ep of latest) {
        if (ep.anime?.slug && ep.number) {
          urls.push(buildVideoUrl(
            ep.anime.title_es ?? 'Anime',
            ep.anime.slug,
            ep,
          ))
        }
      }
    }

    // 2. Fetch popular animes del catálogo para cubrir más contenido
    const catalog = await animeApi.getCatalog({ order: 'popular', limit: 16, page: 1 }) as {
      data?: AnimeSummary[]
    }
    const animes = (catalog as any)?.data ?? (catalog as any)?.animes ?? []

    if (Array.isArray(animes) && animes.length > 0) {
      const batchSize = 4
      for (let i = 0; i < animes.length; i += batchSize) {
        const batch = animes.slice(i, i + batchSize)
        const results = await Promise.allSettled(
          batch.map((a: AnimeSummary) =>
            animeApi.getEpisodes(a.slug, { order: 'asc' })
              .then((res: any) => ({ slug: a.slug, title: a.title_es, data: Array.isArray(res) ? res : res?.data ?? [] }))
          )
        )

        for (const result of results) {
          if (result.status !== 'fulfilled') continue
          const { slug, title, data } = result.value
          const seasons = Array.isArray(data) ? data : []
          const seen = new Set<number>()

          for (const season of seasons) {
            const episodes: Episode[] = season.episodes ?? []
            for (const ep of episodes) {
              if (!ep.number || seen.has(ep.number)) continue
              seen.add(ep.number)

              const existingUrl = urls.find(u => u.includes(`/${slug}/episodio/${ep.number}`))
              if (!existingUrl) {
                urls.push(buildVideoUrl(title, slug, ep))
              }
            }
          }
        }
      }
    }
  } catch {
    // Si algo falla, servimos lo que tenemos
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
