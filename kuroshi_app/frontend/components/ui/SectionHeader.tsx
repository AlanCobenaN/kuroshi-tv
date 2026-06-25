'use client'
// components/ui/SectionHeader.tsx
import Link from 'next/link'

interface Props {
  title: string
  subtitle?: string
  href?: string
  hrefLabel?: string
  as?: 'h1' | 'h2' | 'h3'
}

export function SectionHeader({ title, subtitle, href, hrefLabel = 'Ver todo', as = 'h2' }: Props) {
  const Heading = as
  return (
    <div className="section-header">
      <div className="section-header-left">
        <Heading className="section-title">{title}</Heading>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="section-link">
          {hrefLabel}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      )}

      <style>{`
        .section-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }
        .section-header-left { display: flex; flex-direction: column; gap: 0.25rem; }
        .section-title {
          font-family: var(--font-display);
          font-size: clamp(1.125rem, 2.5vw, 1.375rem);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .section-subtitle {
          font-size: 0.8125rem;
          color: var(--text-muted);
          margin: 0;
        }
        .section-link {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--accent);
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
          transition: gap var(--transition-fast);
        }
        .section-link:hover { gap: 0.6rem; }
      `}</style>
    </div>
  )
}
