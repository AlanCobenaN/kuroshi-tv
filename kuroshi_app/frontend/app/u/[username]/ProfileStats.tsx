'use client'
import { UserPublicProfile } from '@/types'

interface Props {
  profile: UserPublicProfile
}

export function ProfileStats({ profile }: Props) {
  // ✅ CORREGIDO: el backend devuelve episodesWatched y friendsCount
  // directamente en el objeto, no dentro de profile.stats
  const episodesWatched = (profile as any).episodes_watched ?? profile.stats?.episodes_watched ?? 0
  const friendsCount    = (profile as any).friends_count    ?? profile.stats?.friends_count    ?? 0
  const communitiesCount = (profile as any)._count?.community_memberships ?? profile.stats?.communities_count ?? 0
  const hoursWatched    = profile.stats?.hours_watched ?? 0

  const stats = [
    {
      value: episodesWatched.toLocaleString('es'),
      label: 'Episodios vistos',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      ),
    },
    {
      value: formatHours(hoursWatched),
      label: 'Horas en el sitio',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      value: friendsCount.toLocaleString('es'),
      label: 'Amigos',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      value: communitiesCount.toLocaleString('es'),
      label: 'Comunidades',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ]

  return (
    <div className="profile-stats" role="list" aria-label="Estadísticas del perfil">
      {stats.map(s => (
        <div key={s.label} className="profile-stat" role="listitem">
          <span className="stat-icon" aria-hidden="true">{s.icon}</span>
          <span className="stat-value">{s.value}</span>
          <span className="stat-label">{s.label}</span>
        </div>
      ))}

      {profile.favorite_anime && (
        <div className="profile-stat profile-stat--anime" role="listitem">
          <span className="stat-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--accent)' }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </span>
          <span className="stat-value stat-value--anime">{profile.favorite_anime.title_es}</span>
          <span className="stat-label">Anime favorito</span>
        </div>
      )}

      <style>{`
        .profile-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          overflow: hidden;
        }
        .profile-stat {
          flex: 1;
          min-width: 120px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.375rem;
          padding: 1.25rem 1rem;
          background: var(--bg-surface);
          text-align: center;
          transition: background var(--transition-fast);
        }
        .profile-stat:hover { background: var(--bg-elevated); }
        .stat-icon { color: var(--text-muted); display: flex; align-items: center; }
        .stat-value {
          font-family: var(--font-display);
          font-size: 1.625rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .stat-value--anime {
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0;
          color: var(--accent);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.3;
        }
        .stat-label {
          font-family: var(--font-display);
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        @media (max-width: 480px) {
          .profile-stat { min-width: 90px; padding: 1rem 0.75rem; }
          .stat-value { font-size: 1.25rem; }
        }
      `}</style>
    </div>
  )
}

function formatHours(h: number): string {
  if (h >= 1000) return `${(h / 1000).toFixed(1)}k`
  return String(Math.round(h))
}