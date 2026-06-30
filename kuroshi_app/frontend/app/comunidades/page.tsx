import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { communitiesApi } from '@/lib/api'
import { CommunityHub } from './CommunityHub'
import { Footer } from '@/components/layout/Footer'
import { AdBanner } from '@/components/ads/AdBanner'
import { CommunitiesWithAds } from '@/components/ads/CommunitiesWithAds'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'

export const metadata: Metadata = {
  title: 'Comunidades',
  description: 'Explora comunidades, comparte y chatea con otros fans del anime en Kuroshi.lat.',
  alternates: { canonical: '/comunidades' },
  openGraph: {
    title: 'Comunidades | Kuroshi.lat',
    description: 'Explora comunidades, comparte y chatea con otros fans del anime en Kuroshi.lat.',
    url: `${BASE_URL}/comunidades`,
    images: [{ url: '/og-default.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Comunidades | Kuroshi.lat',
    description: 'Explora comunidades, comparte y chatea con otros fans del anime.',
    images: ['/og-default.svg'],
  },
}

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ slug?: string }>
}

export default async function ComunidadesPage({ searchParams }: Props) {
  const { slug: initialSelectedSlug } = await searchParams
  const session = await getServerSession(authOptions)
  const token = session?.accessToken

  const [allRes] = await Promise.allSettled([
    communitiesApi.getAll({ limit: 10, order: 'miembros' }, token),
  ])

  const initialCommunities = allRes.status === 'fulfilled'
    ? (allRes.value as any) : { data: [], meta: { page: 1, total: 0, total_pages: 0, limit: 10 } }

  const myCommunities: any[] = allRes.status === 'fulfilled'
    ? ((allRes.value as any).data ?? []).filter((c: any) => c.user_membership)
    : []

  return (
    <>
      <h1 className="sr-only">Comunidades</h1>
      <CommunitiesWithAds>
        <AdBanner />
        <CommunityHub
          initialCommunities={initialCommunities.data ?? []}
          initialMeta={initialCommunities.meta}
          myCommunities={myCommunities}
          isLoggedIn={!!session}
          userId={session?.user?.id}
          username={session?.user?.username}
          accessToken={token}
          initialSelectedSlug={initialSelectedSlug ?? null}
        />
      </CommunitiesWithAds>
      <Footer />
    </>
  )
}
