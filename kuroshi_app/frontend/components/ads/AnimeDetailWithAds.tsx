'use client'

import { useMemo, type ReactNode } from 'react'
import { AdVertical } from './AdVertical'

const ADS = ['01-registro', '02-comunidad', '03-amigos'] as const

interface Props {
  children: ReactNode
}

export function AnimeDetailWithAds({ children }: Props) {
  const adKey = useMemo(
    () => ADS[Math.floor(Math.random() * ADS.length)],
    [],
  )

  return (
    <div className="anime-detail-with-ads">
      <div className="anime-detail-ad-col anime-detail-ad-col--left">
        <AdVertical src={`/ads/banner-vertical-${adKey}.svg`} />
      </div>

      <div className="anime-detail-center">
        {children}
      </div>

      <div className="anime-detail-ad-col anime-detail-ad-col--right">
        <AdVertical src={`/ads/banner-vertical-${adKey}.svg`} />
      </div>

      <style>{`
        .anime-detail-with-ads {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 2.5rem;
          width: 100%;
          padding: 0 0.25rem;
        }
        .anime-detail-ad-col {
          position: sticky;
          top: calc(var(--total-nav) + 1rem);
          flex-shrink: 0;
        }
        .anime-detail-center {
          flex: 1;
          min-width: 0;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1rem;
        }
        @media (min-width: 640px) {
          .anime-detail-center { padding: 0 1.5rem; }
        }
        @media (min-width: 1024px) {
          .anime-detail-center { padding: 0 2rem; }
        }
        @media (max-width: 1100px) {
          .anime-detail-with-ads {
            flex-direction: column;
            gap: 0;
          }
          .anime-detail-ad-col {
            display: none;
          }
          .anime-detail-center {
            max-width: 100%;
            padding: 0 1rem;
          }
        }
      `}</style>
    </div>
  )
}
