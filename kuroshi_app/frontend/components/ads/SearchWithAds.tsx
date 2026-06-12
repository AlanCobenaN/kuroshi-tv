'use client'

import { useMemo, type ReactNode } from 'react'
import { AdVertical } from './AdVertical'

const ADS = ['01-registro', '02-comunidad', '03-amigos'] as const

interface Props {
  children: ReactNode
}

export function SearchWithAds({ children }: Props) {
  const adKey = useMemo(
    () => ADS[Math.floor(Math.random() * ADS.length)],
    [],
  )

  return (
    <div className="search-with-ads">
      <div className="search-ad-col search-ad-col--left">
        <AdVertical src={`/ads/banner-vertical-${adKey}.svg`} />
      </div>

      <div className="search-center">
        {children}
      </div>

      <div className="search-ad-col search-ad-col--right">
        <AdVertical src={`/ads/banner-vertical-${adKey}.svg`} />
      </div>

      <style>{`
        .search-with-ads {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 2.5rem;
          width: 100%;
          padding: 2rem 0.25rem 4rem;
        }
        .search-ad-col {
          position: sticky;
          top: calc(var(--total-nav) + 1rem);
          flex-shrink: 0;
        }
        .search-center {
          flex: 1;
          min-width: 0;
          max-width: 900px;
          margin: 0 auto;
          padding: 0 2rem;
        }
        @media (max-width: 1100px) {
          .search-with-ads {
            flex-direction: column;
            gap: 0;
            padding: 1.5rem 0 3rem;
          }
          .search-ad-col {
            display: none;
          }
          .search-center {
            max-width: 100%;
            padding: 0 1rem;
          }
        }
      `}</style>
    </div>
  )
}
