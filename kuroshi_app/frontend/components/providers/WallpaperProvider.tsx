'use client'
import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { wallpapersApi } from '@/lib/api'

function isAllowedRoute(pathname: string): boolean {
  if (pathname === '/') return true
  if (pathname.startsWith('/comunidades')) return true
  if (pathname.startsWith('/buscar')) return true
  if (pathname === '/anime') return true
  return false
}

interface WallpaperContextValue {
  currentUrl: string | null
}

const WallpaperContext = createContext<WallpaperContextValue>({
  currentUrl: null,
})

export function useWallpaper() {
  return useContext(WallpaperContext)
}

export function WallpaperProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [wallpapers, setWallpapers] = useState<{ id: string; url: string }[]>([])
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const prevPathRef = useRef(pathname)
  const isAllowed = isAllowedRoute(pathname)

  useEffect(() => {
    wallpapersApi.getAll()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setWallpapers(data)
          const random = data[Math.floor(Math.random() * data.length)]
          setCurrentUrl(random.url)
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const pickRandom = useCallback(() => {
    if (wallpapers.length === 0) return
    const random = wallpapers[Math.floor(Math.random() * wallpapers.length)]
    setCurrentUrl(random.url)
  }, [wallpapers])

  useEffect(() => {
    if (!loaded) return
    if (wallpapers.length === 0) return

    const prev = prevPathRef.current
    prevPathRef.current = pathname

    const wasAllowed = isAllowedRoute(prev)
    const nowAllowed = isAllowedRoute(pathname)

    if (nowAllowed && pathname !== prev) {
      pickRandom()
    }

    if (!nowAllowed) {
      setCurrentUrl(null)
    }
  }, [pathname, loaded, wallpapers, pickRandom])

  return (
    <WallpaperContext.Provider value={{ currentUrl }}>
      {isAllowed && currentUrl && (
        <div
          className="wallpaper-bg"
          style={{ backgroundImage: `url(${currentUrl})` }}
        />
      )}
      {isAllowed && currentUrl && (
        <div className="wallpaper-overlay" />
      )}
      {children}
    </WallpaperContext.Provider>
  )
}
