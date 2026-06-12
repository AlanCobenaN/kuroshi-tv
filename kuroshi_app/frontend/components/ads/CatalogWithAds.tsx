'use client'

import { useMemo, type ReactNode } from 'react'
import { AdVertical } from './AdVertical'

const ADS = ['01-registro', '02-comunidad', '03-amigos'] as const

interface Props {
  children: ReactNode
}

export function CatalogWithAds({ children }: Props) {
  const adKey = useMemo(
    () => ADS[Math.floor(Math.random() * ADS.length)],
    [],
  )

  return (
    <div className="catalog-with-ads">
      <div className="catalog-ad-col catalog-ad-col--left">
        <AdVertical src={`/ads/banner-vertical-${adKey}.svg`} />
      </div>

      <div className="catalog-center">
        {children}
      </div>

      <div className="catalog-ad-col catalog-ad-col--right">
        <AdVertical src={`/ads/banner-vertical-${adKey}.svg`} />
      </div>

      <style>{`
        .catalog-with-ads {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 2.5rem;
          width: 100%;
          padding: 2rem 0.25rem 4rem;
        }
        .catalog-ad-col {
          position: sticky;
          top: calc(var(--total-nav) + 1.5rem);
          flex-shrink: 0;
          padding-top: 0.25rem;
        }
        .catalog-center {
          flex: 1;
          min-width: 0;
        }
        @media (max-width: 1100px) {
          .catalog-with-ads {
            flex-direction: column;
            gap: 1.5rem;
            padding: 1.5rem 1rem 3rem;
          }
          .catalog-ad-col {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
