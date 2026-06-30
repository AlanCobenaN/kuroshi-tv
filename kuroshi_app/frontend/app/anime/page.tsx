// app/anime/page.tsx
import type { Metadata } from 'next'
import { animeApi } from '@/lib/api'
import { AnimeSummary, PaginatedResponse } from '@/types'
import { CatalogGrid } from './CatalogGrid'
import { CatalogFilters } from './CatalogFilters'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Footer } from '@/components/layout/Footer'
import { AdBanner } from '@/components/ads/AdBanner'
import { CatalogWithAds } from '@/components/ads/CatalogWithAds'
import { ItemListJsonLd } from '@/components/seo/ItemListJsonLd'
import { WebPageJsonLd } from '@/components/seo/WebPageJsonLd'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'

export const metadata: Metadata = {
  title: 'Catálogo de Anime',
  description: 'Explora el catálogo completo de anime en Kuroshi.lat. Filtra por género, estado, temporada y más.',
  alternates: { canonical: '/anime' },
  openGraph: {
    title: 'Catálogo de Anime | Kuroshi.lat',
    description: 'Explora el catálogo completo de anime en Kuroshi.lat. Filtra por género, estado, temporada y más.',
    url: `${BASE_URL}/anime`,
    images: [{ url: '/og-default.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Catálogo de Anime | Kuroshi.lat',
    description: 'Explora el catálogo completo de anime en Kuroshi.lat.',
    images: ['/og-default.svg'],
  },
}

interface SearchParams {
  [key: string]: string | undefined
  genre?: string
  status?: string
  season?: string
  year?: string
  studio?: string
  order?: string
  page?: string
  q?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

export default async function AnimeCatalogPage({ searchParams }: Props) {
  const params = await searchParams

  const filters = {
    genre:   params.genre,
    status:  params.status,
    season:  params.season,
    year:    params.year ? Number(params.year) : undefined,
    studio:  params.studio,
    order:   params.order ?? 'popular',
    page:    params.page ? Number(params.page) : 1,
    limit:   24,
    q:       params.q,
  }

  // Fetch paralelo: catálogo + animes en emisión para el carrusel top
  const [catalogRes, airingRes] = await Promise.allSettled([
    animeApi.getCatalog(filters),
    animeApi.getAiring(),
  ])

  const catalog = catalogRes.status === 'fulfilled'
    ? (catalogRes.value as PaginatedResponse<AnimeSummary & { total_episodes?: number; year?: number }>)
    : { data: [], meta: { page: 1, total: 0, total_pages: 0, limit: 24 } }

  const airing = airingRes.status === 'fulfilled'
    ? (airingRes.value as AnimeSummary[])
    : []

  const hasActiveFilters = !!(params.genre || params.status || params.season || params.year || params.studio || params.q)

  const pageUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'}/anime${Object.keys(params).length > 0 ? `?${new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined).map(([k, v]) => [k, String(v)]))}` : ''}`

  return (
    <>
      <WebPageJsonLd
        name={params.q ? `Resultados para "${params.q}" | Kuroshi.lat` : 'Catálogo de Anime | Kuroshi.lat'}
        description="Explora el catálogo completo de anime en Kuroshi.tv. Filtra por género, estado, temporada y más."
        url={pageUrl}
      />
      <ItemListJsonLd
        url={pageUrl}
        items={catalog.data.map((a, i) => ({
          title: a.title_es,
          url: `/anime/${a.slug}`,
          image: a.cover_url,
          rating: a.mal_rating,
          ratingCount: a.ratings_count,
          position: i + 1 + ((filters.page ?? 1) - 1) * (filters.limit ?? 24),
        }))}
      />
      <div className="catalog-page container" style={{ paddingBottom: 0 }}>
        {/* Header */}
        <div className="catalog-header">
          <SectionHeader
            as="h1"
            title={params.q ? `Resultados para "${params.q}"` : 'Catálogo de Anime'}
            subtitle={
              catalog.meta.total > 0
                ? `${catalog.meta.total.toLocaleString('es')} títulos${hasActiveFilters ? ' con filtros aplicados' : ''}`
                : undefined
            }
          />
        </div>

        {/* Anuncio horizontal */}
        <AdBanner />
      </div>

      {/* Layout: filtros laterales + grid con ads verticales — full-width */}
      <CatalogWithAds>
        <div className="catalog-layout">
          {/* Sidebar de filtros */}
          <aside className="catalog-sidebar" aria-label="Filtros del catálogo">
            <CatalogFilters currentFilters={params} />
          </aside>

          {/* Grid de resultados */}
          <main className="catalog-main" aria-label="Resultados del catálogo">
            {/* Animes en emisión — solo en la vista sin filtros activos */}
            {!hasActiveFilters && airing.length > 0 && (
              <div className="catalog-airing-strip">
                <p className="catalog-strip-label">
                  <span className="strip-dot" aria-hidden="true" />
                  En emisión ahora — {airing.length} series activas
                </p>
              </div>
            )}

            <CatalogGrid
              animes={catalog.data}
              meta={catalog.meta}
              currentPage={filters.page ?? 1}
              currentFilters={params}
            />
          </main>
        </div>
      </CatalogWithAds>

      <Footer />
    </>
  )
}
