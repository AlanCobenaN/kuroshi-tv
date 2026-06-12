'use client'

interface Props {
  src: string
}

export function AdVertical({ src }: Props) {
  return (
    <a href="/registro" className="ad-vertical">
      <img src={src} alt="Kuroshi.lat" className="ad-vertical-img" />
      <style>{`
        .ad-vertical {
          display: block;
          width: 160px;
          flex-shrink: 0;
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: opacity var(--transition-fast);
          border: 1px solid var(--border);
        }
        .ad-vertical:hover { opacity: 0.92; border-color: var(--border-hover); }
        .ad-vertical-img {
          display: block;
          width: 160px;
          height: 600px;
        }
      `}</style>
    </a>
  )
}
