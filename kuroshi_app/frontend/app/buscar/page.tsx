// app/buscar/page.tsx
import type { Metadata } from 'next'
import { searchApi } from '@/lib/api'
import { SearchClient } from './SearchClient'
import { Footer } from '@/components/layout/Footer'
import { SearchWithAds } from '@/components/ads/SearchWithAds'

interface Props {
  searchParams: Promise<{ q?: string; tab?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `"${q}" — Búsqueda` : 'Buscar',
    description: q ? `Resultados de búsqueda para "${q}" en Kuroshi.tv` : 'Busca anime, comunidades y usuarios en Kuroshi.tv',
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, tab } = await searchParams

  let results: any = { anime: [], communities: [], users: [], meta: { total: 0 } }

  if (q && q.trim().length >= 2) {
    try {
      const raw: any = await searchApi.search(q.trim(), 1)
      results = {
        anime: (raw.anime?.data ?? []).map((a: any) => ({
          id: a.id,
          slug: a.slug,
          title_es: a.title_es,
          title_jp: a.title_jp,
          cover_url: a.cover_url,
          banner_url: a.banner_url,
          mal_rating: a.mal_rating,
          status: a.status,
          genres: (a.genres ?? []).map((g: string) => ({ id: g, name: g })),
        })),
        communities: (raw.communities?.data ?? []).map((c: any) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          description: c.description,
          avatar_url: c.avatar_url,
          banner_url: c.banner_url,
          type: c.type,
          members_count: c.members_count,
          members_threshold: c.members_threshold,
          created_at: c.created_at,
        })),
        users: (raw.users?.data ?? []).map((u: any) => ({
          id: u.id,
          username: u.username,
          bio: u.bio,
          avatar_url: u.avatar_url,
          role: u.role,
          stats: { episodes_watched: 0, hours_watched: 0, friends_count: 0, communities_count: 0 },
        })),
        meta: raw.meta ?? { total: 0, total_pages: 0, page: 1 },
      }
    } catch (e) {
      console.error('Error en búsqueda:', e)
    }
  }

  return (
    <>
      <SearchWithAds>
        <SearchClient
          query={q ?? ''}
          initialResults={results}
          initialTab={(tab as 'anime' | 'comunidades' | 'usuarios') ?? 'anime'}
        />
      </SearchWithAds>
      <Footer />
    </>
  )
}
