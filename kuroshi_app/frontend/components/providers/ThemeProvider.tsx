'use client'
// components/providers/ThemeProvider.tsx
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { themes, getThemeById, applyTheme, saveThemeId, loadThemeId, Theme } from '@/lib/themes'

interface ThemeContextValue {
  currentTheme: Theme
  setTheme: (id: string) => void
  availableThemes: typeof themes
}

const ThemeContext = createContext<ThemeContextValue>({
  currentTheme: themes[0],
  setTheme: () => {},
  availableThemes: themes,
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedId = loadThemeId()
    const theme = getThemeById(savedId)
    setCurrentTheme(theme)
    applyTheme(theme)
    setMounted(true)
  }, [])

  const setTheme = useCallback((id: string) => {
    const theme = getThemeById(id)
    setCurrentTheme(theme)
    applyTheme(theme)
    saveThemeId(id)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, availableThemes: themes }}>
      {children}
    </ThemeContext.Provider>
  )
}
