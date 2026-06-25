// app/comunidades/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { communitiesApi } from '@/lib/api'
import { Community } from '@/types'
import { CommunityClient } from './CommunityClient'
import { Footer } from '@/components/layout/Footer'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const community = await communitiesApi.getBySlug(slug) as Community
    return {
      title: `${community.name} — Comunidad`,
      description: community.description ?? `Comunidad de fans: ${community.name}`,
      openGraph: {
        title: `${community.name} — Comunidad de Kuroshi.lat`,
        description: community.description?.slice(0, 200) ?? `Comunidad de fans: ${community.name}`,
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'}/comunidades/${slug}`,
        images: community.banner_url ? [{ url: community.banner_url }] : [],
      },
      alternates: { canonical: `/comunidades/${slug}` },
    }
  } catch {
    return { title: 'Comunidad' }
  }
}

export default async function CommunityPage({ params }: Props) {
  const { slug } = await params
  const session  = await getServerSession(authOptions)

  let community: Community
  try {
    community = await communitiesApi.getBySlug(slug, session?.accessToken) as Community
  } catch {
    notFound()
  }

  const isMember = !!community.user_membership

  return (
    <>
      <CommunityClient
        community={community}
        isMember={isMember}
        isLoggedIn={!!session}
        accessToken={session?.accessToken}
        userId={session?.user?.id}
        username={session?.user?.username}
      />
      <Footer />
    </>
  )
}
