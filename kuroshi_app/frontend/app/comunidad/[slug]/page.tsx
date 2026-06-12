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
      // URL canónica apunta a /comunidad/ (singular)
      alternates: { canonical: `/comunidad/${slug}` },
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
