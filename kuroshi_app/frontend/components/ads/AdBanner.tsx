'use client'

import { useMemo } from 'react'

const ADS = ['01-registro', '02-comunidad', '03-chat'] as const

const LINKS: Record<string, string> = {
  '01-registro': '/registro',
  '02-comunidad': '/comunidades',
  '03-chat': '/chat',
}

export function AdBanner() {
  const ad = useMemo(() => ADS[Math.floor(Math.random() * ADS.length)], [])

  return (
    <a href={LINKS[ad]} className="ad-banner">
      <img
        src={`/ads/banner-horizontal-${ad}.svg`}
        alt="Kuroshi.lat — Anime + Comunidad"
        className="ad-banner-img"
      />
      <style>{`
        .ad-banner {
          display: block;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: opacity var(--transition-fast);
        }
        .ad-banner:hover { opacity: 0.92; }
        .ad-banner-img {
          display: block;
          width: 100%;
          height: auto;
          aspect-ratio: 728 / 90;
        }
      `}</style>
    </a>
  )
}
