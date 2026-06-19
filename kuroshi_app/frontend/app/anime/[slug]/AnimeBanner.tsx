'use client'
// app/anime/[slug]/AnimeBanner.tsx
import { Anime } from '@/types'

interface Props {
  anime: Anime
}

export function AnimeBanner({ anime }: Props) {
  const bannerSrc = anime.banner_url ?? anime.cover_url

  return (
    <div className="anime-banner" aria-hidden="true">
      <img
        src={bannerSrc}
        alt=""
        className="anime-banner-img"
      />
      {/* Gradientes de legibilidad */}
      <div className="anime-banner-grad-bottom" />
      <div className="anime-banner-grad-top"    />

      <style>{`
        .anime-banner {
          position: relative;
          height: 320px;
          overflow: hidden;
          margin-top: calc(var(--total-nav) * -1);
          margin-bottom: -180px;
        }
        .anime-banner-img {
          object-fit: cover;
          object-position: center 20%;
          filter: brightness(0.45) saturate(1.1);
        }
        .anime-banner-grad-bottom {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 220px;
          background: linear-gradient(to top, var(--bg-base) 0%, transparent 100%);
        }
        .anime-banner-grad-top {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 120px;
          background: linear-gradient(to bottom, rgba(10,10,15,0.6) 0%, transparent 100%);
        }

        @media (max-width: 640px) {
          .anime-banner { height: 200px; margin-bottom: -100px; }
          .anime-banner-img { object-position: center 30%; }
          .anime-banner-grad-bottom { height: 140px; }
          .anime-banner-grad-top { height: 80px; }
        }
      `}</style>
    </div>
  )
}
