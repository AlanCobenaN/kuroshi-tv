'use client'

import { useMemo, type ReactNode } from 'react'
import { AdVertical } from './AdVertical'

const ADS = ['01-registro', '02-comunidad', '03-amigos'] as const

interface Props {
  children: ReactNode
}

export function CommunitiesWithAds({ children }: Props) {
  const adKey = useMemo(
    () => ADS[Math.floor(Math.random() * ADS.length)],
    [],
  )

  return (
    <div className="comm-with-ads">
      <div className="comm-ad-col comm-ad-col--left">
        <AdVertical src={`/ads/banner-vertical-${adKey}.svg`} />
      </div>

      <div className="comm-center">
        {children}
      </div>

      <div className="comm-ad-col comm-ad-col--right">
        <AdVertical src={`/ads/banner-vertical-${adKey}.svg`} />
      </div>

      <style>{`
        .comm-with-ads {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 2.5rem;
          width: 100%;
          padding: 0 0.25rem;
        }
        .comm-ad-col {
          position: sticky;
          top: calc(var(--total-nav) + 1rem);
          flex-shrink: 0;
        }
        .comm-center {
          flex: 1;
          min-width: 0;
        }
        @media (max-width: 1100px) {
          .comm-with-ads {
            flex-direction: column;
            gap: 0;
            padding: 0;
          }
          .comm-ad-col {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
