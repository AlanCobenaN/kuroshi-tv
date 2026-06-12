'use client'
// app/anime/[slug]/AnimeBanner.tsx
import Image from 'next/image'
import { Anime } from '@/types'

interface Props {
  anime: Anime
}

export function AnimeBanner({ anime }: Props) {
  const bannerSrc = anime.banner_url ?? anime.cover_url

  return (
    <div className="anime-banner" aria-hidden="true">
      <Image
        src={bannerSrc}
        alt=""
        fill
        sizes="100vw"
        className="anime-banner-img"
        priority
      />
      {/* Gradientes de legibilidad */}
      <div className="anime-banner-grad-bottom" />
      <div className="anime-banner-grad-top"    />

      <style>{`
        .anime-banner {
          position: relative;
          height: 320px;
          overflow: hidden;
          /* Compensa el nav */
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
      `}</style>
    </div>
  )
}
