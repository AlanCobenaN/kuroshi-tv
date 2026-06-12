'use client'
// app/comunidades/[slug]/CommunityClient.tsx
import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Community } from '@/types'
import { communitiesApi } from '@/lib/api'
import { CommunityFeed } from './CommunityFeed'
import { CommunityChatPanel } from './CommunityChatPanel'

interface Props {
  community: Community
  isMember: boolean
  isLoggedIn: boolean
  accessToken?: string
  userId?: string
  username?: string
}

type TabId = 'feed' | 'chat' | 'miembros' | 'sobre'

export function CommunityClient({ community, isMember: initialIsMember, isLoggedIn, accessToken, userId, username }: Props) {
  const [activeTab, setActiveTab]   = useState<TabId>('feed')
  const [isMember, setIsMember]     = useState(initialIsMember)
  const [isPending, startTransition] = useTransition()
  const [memberCount, setMemberCount] = useState(community.members_count)

  const handleJoin = () => {
    if (!accessToken) return
    startTransition(async () => {
      try {
        if (isMember) {
          await communitiesApi.leave(community.slug, accessToken)
          setIsMember(false)
          setMemberCount(c => c - 1)
        } else {
          await communitiesApi.join(community.slug, accessToken)
          setIsMember(true)
          setMemberCount(c => c + 1)
        }
      } catch {}
    })
  }

  const progressPct = Math.min(100, (memberCount / community.members_threshold) * 100)

  return (
    <div className="comm-page">
      {/* Banner */}
      <div className="comm-banner">
        {community.banner_url ? (
          <Image src={community.banner_url} alt="" fill sizes="100vw" className="comm-banner-img" priority aria-hidden="true" />
        ) : (
          <div className="comm-banner-fallback" aria-hidden="true" />
        )}
        <div className="comm-banner-grad" aria-hidden="true" />
      </div>

      {/* Header de la comunidad */}
      <div className="container">
        <div className="comm-header">
          <div className="comm-header-left">
            <div className="comm-avatar-wrapper">
              {community.avatar_url ? (
                <Image src={community.avatar_url} alt={community.name} width={72} height={72} className="comm-avatar" />
              ) : (
                <div className="comm-avatar-fallback">{community.name[0]}</div>
              )}
            </div>
            <div className="comm-header-info">
              <div className="comm-header-name-row">
                <h1 className="comm-name">{community.name}</h1>
                {community.type === 'oficial' && (
                  <span className="comm-official">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Oficial
                  </span>
                )}
              </div>
              <p className="comm-members">
                {memberCount.toLocaleString('es')} miembros
              </p>
            </div>
          </div>

          {/* Acción principal */}
          <div className="comm-header-right">
            {isLoggedIn ? (
              <button
                onClick={handleJoin}
                disabled={isPending}
                className={`comm-join-btn ${isMember ? 'comm-join-btn--leave' : 'comm-join-btn--join'}`}
                aria-label={isMember ? 'Abandonar comunidad' : 'Unirse a la comunidad'}
              >
                {isMember ? 'Abandonar' : 'Unirse'}
              </button>
            ) : (
              <Link href="/login" className="comm-join-btn comm-join-btn--join">
                Únete
              </Link>
            )}
          </div>
        </div>

        {/* Barra de progreso hacia oficial — solo para no oficiales */}
        {community.type === 'no_oficial' && community.members_threshold > 0 && (
          <div className="comm-progress-bar" aria-label={`Progreso hacia comunidad oficial: ${progressPct.toFixed(0)}%`}>
            <div className="comm-progress-info">
              <span className="comm-progress-label">
                {memberCount.toLocaleString('es')} de {community.members_threshold.toLocaleString('es')} miembros para ser oficial
              </span>
              <span className="comm-progress-pct">{progressPct.toFixed(0)}%</span>
            </div>
            <div className="comm-progress-track">
              <div className="comm-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="comm-tabs" role="tablist">
          {(isMember
            ? [
                { id: 'feed',     label: 'Feed' },
                { id: 'chat',     label: 'Chat' },
                { id: 'miembros', label: 'Miembros' },
                { id: 'sobre',    label: 'Sobre esta comunidad' },
              ]
            : [
                { id: 'feed',  label: 'Feed' },
                { id: 'sobre', label: 'Sobre esta comunidad' },
              ]
          ).map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`comm-tab ${activeTab === tab.id ? 'comm-tab--active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido del tab */}
      <div className="comm-content container">
        {activeTab === 'feed' && (
          <div className="comm-feed-layout">
            <div className="comm-feed-main">
              <CommunityFeed
                community={community}
                isMember={isMember}
                isLoggedIn={isLoggedIn}
                accessToken={accessToken}
              />
            </div>
            <aside className="comm-feed-sidebar">
              <CommunitySidebar community={community} memberCount={memberCount} />
            </aside>
          </div>
        )}

        {activeTab === 'chat' && isMember && (
          <div className="comm-chat-wrapper">
            <CommunityChatPanel
              communityId={community.id}
              communitySlug={community.slug}
              accessToken={accessToken}
              username={username}
            />
          </div>
        )}

        {activeTab === 'sobre' && <CommunityAbout community={community} memberCount={memberCount} progressPct={progressPct} />}
      </div>

      <style>{`
        .comm-page { min-height: 100dvh; padding-bottom: 4rem; }

        /* Banner */
        .comm-banner {
          position: relative;
          height: 180px;
          margin-top: calc(var(--total-nav) * -1);
          padding-top: var(--total-nav);
          overflow: hidden;
        }
        .comm-banner-img { object-fit: cover; object-position: center; filter: brightness(0.45); }
        .comm-banner-fallback { position: absolute; inset: 0; background: linear-gradient(135deg, var(--bg-elevated), var(--bg-overlay)); }
        .comm-banner-grad { position: absolute; inset: 0; background: linear-gradient(to top, var(--bg-base) 0%, transparent 100%); }

        /* Header */
        .comm-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1rem;
          margin-top: -36px;
          padding-bottom: 1.25rem;
          flex-wrap: wrap;
        }
        .comm-header-left { display: flex; align-items: flex-end; gap: 1rem; }
        .comm-avatar-wrapper { position: relative; flex-shrink: 0; }
        .comm-avatar { width: 72px; height: 72px; border-radius: var(--radius-xl); object-fit: cover; border: 3px solid var(--bg-base); background: var(--bg-elevated); }
        .comm-avatar-fallback {
          width: 72px;
          height: 72px;
          border-radius: var(--radius-xl);
          background: var(--accent);
          color: #fff;
          font-family: var(--font-display);
          font-size: 1.75rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid var(--bg-base);
        }
        .comm-header-info { display: flex; flex-direction: column; gap: 0.25rem; padding-bottom: 0.25rem; }
        .comm-header-name-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .comm-name { font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0; letter-spacing: -0.02em; }
        .comm-official { display: flex; align-items: center; gap: 0.3rem; font-family: var(--font-display); font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #60a5fa; background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.2); border-radius: var(--radius-full); padding: 0.2rem 0.6rem; }
        .comm-members { font-family: var(--font-display); font-size: 0.875rem; color: var(--text-muted); margin: 0; }

        .comm-join-btn {
          padding: 0.5rem 1.5rem;
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 700;
          border-radius: var(--radius-md);
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }
        .comm-join-btn--join { background: var(--accent); color: #fff; }
        .comm-join-btn--join:hover { background: var(--accent-dim); transform: translateY(-1px); }
        .comm-join-btn--leave { background: var(--bg-overlay); color: var(--text-secondary); border: 1px solid var(--border-hover); }
        .comm-join-btn--leave:hover { color: var(--accent); border-color: var(--accent); }
        .comm-join-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        /* Barra de progreso */
        .comm-progress-bar { margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .comm-progress-info { display: flex; justify-content: space-between; align-items: center; }
        .comm-progress-label { font-family: var(--font-display); font-size: 0.75rem; font-weight: 600; color: var(--text-muted); }
        .comm-progress-pct { font-family: var(--font-display); font-size: 0.75rem; font-weight: 700; color: var(--amber); }
        .comm-progress-track { height: 6px; background: var(--bg-overlay); border-radius: var(--radius-full); overflow: hidden; }
        .comm-progress-fill { height: 100%; background: linear-gradient(to right, var(--amber), var(--accent)); border-radius: var(--radius-full); transition: width 0.8s ease; }

        /* Tabs */
        .comm-tabs { display: flex; border-bottom: 1px solid var(--border); overflow-x: auto; scrollbar-width: none; margin-bottom: 1.5rem; }
        .comm-tabs::-webkit-scrollbar { display: none; }
        .comm-tab { position: relative; padding: 0.75rem 1.25rem; font-family: var(--font-display); font-size: 0.875rem; font-weight: 600; color: var(--text-muted); background: transparent; border: none; cursor: pointer; white-space: nowrap; transition: color var(--transition-fast); }
        .comm-tab:hover { color: var(--text-secondary); }
        .comm-tab--active { color: var(--text-primary); }
        .comm-tab--active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: var(--accent); border-radius: var(--radius-full); }

        /* Layout del feed */
        .comm-feed-layout { display: grid; grid-template-columns: 1fr 300px; gap: 2rem; align-items: start; }
        .comm-feed-sidebar { position: sticky; top: calc(var(--total-nav) + 1rem); }
        .comm-chat-wrapper { max-width: 800px; height: 600px; margin: 0 auto; }

        @media (max-width: 900px) {
          .comm-feed-layout { grid-template-columns: 1fr; }
          .comm-feed-sidebar { position: static; }
        }
      `}</style>
    </div>
  )
}

function CommunitySidebar({ community, memberCount }: { community: Community; memberCount: number }) {
  return (
    <div className="sidebar-card">
      {community.description && <p className="sidebar-desc">{community.description}</p>}
      <div className="sidebar-stats">
        <div className="sidebar-stat">
          <span className="sidebar-stat-val">{memberCount.toLocaleString('es')}</span>
          <span className="sidebar-stat-label">Miembros</span>
        </div>
        <div className="sidebar-stat">
          <span className="sidebar-stat-val">{new Date(community.created_at).getFullYear()}</span>
          <span className="sidebar-stat-label">Fundada</span>
        </div>
      </div>
      {community.creator && (
        <div className="sidebar-creator">
          <span className="sidebar-label">Creada por</span>
          <Link href={`/u/${community.creator.username}`} className="sidebar-creator-link">
            {community.creator.username}
          </Link>
        </div>
      )}

      <style>{`
        .sidebar-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
        .sidebar-desc { font-size: 0.875rem; color: var(--text-secondary); margin: 0; line-height: 1.6; }
        .sidebar-stats { display: flex; gap: 1.5rem; }
        .sidebar-stat { display: flex; flex-direction: column; gap: 0.2rem; }
        .sidebar-stat-val { font-family: var(--font-display); font-size: 1.25rem; font-weight: 800; color: var(--text-primary); }
        .sidebar-stat-label { font-family: var(--font-display); font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
        .sidebar-creator { display: flex; flex-direction: column; gap: 0.25rem; }
        .sidebar-label { font-family: var(--font-display); font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); }
        .sidebar-creator-link { font-family: var(--font-display); font-size: 0.875rem; font-weight: 700; color: var(--accent); text-decoration: none; }
        .sidebar-creator-link:hover { text-decoration: underline; }
      `}</style>
    </div>
  )
}

function CommunityAbout({ community, memberCount, progressPct }: { community: Community; memberCount: number; progressPct: number }) {
  return (
    <div className="about-section">
      <div className="about-card">
        <h2 className="about-title">Sobre esta comunidad</h2>
        {community.description ? (
          <p className="about-desc">{community.description}</p>
        ) : (
          <p className="about-desc about-desc--empty">Sin descripción.</p>
        )}
        <div className="about-stats">
          <div className="about-stat">
            <span className="about-stat-val">{memberCount.toLocaleString('es')}</span>
            <span className="about-stat-label">Miembros totales</span>
          </div>
          <div className="about-stat">
            <span className="about-stat-val" style={{ textTransform: 'capitalize' }}>{community.type.replace('_', ' ')}</span>
            <span className="about-stat-label">Tipo</span>
          </div>
          <div className="about-stat">
            <span className="about-stat-val">
              {new Date(community.created_at).toLocaleDateString('es-LA', { month: 'long', year: 'numeric' })}
            </span>
            <span className="about-stat-label">Creada</span>
          </div>
        </div>
        {community.type === 'no_oficial' && (
          <div className="about-progress">
            <p className="about-progress-label">
              Progreso hacia comunidad oficial: {memberCount.toLocaleString('es')} / {community.members_threshold.toLocaleString('es')} miembros ({progressPct.toFixed(0)}%)
            </p>
            <div className="about-progress-track">
              <div className="about-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}
      </div>

      <style>{`
        .about-section { max-width: 680px; }
        .about-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 1.75rem; display: flex; flex-direction: column; gap: 1.25rem; }
        .about-title { font-family: var(--font-display); font-size: 1.125rem; font-weight: 700; color: var(--text-primary); margin: 0; }
        .about-desc { font-size: 0.9375rem; color: var(--text-secondary); line-height: 1.7; margin: 0; }
        .about-desc--empty { color: var(--text-muted); font-style: italic; }
        .about-stats { display: flex; gap: 2rem; flex-wrap: wrap; }
        .about-stat { display: flex; flex-direction: column; gap: 0.25rem; }
        .about-stat-val { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--text-primary); }
        .about-stat-label { font-family: var(--font-display); font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
        .about-progress { display: flex; flex-direction: column; gap: 0.5rem; }
        .about-progress-label { font-size: 0.875rem; color: var(--text-secondary); margin: 0; }
        .about-progress-track { height: 8px; background: var(--bg-overlay); border-radius: var(--radius-full); overflow: hidden; }
        .about-progress-fill { height: 100%; background: linear-gradient(to right, var(--amber), var(--accent)); border-radius: var(--radius-full); transition: width 0.8s ease; }
      `}</style>
    </div>
  )
}
