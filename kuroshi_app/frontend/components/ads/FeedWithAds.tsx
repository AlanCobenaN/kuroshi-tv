'use client'

import { useMemo } from 'react'
import { GlobalFeed } from '@/components/community/GlobalFeed'
import { AdVertical } from './AdVertical'

const ADS = ['01-registro', '02-comunidad', '03-amigos'] as const

interface Props {
  isLoggedIn?: boolean
  accessToken?: string
}

export function FeedWithAds({ isLoggedIn, accessToken }: Props) {
  const adKey = useMemo(
    () => ADS[Math.floor(Math.random() * ADS.length)],
    [],
  )

  return (
    <div className="feed-with-ads">
      <div className="feed-ad-col feed-ad-col--left">
        <AdVertical src={`/ads/banner-vertical-${adKey}.svg`} />
      </div>

      <div className="feed-center">
        <GlobalFeed isLoggedIn={isLoggedIn} accessToken={accessToken} />
      </div>

      <div className="feed-ad-col feed-ad-col--right">
        <AdVertical src={`/ads/banner-vertical-${adKey}.svg`} />
      </div>

      <style>{`
        .feed-with-ads {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 2.5rem;
          width: 100%;
          padding: 0 0.25rem;
        }
        .feed-ad-col {
          position: sticky;
          top: calc(var(--total-nav) + 1.5rem);
          flex-shrink: 0;
          padding-top: 0.25rem;
        }
        .feed-center {
          flex: 1;
          min-width: 0;
        }
        @media (max-width: 1100px) {
          .feed-with-ads {
            flex-direction: column;
            align-items: stretch;
            gap: 1.5rem;
            padding: 0;
          }
          .feed-ad-col {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
