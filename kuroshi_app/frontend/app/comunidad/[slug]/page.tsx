// app/comunidad/[slug]/page.tsx
// ============================================================
// URL canónica según documento de requisitos §7:
//   kuroshi.lat/comunidad/nombre-de-la-comunidad  (SINGULAR)
//
// La carpeta app/comunidades/[slug]/ existe también porque
// la página de explorar (/comunidades) necesita su propio
// segmento de ruta. Ambas conviven sin conflicto en Next.js.
// ============================================================

export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { communitiesApi } from '@/lib/api'
import { Community } from '@/types'
import { CommunityClient } from '@/app/comunidades/[slug]/CommunityClient'
import { Footer } from '@/components/layout/Footer'
import { BreadcrumbJsonLd } from '@/components/seo/BreadcrumbJsonLd'
import { WebPageJsonLd } from '@/components/seo/WebPageJsonLd'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kuroshi.lat'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const community = await communitiesApi.getBySlug(slug) as Community
    const imageUrl = community.banner_url ?? community.avatar_url ?? '/og-default.svg'
    return {
      title: `${community.name} — Comunidad`,
      description: community.description ?? `Comunidad de fans: ${community.name}`,
      alternates: { canonical: `/comunidad/${slug}` },
      openGraph: {
        title: `${community.name} — Comunidad | Kuroshi.lat`,
        description: community.description ?? `Comunidad de fans: ${community.name}`,
        url: `${BASE_URL}/comunidad/${slug}`,
        images: [{ url: imageUrl, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${community.name} — Comunidad | Kuroshi.lat`,
        description: community.description ?? `Comunidad de fans: ${community.name}`,
        images: [imageUrl],
      },
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
      <BreadcrumbJsonLd items={[
        { name: 'Inicio', item: BASE_URL },
        { name: 'Comunidades', item: `${BASE_URL}/comunidades` },
        { name: community.name, item: `${BASE_URL}/comunidad/${slug}` },
      ]} />
      <WebPageJsonLd
        name={`${community.name} — Comunidad | Kuroshi.lat`}
        description={community.description ?? `Comunidad de fans: ${community.name}`}
        url={`${BASE_URL}/comunidad/${slug}`}
      />
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
