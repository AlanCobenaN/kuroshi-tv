'use client'

import { useMemo, type ReactNode } from 'react'
import { AdVertical } from './AdVertical'

const ADS = ['01-registro', '02-comunidad', '03-amigos'] as const

interface Props {
  children: ReactNode
}

export function PlayerWithAds({ children }: Props) {
  const adKey = useMemo(
    () => ADS[Math.floor(Math.random() * ADS.length)],
    [],
  )

  return (
    <div className="player-with-ads">
      <div className="player-ad-col player-ad-col--left">
        <AdVertical src={`/ads/banner-vertical-${adKey}.svg`} />
      </div>

      <div className="player-center">
        {children}
      </div>

      <div className="player-ad-col player-ad-col--right">
        <AdVertical src={`/ads/banner-vertical-${adKey}.svg`} />
      </div>

      <style>{`
        .player-with-ads {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 2.5rem;
          width: 100%;
          padding: 0 0.25rem;
        }
        .player-ad-col {
          position: sticky;
          top: calc(var(--total-nav) + 1rem);
          flex-shrink: 0;
        }
        .player-center {
          flex: 1;
          min-width: 0;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1rem;
        }
        @media (min-width: 640px) {
          .player-center { padding: 0 1.5rem; }
        }
        @media (min-width: 1024px) {
          .player-center { padding: 0 2rem; }
        }
        @media (max-width: 1100px) {
          .player-with-ads {
            flex-direction: column;
            gap: 0;
          }
          .player-ad-col {
            display: none;
          }
          .player-center {
            max-width: 100%;
            padding: 0 1rem;
          }
        }
      `}</style>
    </div>
  )
}
