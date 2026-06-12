'use client'

import { useMemo } from 'react'

const ADS = ['01-registro', '02-comunidad', '03-amigos'] as const

const LINKS: Record<string, string> = {
  '01-registro': '/registro',
  '02-comunidad': '/comunidades',
  '03-amigos': '/amigos',
}

export function AdFeed() {
  const ad = useMemo(() => ADS[Math.floor(Math.random() * ADS.length)], [])

  return (
    <a href={LINKS[ad]} className="ad-feed">
      <img
        src={`/ads/feed-${ad}.svg`}
        alt="Kuroshi.lat — Anime + Comunidad"
        className="ad-feed-img"
      />
      <style>{`
        .ad-feed {
          display: block;
          width: 100%;
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: opacity var(--transition-fast);
          border: 1px solid var(--border);
          background: var(--bg-surface);
        }
        .ad-feed:hover { opacity: 0.92; border-color: var(--border-hover); }
        .ad-feed-img {
          display: block;
          width: 100%;
          height: auto;
          aspect-ratio: 600 / 400;
        }
      `}</style>
    </a>
  )
}
