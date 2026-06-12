'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Community, CommunityWithMembership, CommunityMemberInfo, PaginatedResponse } from '@/types'
import { communitiesApi, authApi } from '@/lib/api'
import { LeftSidebar } from './LeftSidebar'
import { CenterPanel } from './CenterPanel'
import { RightSidebar } from './RightSidebar'
import { CreatePostModal } from './CreatePostModal'

interface Props {
  initialCommunities: Community[]
  initialMeta: PaginatedResponse<Community>['meta']
  myCommunities: CommunityWithMembership[]
  isLoggedIn: boolean
  userId?: string
  username?: string
  accessToken?: string
}

export function CommunityHub({
  initialCommunities,
  initialMeta,
  myCommunities: initialMyCommunities,
  isLoggedIn,
  userId,
  username,
  accessToken: serverToken,
}: Props) {
  const { data: clientSession, status } = useSession()

  const effectiveToken = serverToken || clientSession?.accessToken
  const effectiveIsLoggedIn = isLoggedIn || status === 'authenticated'
  const effectiveUserId = userId || clientSession?.user?.id
  const effectiveUsername = username || clientSession?.user?.username

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [myCommunities, setMyCommunities] = useState<CommunityWithMembership[]>(initialMyCommunities)
  const [members, setMembers] = useState<CommunityMemberInfo[]>([])

  const refreshMyCommunities = useCallback(async (token: string) => {
    try {
      const data = await communitiesApi.getAll({ limit: 100, order: 'miembros' }, token) as any
      const allData: any[] = data?.data ?? []
      const mine = allData.filter((c: any) => c.user_membership)
      if (mine.length > 0) {
        setMyCommunities(mine as CommunityWithMembership[])
      }
    } catch (e) {
      console.error('[CommunityHub] refreshMyCommunities failed:', e)
    }
  }, [])

  // Refetch my communities when token becomes available and server didn't provide them
  useEffect(() => {
    if (myCommunities.length === 0 && effectiveToken) {
      refreshMyCommunities(effectiveToken)
    }
  }, [effectiveToken])

  // Heartbeat cada 2 min para mantener lastActiveAt actualizado
  useEffect(() => {
    if (!effectiveToken) return
    const id = setInterval(() => {
      authApi.ping(effectiveToken).catch(() => {})
    }, 120000)
    return () => clearInterval(id)
  }, [effectiveToken])

  const handleSelectCommunity = useCallback(async (slug: string | null) => {
    setSelectedSlug(slug)
    if (slug && effectiveToken) {
      try {
        const data = await communitiesApi.getCommunityMembers(slug, effectiveToken) as CommunityMemberInfo[]
        setMembers(data)
      } catch (e) {
        console.error('[CommunityHub] getCommunityMembers failed:', e)
        setMembers([])
      }
    } else {
      setMembers([])
    }
  }, [effectiveToken])

  const handleRefreshMyCommunities = useCallback(async () => {
    if (!effectiveToken) return
    await refreshMyCommunities(effectiveToken)
  }, [effectiveToken, refreshMyCommunities])

  return (
    <div className="hub">
      <div className="hub-layout">
        <LeftSidebar
          initialCommunities={initialCommunities}
          initialMeta={initialMeta}
          selectedSlug={selectedSlug}
          onSelect={handleSelectCommunity}
        />
        <CenterPanel
          selectedSlug={selectedSlug}
          isLoggedIn={effectiveIsLoggedIn}
          userId={effectiveUserId}
          username={effectiveUsername}
          accessToken={effectiveToken}
          myCommunities={myCommunities}
          onRefreshMyCommunities={handleRefreshMyCommunities}
        />
        <RightSidebar
          selectedSlug={selectedSlug}
          myCommunities={myCommunities}
          members={members}
          isLoggedIn={effectiveIsLoggedIn}
          accessToken={effectiveToken}
          userId={effectiveUserId}
          username={effectiveUsername}
          onCommunityChange={handleSelectCommunity}
          onRefreshMyCommunities={handleRefreshMyCommunities}
        />
      </div>

      {effectiveIsLoggedIn && (
        <>
          <button
            onClick={() => setShowCreatePost(true)}
            className="hub-fab"
            aria-label="Crear publicación"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {showCreatePost && (
            <CreatePostModal
              selectedSlug={selectedSlug}
              accessToken={effectiveToken!}
              onClose={() => setShowCreatePost(false)}
            />
          )}
        </>
      )}

      <style>{`
        .hub {
          min-height: calc(100dvh - var(--total-nav));
          position: relative;
        }
        .hub-layout {
          display: grid;
          grid-template-columns: 200px 1fr 200px;
          gap: 1px;
          background: var(--border);
          min-height: calc(100dvh - var(--total-nav));
        }
        .hub-layout > * {
          background: var(--bg-base);
        }

        .hub-fab {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          width: 56px;
          height: 56px;
          background: var(--accent);
          color: #fff;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(230,57,70,0.4);
          transition: all var(--transition-fast);
          z-index: 100;
        }
        .hub-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 24px rgba(230,57,70,0.5);
        }

        @media (max-width: 1100px) {
          .hub-layout { grid-template-columns: 220px 1fr 240px; }
        }
        @media (max-width: 900px) {
          .hub-layout { grid-template-columns: 1fr; }
          .hub-fab { bottom: 1.5rem; right: 1.5rem; width: 48px; height: 48px; }
        }
      `}</style>
    </div>
  )
}
