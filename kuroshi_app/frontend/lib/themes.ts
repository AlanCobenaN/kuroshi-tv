// ============================================================
// KUROSHI.LAT — Sistema de 8 Temas Oscuros
// ============================================================

export interface Theme {
  id: string
  name: string
  colors: {
    '--bg-base': string
    '--bg-surface': string
    '--bg-elevated': string
    '--bg-overlay': string
    '--bg-hover': string
    '--accent': string
    '--accent-dim': string
    '--accent-glow': string
    '--amber': string
    '--amber-dim': string
    '--text-primary': string
    '--text-secondary': string
    '--text-muted': string
    '--text-inverse': string
    '--border': string
    '--border-hover': string
    '--border-focus': string
    '--shadow-accent': string
  }
}

export const themes: Theme[] = [
  {
    id: 'kuroshi',
    name: 'Kuroshi',
    colors: {
      '--bg-base': '#0a0a0f',
      '--bg-surface': '#111118',
      '--bg-elevated': '#18181f',
      '--bg-overlay': '#1f1f28',
      '--bg-hover': '#25252f',
      '--accent': '#e63946',
      '--accent-dim': '#c42d3a',
      '--accent-glow': 'rgba(230, 57, 70, 0.15)',
      '--amber': '#f4a261',
      '--amber-dim': '#e07b3c',
      '--text-primary': '#f0eff4',
      '--text-secondary': '#9190a0',
      '--text-muted': '#4e4d5c',
      '--text-inverse': '#0a0a0f',
      '--border': 'rgba(255, 255, 255, 0.06)',
      '--border-hover': 'rgba(255, 255, 255, 0.12)',
      '--border-focus': 'rgba(230, 57, 70, 0.4)',
      '--shadow-accent': '0 0 20px rgba(230, 57, 70, 0.2)',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      '--bg-base': '#08080f',
      '--bg-surface': '#0e0e1a',
      '--bg-elevated': '#151526',
      '--bg-overlay': '#1c1c30',
      '--bg-hover': '#22223a',
      '--accent': '#6366f1',
      '--accent-dim': '#4f46e5',
      '--accent-glow': 'rgba(99, 102, 241, 0.15)',
      '--amber': '#f59e0b',
      '--amber-dim': '#d97706',
      '--text-primary': '#e8e8f0',
      '--text-secondary': '#8888a0',
      '--text-muted': '#4a4a60',
      '--text-inverse': '#08080f',
      '--border': 'rgba(255, 255, 255, 0.06)',
      '--border-hover': 'rgba(255, 255, 255, 0.12)',
      '--border-focus': 'rgba(99, 102, 241, 0.4)',
      '--shadow-accent': '0 0 20px rgba(99, 102, 241, 0.2)',
    },
  },
  {
    id: 'shadow',
    name: 'Shadow',
    colors: {
      '--bg-base': '#0c0c10',
      '--bg-surface': '#141418',
      '--bg-elevated': '#1c1c22',
      '--bg-overlay': '#24242a',
      '--bg-hover': '#2c2c34',
      '--accent': '#14b8a6',
      '--accent-dim': '#0d9488',
      '--accent-glow': 'rgba(20, 184, 166, 0.15)',
      '--amber': '#eab308',
      '--amber-dim': '#ca8a04',
      '--text-primary': '#e8e8ee',
      '--text-secondary': '#88889a',
      '--text-muted': '#484858',
      '--text-inverse': '#0c0c10',
      '--border': 'rgba(255, 255, 255, 0.05)',
      '--border-hover': 'rgba(255, 255, 255, 0.10)',
      '--border-focus': 'rgba(20, 184, 166, 0.4)',
      '--shadow-accent': '0 0 20px rgba(20, 184, 166, 0.2)',
    },
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    colors: {
      '--bg-base': '#07070a',
      '--bg-surface': '#0e0e12',
      '--bg-elevated': '#16161c',
      '--bg-overlay': '#1d1d24',
      '--bg-hover': '#25252e',
      '--accent': '#22c55e',
      '--accent-dim': '#16a34a',
      '--accent-glow': 'rgba(34, 197, 94, 0.15)',
      '--amber': '#eab308',
      '--amber-dim': '#ca8a04',
      '--text-primary': '#e4e4ec',
      '--text-secondary': '#848498',
      '--text-muted': '#444458',
      '--text-inverse': '#07070a',
      '--border': 'rgba(255, 255, 255, 0.05)',
      '--border-hover': 'rgba(255, 255, 255, 0.10)',
      '--border-focus': 'rgba(34, 197, 94, 0.4)',
      '--shadow-accent': '0 0 20px rgba(34, 197, 94, 0.2)',
    },
  },
  {
    id: 'twilight',
    name: 'Twilight',
    colors: {
      '--bg-base': '#0a0a12',
      '--bg-surface': '#12101e',
      '--bg-elevated': '#1a182a',
      '--bg-overlay': '#222036',
      '--bg-hover': '#2a2842',
      '--accent': '#a855f7',
      '--accent-dim': '#9333ea',
      '--accent-glow': 'rgba(168, 85, 247, 0.15)',
      '--amber': '#f59e0b',
      '--amber-dim': '#d97706',
      '--text-primary': '#e6e4f0',
      '--text-secondary': '#8684a0',
      '--text-muted': '#464458',
      '--text-inverse': '#0a0a12',
      '--border': 'rgba(255, 255, 255, 0.06)',
      '--border-hover': 'rgba(255, 255, 255, 0.12)',
      '--border-focus': 'rgba(168, 85, 247, 0.4)',
      '--shadow-accent': '0 0 20px rgba(168, 85, 247, 0.2)',
    },
  },
  {
    id: 'ember',
    name: 'Ember',
    colors: {
      '--bg-base': '#0e0a08',
      '--bg-surface': '#16100c',
      '--bg-elevated': '#1e1814',
      '--bg-overlay': '#26201c',
      '--bg-hover': '#302824',
      '--accent': '#f97316',
      '--accent-dim': '#ea580c',
      '--accent-glow': 'rgba(249, 115, 22, 0.15)',
      '--amber': '#fbbf24',
      '--amber-dim': '#f59e0b',
      '--text-primary': '#ece4e0',
      '--text-secondary': '#908480',
      '--text-muted': '#504440',
      '--text-inverse': '#0e0a08',
      '--border': 'rgba(255, 255, 255, 0.06)',
      '--border-hover': 'rgba(255, 255, 255, 0.12)',
      '--border-focus': 'rgba(249, 115, 22, 0.4)',
      '--shadow-accent': '0 0 20px rgba(249, 115, 22, 0.2)',
    },
  },
  {
    id: 'onyx',
    name: 'Onyx',
    colors: {
      '--bg-base': '#090a0c',
      '--bg-surface': '#101216',
      '--bg-elevated': '#181a20',
      '--bg-overlay': '#20222a',
      '--bg-hover': '#282a34',
      '--accent': '#06b6d4',
      '--accent-dim': '#0891b2',
      '--accent-glow': 'rgba(6, 182, 212, 0.15)',
      '--amber': '#eab308',
      '--amber-dim': '#ca8a04',
      '--text-primary': '#e4e6ec',
      '--text-secondary': '#848698',
      '--text-muted': '#444658',
      '--text-inverse': '#090a0c',
      '--border': 'rgba(255, 255, 255, 0.05)',
      '--border-hover': 'rgba(255, 255, 255, 0.10)',
      '--border-focus': 'rgba(6, 182, 212, 0.4)',
      '--shadow-accent': '0 0 20px rgba(6, 182, 212, 0.2)',
    },
  },
  {
    id: 'storm',
    name: 'Storm',
    colors: {
      '--bg-base': '#080b10',
      '--bg-surface': '#0e121c',
      '--bg-elevated': '#161c28',
      '--bg-overlay': '#1e2434',
      '--bg-hover': '#262e40',
      '--accent': '#3b82f6',
      '--accent-dim': '#2563eb',
      '--accent-glow': 'rgba(59, 130, 246, 0.15)',
      '--amber': '#f59e0b',
      '--amber-dim': '#d97706',
      '--text-primary': '#e4e8f0',
      '--text-secondary': '#8488a0',
      '--text-muted': '#444860',
      '--text-inverse': '#080b10',
      '--border': 'rgba(255, 255, 255, 0.06)',
      '--border-hover': 'rgba(255, 255, 255, 0.12)',
      '--border-focus': 'rgba(59, 130, 246, 0.4)',
      '--shadow-accent': '0 0 20px rgba(59, 130, 246, 0.2)',
    },
  },
]

export function getThemeById(id: string): Theme {
  return themes.find(t => t.id === id) ?? themes[0]
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}

const STORAGE_KEY = 'kuroshi_theme'

export function saveThemeId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {}
}

export function loadThemeId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? 'kuroshi'
  } catch {
    return 'kuroshi'
  }
}
