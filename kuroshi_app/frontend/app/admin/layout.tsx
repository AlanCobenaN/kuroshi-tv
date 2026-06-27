'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/anime', label: 'Anime', icon: '🎬' },
  { href: '/admin/episodios', label: 'Episodios', icon: '📽️' },
  { href: '/admin/usuarios', label: 'Usuarios', icon: '👥' },
  { href: '/admin/comunidades', label: 'Comunidades', icon: '🏘️' },
  { href: '/admin/reportes', label: 'Reportes', icon: '🚨' },
  { href: '/admin/estadisticas', label: 'Estadísticas', icon: '📈' },
  { href: '/admin/generos', label: 'Géneros', icon: '🏷️' },
  { href: '/admin/wallpapers', label: 'Wallpapers', icon: '🖼️' },
  { href: '/admin/configuracion', label: 'Configuración', icon: '⚙️' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Link href="/admin">Kuroshi Admin</Link>
        </div>
        <nav className="admin-nav">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item ${isActive ? 'admin-nav-item--active' : ''}`}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
      <main className="admin-content">
        {children}
      </main>

      <style>{`
        .admin-layout { display: flex; min-height: calc(100vh - var(--total-nav, 64px)); }
        .admin-sidebar { width: 220px; background: var(--bg-surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; gap: 1rem; padding: 1.25rem 0; flex-shrink: 0; }
        .admin-brand { padding: 0 1.25rem; font-family: var(--font-display); font-size: 1rem; font-weight: 800; color: var(--text-primary); }
        .admin-brand a { color: inherit; text-decoration: none; }
        .admin-nav { display: flex; flex-direction: column; gap: 0.25rem; }
        .admin-nav-item { display: flex; align-items: center; gap: 0.625rem; padding: 0.5rem 1.25rem; font-family: var(--font-display); font-size: 0.875rem; font-weight: 600; color: var(--text-muted); text-decoration: none; transition: all var(--transition-fast); }
        .admin-nav-item:hover { color: var(--text-secondary); background: var(--bg-elevated); }
        .admin-nav-item--active { color: var(--text-primary); background: var(--bg-elevated); }
        .admin-content { flex: 1; padding: 1.5rem 2rem; min-width: 0; }
      `}</style>
    </div>
  )
}
