'use client'
// app/u/[username]/ProfileTabs.tsx
import { useState } from 'react'
import { UserPublicProfile } from '@/types'
import { WatchlistTab } from './tabs/WatchlistTab'
import { ActivityTab } from './tabs/ActivityTab'
import { CommunitiesTab } from './tabs/CommunitiesTab'
import { FriendsTab } from './tabs/FriendsTab'

interface Props {
  profile: UserPublicProfile
  isOwnProfile: boolean
  isLoggedIn: boolean
  accessToken?: string
  currentUserId?: string
  initialTab?: TabId
}

type TabId = 'lista' | 'actividad' | 'comunidades' | 'amigos'

const TABS: { id: TabId; label: string }[] = [
  { id: 'lista',       label: 'Mi Lista' },
  { id: 'actividad',   label: 'Actividad' },
  { id: 'comunidades', label: 'Comunidades' },
  { id: 'amigos',      label: 'Amigos' },
]

export function ProfileTabs({ profile, isOwnProfile, isLoggedIn, accessToken, currentUserId, initialTab }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab && ['lista', 'actividad', 'comunidades', 'amigos'].includes(initialTab) ? initialTab : 'lista')

  const isPrivate   = profile.visibility === 'privado'
  const isFriendsOnly = profile.visibility === 'solo_amigos'
  const canSeeContent = isOwnProfile || (!isPrivate && !isFriendsOnly)

  return (
    <div className="profile-tabs">
      {/* Tab bar */}
      <div className="tab-bar" role="tablist" aria-label="Secciones del perfil">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? 'tab-btn--active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Aviso de privacidad */}
      {!canSeeContent && !isOwnProfile && (
        <div className="profile-private-notice" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          {isPrivate
            ? 'Este perfil es privado.'
            : 'Solo los amigos de este usuario pueden ver su contenido.'}
        </div>
      )}

      {/* Panel activo */}
      {canSeeContent && (
        <div
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="tab-panel"
        >
          {activeTab === 'lista'       && <WatchlistTab username={profile.username} isOwnProfile={isOwnProfile} accessToken={accessToken} />}
          {activeTab === 'actividad'   && <ActivityTab username={profile.username} />}
          {activeTab === 'comunidades' && <CommunitiesTab username={profile.username} />}
          {activeTab === 'amigos'      && <FriendsTab username={profile.username} isOwnProfile={isOwnProfile} accessToken={accessToken} currentUserId={currentUserId} />}
        </div>
      )}

      <style>{`
        .profile-tabs { display: flex; flex-direction: column; gap: 1.5rem; }

        /* Tab bar */
        .tab-bar {
          display: flex;
          gap: 0;
          border-bottom: 1px solid var(--border);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .tab-bar::-webkit-scrollbar { display: none; }

        .tab-btn {
          position: relative;
          padding: 0.75rem 1.25rem;
          font-family: var(--font-display);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          transition: color var(--transition-fast);
        }
        .tab-btn:hover { color: var(--text-secondary); }
        .tab-btn--active { color: var(--text-primary); }
        .tab-btn--active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent);
          border-radius: var(--radius-full);
        }

        /* Aviso de privacidad */
        .profile-private-notice {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 1.25rem;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          font-size: 0.9375rem;
          color: var(--text-secondary);
        }

        .tab-panel { animation: fade-in 0.25s ease; }
      `}</style>
    </div>
  )
}
