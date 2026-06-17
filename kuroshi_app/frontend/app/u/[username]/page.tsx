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
    friendship_status: profile.friendshipStatus ?? profile.friendship_status ?? undefined,
    friendship_id: profile.friendshipId ?? profile.friendship_id ?? undefined,
    favorite_anime: profile.favoriteAnime
      ? {
          id:       profile.favoriteAnime.id,
          slug:     profile.favoriteAnime.slug,
          title_es: profile.favoriteAnime.titleEs ?? profile.favoriteAnime.title_es,
          title_jp: profile.favoriteAnime.titleJp ?? profile.favoriteAnime.title_jp,
          cover_url: profile.favoriteAnime.coverUrl ?? profile.favoriteAnime.cover_url,
          banner_url: profile.favoriteAnime.bannerUrl ?? profile.favoriteAnime.banner_url,
          mal_rating: profile.favoriteAnime.malRating ?? profile.favoriteAnime.mal_rating,
          status:   profile.favoriteAnime.status,
          genres:   profile.favoriteAnime.genres ?? [],
        }
      : undefined,
    stats: {
      episodes_watched:  profile.episodesWatched  ?? profile.stats?.episodes_watched  ?? 0,
      hours_watched:     profile.hoursWatched      ?? profile.stats?.hours_watched      ?? 0,
      friends_count:     profile.friendsCount      ?? profile.stats?.friends_count      ?? 0,
      communities_count: profile._count?.communityMemberships ?? profile.stats?.communities_count ?? 0,
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
              initialTab={sp.tab as 'lista' | 'actividad' | 'comunidades' | 'amigos' | undefined}
            />
          </div>
        </ProfileWithAds>
      </div>
      <Footer />
    </>
  )
}