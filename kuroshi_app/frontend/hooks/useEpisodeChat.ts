'use client'
// hooks/useEpisodeChat.ts
// ✅ CORREGIDO:
//   - postComment envía videoMinute (camelCase) — coincide con el backend
//   - Maneja supabase null — Realtime deshabilitado gracefully

import { useState, useEffect, useRef, useCallback } from 'react'
import { episodeChannel } from '@/lib/supabase'
import { EpisodeComment, WsNewComment, WsCommentLiked, WsCommentDeleted } from '@/types'
import { animeApi } from '@/lib/api'

interface UseEpisodeChatOptions {
  animeSlug: string
  episodeNumber: number
  episodeId: string
  currentMinute: number
  isLoggedIn: boolean
  accessToken?: string
}

interface ChatState {
  bufferByMinute: Map<number, EpisodeComment[]>
  visibleComments: EpisodeComment[]
  allComments: EpisodeComment[]
  isLoading: boolean
  error: string | null
  sendComment: (content: string, hasSpoiler?: boolean) => Promise<void>
  likeComment: (commentId: string) => Promise<void>
  isSending: boolean
}

export function useEpisodeChat({
  animeSlug,
  episodeNumber,
  episodeId,
  currentMinute,
  isLoggedIn,
  accessToken,
}: UseEpisodeChatOptions): ChatState {
  const [bufferByMinute, setBufferByMinute]     = useState<Map<number, EpisodeComment[]>>(new Map())
  const [allComments, setAllComments]           = useState<EpisodeComment[]>([])
  const [visibleComments, setVisibleComments]   = useState<EpisodeComment[]>([])
  const [isLoading, setIsLoading]               = useState(true)
  const [error, setError]                       = useState<string | null>(null)
  const [isSending, setIsSending]               = useState(false)

  const currentMinRef  = useRef(currentMinute)
  const filterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Construir buffer indexado por minuto ─────────────────

  const buildBuffer = useCallback((comments: EpisodeComment[]) => {
    const map = new Map<number, EpisodeComment[]>()
    for (const c of comments) {
      const min = c.video_minute
      const existing = map.get(min) ?? []
      existing.push(c)
      existing.sort((a, b) => b.likes_count - a.likes_count)
      map.set(min, existing)
    }
    return map
  }, [])

  // ─── Obtener comentarios para el minuto actual ─────────────

  const getCommentsForMinute = useCallback(
    (buffer: Map<number, EpisodeComment[]>, minute: number): EpisodeComment[] => {
      const exact = buffer.get(minute)
      if (exact && exact.length > 0) return exact

      // Si no hay exactos, buscar el más cercano
      // El chat nunca se ve vacío — siempre muestra comentarios históricos
      let closest: EpisodeComment[] = []
      let minDist = Infinity

      for (const [min, comments] of buffer.entries()) {
        const dist = Math.abs(min - minute)
        if (dist < minDist) {
          minDist = dist
          closest = comments
        }
      }

      return closest
    },
    []
  )

  // ─── Paso 1: Cargar historial completo vía REST ───────────

  useEffect(() => {
    setIsLoading(true)
    setError(null)

    animeApi
      .getEpisodeComments(animeSlug, episodeNumber)
      .then(data => {
        const comments = Array.isArray(data) ? data : (data as any).data ?? []
        const sorted = [...comments].sort(
          (a: EpisodeComment, b: EpisodeComment) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        setAllComments(sorted)
        const buffer = buildBuffer(sorted)
        setBufferByMinute(buffer)
        setVisibleComments(getCommentsForMinute(buffer, currentMinRef.current))
      })
      .catch(() => setError('No se pudo cargar el chat del episodio.'))
      .finally(() => setIsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeSlug, episodeNumber])

  // ─── Paso 2: Suscribirse al canal WebSocket ───────────────

  useEffect(() => {
    const channel = episodeChannel(episodeId)

    // ✅ Si Supabase no está configurado, el Realtime queda deshabilitado
    // El chat sigue funcionando con el historial REST
    if (!channel) return

    channel
      .on('broadcast', { event: 'new_comment' }, ({ payload }: { payload: WsNewComment }) => {
        const newComment: EpisodeComment = {
          id:           payload.id,
          episode_id:   episodeId,
          user_id:      '',
          user:         {
            username:   payload.user.username,
            avatar_url: payload.user.avatar_url,
            role:       'usuario',
          },
          content:      payload.content,
          video_minute: payload.video_minute,
          likes_count:  payload.likes_count,
          has_spoiler:  payload.has_spoiler,
          created_at:   payload.created_at ?? new Date().toISOString(),
          liked_by_me:  false,
        }

        setAllComments(prev => [...prev, newComment])
        setBufferByMinute(prev => {
          const next = new Map(prev)
          const min  = newComment.video_minute
          const existing = next.get(min) ?? []
          const updated  = [...existing, newComment].sort((a, b) => b.likes_count - a.likes_count)
          next.set(min, updated)
          return next
        })
      })

      .on('broadcast', { event: 'comment_liked' }, ({ payload }: { payload: WsCommentLiked }) => {
        setAllComments(prev =>
          prev.map(c =>
            c.id === payload.comment_id ? { ...c, likes_count: payload.likes_count } : c
          )
        )
        setBufferByMinute(prev => {
          const next = new Map(prev)
          for (const [min, comments] of next.entries()) {
            const idx = comments.findIndex(c => c.id === payload.comment_id)
            if (idx !== -1) {
              const updated = [...comments]
              updated[idx] = { ...updated[idx], likes_count: payload.likes_count }
              updated.sort((a, b) => b.likes_count - a.likes_count)
              next.set(min, updated)
            }
          }
          return next
        })
      })

      .on('broadcast', { event: 'comment_deleted' }, ({ payload }: { payload: WsCommentDeleted }) => {
        setAllComments(prev => prev.filter(c => c.id !== payload.comment_id))
        setBufferByMinute(prev => {
          const next = new Map(prev)
          for (const [min, comments] of next.entries()) {
            const filtered = comments.filter(c => c.id !== payload.comment_id)
            if (filtered.length !== comments.length) next.set(min, filtered)
          }
          return next
        })
      })

      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [episodeId])

  // ─── Paso 3: Filtrar buffer cada 10 segundos ──────────────

  useEffect(() => {
    currentMinRef.current = currentMinute
  }, [currentMinute])

  useEffect(() => {
    filterTimerRef.current = setInterval(() => {
      setBufferByMinute(prev => {
        const comments = getCommentsForMinute(prev, currentMinRef.current)
        setVisibleComments(comments)
        return prev
      })
    }, 10_000)

    return () => {
      if (filterTimerRef.current) clearInterval(filterTimerRef.current)
    }
  }, [getCommentsForMinute])

  useEffect(() => {
    setBufferByMinute(prev => {
      const comments = getCommentsForMinute(prev, currentMinute)
      setVisibleComments(comments)
      return prev
    })
  }, [currentMinute, getCommentsForMinute])

  // ─── Enviar comentario — pasa por REST, nunca directo a WS ─

  const sendComment = useCallback(async (content: string, hasSpoiler = false) => {
    if (!accessToken || !isLoggedIn) throw new Error('No autenticado')

    setIsSending(true)
    try {
      // ✅ CORREGIDO: videoMinute en camelCase — coincide con CreateEpisodeCommentDto
      await animeApi.postComment(
        animeSlug,
        episodeNumber,
        { content, videoMinute: currentMinRef.current, hasSpoiler },
        accessToken
      )
      // NestJS valida, guarda en BD y emite new_comment al canal
    } finally {
      setIsSending(false)
    }
  }, [animeSlug, episodeNumber, isLoggedIn, accessToken])

  const likeComment = useCallback(async (commentId: string) => {
    if (!accessToken || !isLoggedIn) return
    await animeApi.likeComment(animeSlug, episodeNumber, commentId, accessToken)
  }, [animeSlug, episodeNumber, isLoggedIn, accessToken])

  return {
    bufferByMinute,
    visibleComments,
    allComments,
    isLoading,
    error,
    sendComment,
    likeComment,
    isSending,
  }
}