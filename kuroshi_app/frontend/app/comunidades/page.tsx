import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { communitiesApi } from '@/lib/api'
import { CommunityHub } from './CommunityHub'
import { Footer } from '@/components/layout/Footer'
import { AdBanner } from '@/components/ads/AdBanner'
import { CommunitiesWithAds } from '@/components/ads/CommunitiesWithAds'

export const metadata: Metadata = {
  title: 'Comunidades',
  description: 'Explora comunidades, comparte y chatea con otros fans del anime.',
}

export const dynamic = 'force-dynamic'

export default async function ComunidadesPage() {
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
        />
      </CommunitiesWithAds>
      <Footer />
    </>
  )
}
