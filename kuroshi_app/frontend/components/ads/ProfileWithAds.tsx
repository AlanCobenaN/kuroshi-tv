'use client'

import { useMemo, type ReactNode } from 'react'
import { AdVertical } from './AdVertical'

const ADS = ['01-registro', '02-comunidad', '03-amigos'] as const

interface Props {
  children: ReactNode
}

export function ProfileWithAds({ children }: Props) {
  const adKey = useMemo(
    () => ADS[Math.floor(Math.random() * ADS.length)],
    [],
  )

  return (
    <div className="profile-with-ads">
      <div className="profile-ad-col profile-ad-col--left">
        <AdVertical src={`/ads/banner-vertical-${adKey}.svg`} />
      </div>

      <div className="profile-center">
        {children}
      </div>

      <div className="profile-ad-col profile-ad-col--right">
        <AdVertical src={`/ads/banner-vertical-${adKey}.svg`} />
      </div>

      <style>{`
        .profile-with-ads {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 2.5rem;
          width: 100%;
          padding: 0 0.25rem 4rem;
        }
        .profile-ad-col {
          position: sticky;
          top: calc(var(--total-nav) + 1rem);
          flex-shrink: 0;
        }
        .profile-center {
          flex: 1;
          min-width: 0;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 2rem;
        }
        @media (max-width: 1100px) {
          .profile-with-ads {
            flex-direction: column;
            gap: 0;
            padding: 0 0 3rem;
          }
          .profile-ad-col {
            display: none;
          }
          .profile-center {
            max-width: 100%;
            padding: 0 1rem;
          }
        }
      `}</style>
    </div>
  )
}
