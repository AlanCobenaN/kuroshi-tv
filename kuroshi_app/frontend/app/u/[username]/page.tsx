import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { usersApi } from '@/lib/api'
import { UserPublicProfile } from '@/types'
import { ProfileBanner } from './ProfileBanner'
import { ProfileStats } from './ProfileStats'
import { ProfileTabs } from './ProfileTabs'
import { Footer } from '@/components/layout/Footer'
import { AdBanner } from '@/components/ads/AdBanner'
import { ProfileWithAds } from '@/components/ads/ProfileWithAds'

interface Props {
  params: Promise<{ username: string }>
  searchParams?: Promise<{ tab?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  try {
    const user = await usersApi.getProfile(username) as any
    return {
      title: `${user.username} — Perfil`,
      description: user.bio ?? `Perfil de ${user.username} en Kuroshi.tv`,
    }
  } catch {
    return { title: 'Perfil de usuario' }
  }
}

export default async function UserProfilePage({ params, searchParams }: Props) {
  const { username } = await params
  const sp = searchParams ? await searchParams : { tab: undefined }
  const session      = await getServerSession(authOptions)

  let profile: any
  try {
    profile = await usersApi.getProfile(username, session?.accessToken)
  } catch {
    notFound()
  }

  if (!profile) notFound()

  const isOwnProfile = session?.user?.username === username

  // Normalizar el perfil: camelCase del backend → snake_case del frontend
  const normalizedProfile: UserPublicProfile = {
    id:         profile.id,
    username:   profile.username,
    bio:        profile.bio,
    avatar_url: profile.avatarUrl ?? profile.avatar_url,
    role:       profile.role ?? 'usuario',
    visibility: profile.visibility ?? 'publico',
    email_verified: profile.emailVerified ?? profile.email_verified ?? false,
    created_at: profile.createdAt ?? profile.created_at,
    friendship_status: profile.friendship_status ?? undefined,
    friendship_id: profile.friendship_id ?? undefined,
    favorite_anime: profile.favorite_anime
      ? {
          id:       profile.favorite_anime.id,
          slug:     profile.favorite_anime.slug,
          title_es: profile.favorite_anime.title_es ?? profile.favorite_anime.titleEs,
          title_jp: profile.favorite_anime.title_jp ?? profile.favorite_anime.titleJp,
          cover_url: profile.favorite_anime.cover_url ?? profile.favorite_anime.coverUrl,
          banner_url: profile.favorite_anime.banner_url ?? profile.favorite_anime.bannerUrl,
          mal_rating: profile.favorite_anime.mal_rating ?? profile.favorite_anime.malRating,
          status:   profile.favorite_anime.status,
          genres:   profile.favorite_anime.genres ?? [],
        }
      : undefined,
    stats: {
      episodes_watched:  profile.episodes_watched  ?? 0,
      hours_watched:     profile.hours_watched      ?? 0,
      friends_count:     profile.friends_count      ?? 0,
      communities_count: profile.community_memberships_count ?? 0,
    },
    xp:   profile.xp   ?? 0,
    rank: profile.rank ?? null,
  }

  // Perfil privado — solo mostrar banner básico sin stats ni tabs
  if (profile.isPrivate && !isOwnProfile) {
    return (
      <>
        <div className="profile-page">
          <ProfileBanner
            profile={normalizedProfile}
            isOwnProfile={false}
            isLoggedIn={!!session}
            currentUserId={session?.user?.id}
          />
          <div className="profile-body container">
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              Este perfil es privado.
            </p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <div className="profile-page">
        <ProfileBanner
          profile={normalizedProfile}
          isOwnProfile={isOwnProfile}
          isLoggedIn={!!session}
          currentUserId={session?.user?.id}
        />
        <ProfileWithAds>
          <div className="profile-body" style={{ paddingBottom: 0, border: 'none' }}>
            <ProfileStats profile={normalizedProfile} />
            <AdBanner />
            <ProfileTabs
              profile={normalizedProfile}
              isOwnProfile={isOwnProfile}
              isLoggedIn={!!session}
              accessToken={session?.accessToken}
              currentUserId={session?.user?.id}
              initialTab={sp.tab as 'lista' | 'actividad' | 'comunidades' | 'amigos' | undefined}
            />
          </div>
        </ProfileWithAds>
      </div>
      <Footer />
    </>
  )
}