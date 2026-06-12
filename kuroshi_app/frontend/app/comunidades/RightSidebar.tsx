'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CommunityWithMembership, CommunityMemberInfo } from '@/types'

interface Props {
  selectedSlug: string | null
  myCommunities: CommunityWithMembership[]
  members: CommunityMemberInfo[]
  isLoggedIn: boolean
  accessToken?: string
  userId?: string
  username?: string
  onCommunityChange: (slug: string | null) => void
  onRefreshMyCommunities: () => void
}

export function RightSidebar({
  selectedSlug,
  myCommunities,
  members,
  isLoggedIn,
  accessToken,
  userId,
  username,
  onCommunityChange,
  onRefreshMyCommunities,
}: Props) {
  if (selectedSlug) {
    return <MembersPanel members={members} />
  }

  return <MyCommunitiesPanel
    myCommunities={myCommunities}
    isLoggedIn={isLoggedIn}
    onCommunityChange={onCommunityChange}
  />
}

/* ─── Members Panel ──────────────────────────────────────── */

function MembersPanel({ members }: { members: CommunityMemberInfo[] }) {
  const online = members.filter(m => m.is_online)
  const offline = members.filter(m => !m.is_online)

  return (
    <aside className="hub-right">
      <div className="hub-right-header">
        <h3 className="hub-right-title">Miembros</h3>
        <span className="hub-right-count">{members.length}</span>
      </div>

      {members.length === 0 ? (
        <div className="hub-right-section">
          <p className="hub-right-no-data">No se pudieron cargar los miembros.</p>
        </div>
      ) : (
        <>
          {online.length > 0 && (
            <div className="hub-right-section">
              <h4 className="hub-right-section-title">En línea — {online.length}</h4>
              <div className="hub-right-list">
                {online.map(m => (
                  <MemberRow key={m.id} member={m} online />
                ))}
              </div>
            </div>
          )}

          {offline.length > 0 && (
            <div className="hub-right-section">
              <h4 className="hub-right-section-title">Desconectados — {offline.length}</h4>
              <div className="hub-right-list">
                {offline.map(m => (
                  <MemberRow key={m.id} member={m} online={false} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        .hub-right { display: flex; flex-direction: column; border-left: 1px solid var(--border); overflow-y: auto; max-height: calc(100dvh - var(--total-nav)); }
        .hub-right-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 0.75rem; border-bottom: 1px solid var(--border); flex-shrink: 0; }
        .hub-right-title { font-family: var(--font-display); font-size: 0.8125rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 0; }
        .hub-right-count { font-family: var(--font-display); font-size: 0.6875rem; font-weight: 600; color: var(--text-muted); background: var(--bg-overlay); padding: 0.125rem 0.5rem; border-radius: var(--radius-full); }

        .hub-right-section { padding: 0.5rem; }
        .hub-right-section-title { font-family: var(--font-display); font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin: 0 0 0.375rem 0.25rem; }

        .hub-right-list { display: flex; flex-direction: column; gap: 1px; }

        .mr-wrap { display: flex; align-items: center; gap: 0.625rem; padding: 0.375rem 0.5rem; border-radius: var(--radius-md); transition: background var(--transition-fast); }
        .mr-wrap:hover { background: var(--bg-overlay); }
        .mr-avatar-wrap { position: relative; width: 28px; height: 28px; flex-shrink: 0; }
        .mr-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
        .mr-avatar-fallback { width: 28px; height: 28px; border-radius: 50%; background: var(--accent); color: #fff; font-family: var(--font-display); font-size: 0.6875rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
        .mr-dot {
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid var(--bg-base);
        }
        .mr-dot--online { background: #22c55e; }
        .mr-dot--offline { background: var(--text-muted); }
        .mr-name { font-size: 0.8125rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mr-name--online { color: var(--text-primary); }
        .hub-right-no-data { font-size: 0.8125rem; color: var(--text-muted); text-align: center; padding: 1rem; margin: 0; }
      `}</style>
    </aside>
  )
}

function MemberRow({ member, online }: { member: CommunityMemberInfo; online: boolean }) {
  return (
    <Link href={`/u/${member.username}`} className="mr-wrap">
      <div className="mr-avatar-wrap">
        {member.avatar_url ? (
          <Image src={member.avatar_url} alt="" width={28} height={28} className="mr-avatar" />
        ) : (
          <div className="mr-avatar-fallback">{member.username[0].toUpperCase()}</div>
        )}
        <div className={`mr-dot ${online ? 'mr-dot--online' : 'mr-dot--offline'}`} />
      </div>
      <span className={`mr-name ${online ? 'mr-name--online' : ''}`}>{member.username}</span>
    </Link>
  )
}

/* ─── My Communities Panel ───────────────────────────────── */

function MyCommunitiesPanel({ myCommunities, isLoggedIn, onCommunityChange }: {
  myCommunities: CommunityWithMembership[]
  isLoggedIn: boolean
  onCommunityChange: (slug: string | null) => void
}) {
  if (!isLoggedIn) {
    return (
      <aside className="hub-right">
        <div className="hub-right-empty">
          <p>Inicia sesión para ver tus comunidades.</p>
          <Link href="/login" className="btn-primary" style={{ fontSize: '0.8125rem', padding: '0.4rem 1rem' }}>Iniciar sesión</Link>
        </div>
        <style>{`
          .hub-right { display: flex; flex-direction: column; border-left: 1px solid var(--border); max-height: calc(100dvh - var(--total-nav)); }
          .hub-right-empty { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 2rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.8125rem; }
        `}</style>
      </aside>
    )
  }

  return (
    <aside className="hub-right">
      <div className="hub-right-header">
        <h3 className="hub-right-title">Mis comunidades</h3>
        <span className="hub-right-count">{myCommunities.length}</span>
      </div>

      <div className="hub-right-section">
        {myCommunities.length === 0 ? (
          <p className="hub-right-no-data">No estás en ninguna comunidad aún.</p>
        ) : (
          <div className="hub-right-list">
            {myCommunities.map(c => (
              <button
                key={c.id}
                onClick={() => onCommunityChange(c.slug)}
                className="mc-row"
              >
                <div className="mc-avatar-wrap">
                  {c.avatar_url ? (
                    <Image src={c.avatar_url} alt="" width={28} height={28} className="mc-avatar" />
                  ) : (
                    <div className="mc-avatar-fallback">{c.name[0]}</div>
                  )}
                </div>
                <span className="mc-name">{c.name}</span>
                <span className="mc-role">{c.user_role === 'creador' ? 'Creador' : c.user_role === 'moderador' ? 'Mod' : ''}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .hub-right { display: flex; flex-direction: column; border-left: 1px solid var(--border); overflow-y: auto; max-height: calc(100dvh - var(--total-nav)); }
        .hub-right-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 0.75rem; border-bottom: 1px solid var(--border); flex-shrink: 0; }
        .hub-right-title { font-family: var(--font-display); font-size: 0.8125rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 0; }
        .hub-right-count { font-size: 0.6875rem; font-weight: 600; color: var(--text-muted); background: var(--bg-overlay); padding: 0.125rem 0.5rem; border-radius: var(--radius-full); }
        .hub-right-section { padding: 0.5rem; }
        .hub-right-no-data { font-size: 0.8125rem; color: var(--text-muted); text-align: center; padding: 1rem; margin: 0; }
        .hub-right-list { display: flex; flex-direction: column; gap: 1px; }

        .mc-row {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.375rem 0.5rem;
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          cursor: pointer;
          text-align: left;
          width: 100%;
          font-family: var(--font-body);
          font-size: 0.8125rem;
          transition: background var(--transition-fast);
        }
        .mc-row:hover { background: var(--bg-overlay); color: var(--text-primary); }
        .mc-avatar-wrap { width: 28px; height: 28px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: var(--bg-overlay); }
        .mc-avatar { width: 28px; height: 28px; object-fit: cover; }
        .mc-avatar-fallback { width: 100%; height: 100%; background: var(--accent); color: #fff; font-family: var(--font-display); font-size: 0.6875rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
        .mc-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .mc-role { font-size: 0.625rem; font-weight: 600; color: var(--amber); text-transform: uppercase; letter-spacing: 0.04em; }
      `}</style>
    </aside>
  )
}
