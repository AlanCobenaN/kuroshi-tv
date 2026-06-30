'use client'
// components/layout/SubNav.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Inicio',      href: '/',             active: true  },
  { label: 'Calendario',  href: '/calendario',    active: true  },
  { label: 'Comunidades', href: '/comunidades',   active: true  },
  { label: 'Anime',       href: '/anime',         active: true  },
  { label: 'Manga',       href: '#',              active: false },
  { label: 'Manhwa',      href: '#',              active: false },
] as const

export function SubNav() {
  const pathname = usePathname()

  const isCurrent = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="subnav" aria-label="Navegación principal">
      <div className="subnav-inner">
        {NAV_ITEMS.map(item => (
          <div key={item.label} className="subnav-item-wrapper">
            {item.active ? (
              <Link
                href={item.href}
                className={`subnav-link ${isCurrent(item.href) ? 'subnav-link--active' : ''}`}
                aria-current={isCurrent(item.href) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ) : (
              <span className="subnav-link subnav-link--disabled" aria-disabled="true" title="Próximamente">
                {item.label}
                <span className="subnav-soon" aria-label="Próximamente">pronto</span>
              </span>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .subnav {
          position: fixed;
          top: var(--header-height);
          left: 0;
          right: 0;
          z-index: 99;
          height: var(--subnav-height);
          background: rgba(10, 10, 15, 0.45);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .subnav::-webkit-scrollbar { display: none; }

        .subnav-inner {
          display: flex;
          align-items: center;
          height: 100%;
          padding: 0 1.5rem;
          gap: 0.125rem;
          min-width: max-content;
        }

        .subnav-link {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.75rem;
          font-family: var(--font-display);
          font-size: 0.8125rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          color: var(--text-secondary);
          border-radius: var(--radius-md);
          transition: color var(--transition-fast), background var(--transition-fast);
          white-space: nowrap;
          text-decoration: none;
        }

        .subnav-link:hover:not(.subnav-link--disabled):not(.subnav-link--active) {
          color: var(--text-primary);
          background: var(--bg-hover);
        }

        .subnav-link--active {
          color: var(--text-primary);
          background: var(--bg-overlay);
          position: relative;
        }

        /* Línea inferior en el ítem activo */
        .subnav-link--active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0.75rem;
          right: 0.75rem;
          height: 2px;
          background: var(--accent);
          border-radius: var(--radius-full);
        }

        .subnav-link--disabled {
          color: var(--text-muted);
          cursor: not-allowed;
        }

        .subnav-soon {
          font-size: 0.5625rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          background: var(--bg-overlay);
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          padding: 0.1rem 0.4rem;
          line-height: 1;
        }

        @media (max-width: 640px) {
          .subnav-inner { padding: 0 0.5rem; gap: 0; }
          .subnav-link { padding: 0.2rem 0.5rem; font-size: 0.75rem; }
          .subnav-link--active::after { left: 0.5rem; right: 0.5rem; }
          .subnav-soon { font-size: 0.5rem; padding: 0.05rem 0.3rem; }
        }
      `}</style>
    </nav>
  )
}
