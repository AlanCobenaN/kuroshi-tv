'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { searchApi } from '@/lib/api'

interface GifData {
  id: string
  title: string
  gif: string
  preview: string
  width: number
  height: number
}

interface Props {
  onSelect: (url: string) => void
  onClose: () => void
}

export function GifSearch({ onSelect, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GifData[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<number>(0)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setIsSearching(true)
    setError('')
    try {
      const data: any = await searchApi.gifs(q.trim())
      setResults(data?.data ?? [])
      if (!data?.data?.length && !isSearching) setError('Sin resultados')
    } catch {
      setError('Búsqueda no disponible')
    }
    finally { setIsSearching(false) }
  }, [])

  const handleInput = (val: string) => {
    setQuery(val)
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => doSearch(val), 400)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); doSearch(query) }
  }

  return (
    <div className="ts-container">
      <div className="ts-header">
        <div className="ts-search-row">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar GIFs..."
            className="ts-input"
          />
          <button onClick={onClose} className="ts-close-btn" aria-label="Cerrar">✕</button>
        </div>
      </div>

      <div className="ts-body">
        {isSearching && (
          <div className="ts-loading"><div className="ts-spinner" /></div>
        )}
        {error && !isSearching && (
          <div className="ts-error">{error}</div>
        )}
        {!isSearching && !error && results.length === 0 && query && (
          <div className="ts-empty">Sin resultados para &quot;{query}&quot;</div>
        )}
        {!isSearching && results.length > 0 && (
          <div className="ts-grid">
            {results.map(g => (
              <button
                key={g.id}
                className="ts-gif-btn"
                onClick={() => onSelect(g.gif)}
                title={g.title}
              >
                <img
                  src={g.preview || g.gif}
                  alt={g.title || 'GIF'}
                  className="ts-gif-img"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
        {!query && !isSearching && results.length === 0 && (
          <div className="ts-hint">Escribe una palabra clave para buscar GIFs</div>
        )}
      </div>

      <style>{`
        .ts-container {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          max-height: 360px;
          display: flex;
          flex-direction: column;
        }
        .ts-header { padding: 0.5rem; border-bottom: 1px solid var(--border); flex-shrink: 0; }
        .ts-search-row {
          display: flex; align-items: center; gap: 0.5rem;
          background: var(--bg-overlay); border-radius: var(--radius-md);
          padding: 0 0.625rem;
        }
        .ts-search-row svg { color: var(--text-muted); flex-shrink: 0; }
        .ts-input {
          flex: 1; padding: 0.5rem 0; background: transparent; border: none;
          outline: none; color: var(--text-primary); font-family: var(--font-body);
          font-size: 0.8125rem;
        }
        .ts-input::placeholder { color: var(--text-muted); }
        .ts-close-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.875rem; padding: 0.25rem; line-height: 1; }
        .ts-close-btn:hover { color: var(--text-primary); }
        .ts-body { overflow-y: auto; flex: 1; padding: 0.5rem; min-height: 100px; }
        .ts-loading { display: flex; align-items: center; justify-content: center; padding: 2rem; }
        .ts-spinner { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: ts-spin 0.8s linear infinite; }
        @keyframes ts-spin { to { transform: rotate(360deg); } }
        .ts-error { text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.8125rem; }
        .ts-empty { text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.8125rem; }
        .ts-hint { text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.8125rem; }
        .ts-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.375rem; }
        .ts-gif-btn {
          display: block; padding: 0; border: none; border-radius: var(--radius-md);
          overflow: hidden; cursor: pointer; background: var(--bg-elevated);
          transition: transform var(--transition-fast);
          aspect-ratio: 1;
        }
        .ts-gif-btn:hover { transform: scale(1.03); }
        .ts-gif-img { width: 100%; height: 100%; object-fit: cover; display: block; }
      `}</style>
    </div>
  )
}
