'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { episodeChannel } from '@/lib/supabase'
import { EpisodeComment, WsNewComment, WsCommentLiked, WsCommentDeleted } from '@/types'
import { animeApi } from '@/lib/api'

interface UseEpisodeChatOptions {
  animeSlug: string
  episodeNumber: number
  episodeId: string
  isLoggedIn: boolean
  accessToken?: string
}

interface ChatState {
  visibleComments: EpisodeComment[]
  allComments: EpisodeComment[]
  isLoading: boolean
  error: string | null
  sendComment: (content: string, videoMinute: number, videoSecond: number, hasSpoiler?: boolean) => Promise<void>
  likeComment: (commentId: string) => Promise<void>
  isSending: boolean
}

function totalSeconds(c: EpisodeComment): number {
  return c.video_minute * 60 + c.video_second
}

export function useEpisodeChat({
  animeSlug,
  episodeNumber,
  episodeId,
  isLoggedIn,
  accessToken,
}: UseEpisodeChatOptions): ChatState {
  const [allComments, setAllComments] = useState<EpisodeComment[]>([])
  const [visibleComments, setVisibleComments] = useState<EpisodeComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  // ─── Cargar historial completo vía REST ───────────────

  useEffect(() => {
    setIsLoading(true)
    setError(null)

    animeApi
      .getEpisodeComments(animeSlug, episodeNumber)
      .then(data => {
        const comments = Array.isArray(data) ? data : (data as any).data ?? []
        const sorted = [...comments].sort(
          (a: EpisodeComment, b: EpisodeComment) => totalSeconds(a) - totalSeconds(b)
        )
        setAllComments(sorted)
        setVisibleComments(sorted)
      })
      .catch(() => setError('No se pudo cargar el chat del episodio.'))
      .finally(() => setIsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animeSlug, episodeNumber])

  // ─── Suscribirse al canal WebSocket ───────────────────

  useEffect(() => {
    const channel = episodeChannel(episodeId)
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
          video_second: payload.video_second ?? 0,
          likes_count:  payload.likes_count,
          has_spoiler:  payload.has_spoiler,
          created_at:   payload.created_at ?? new Date().toISOString(),
          liked_by_me:  false,
        }
        setAllComments(prev => {
          const next = [...prev, newComment]
          next.sort((a, b) => totalSeconds(a) - totalSeconds(b))
          return next
        })
        setVisibleComments(prev => {
          const next = [...prev, newComment]
          next.sort((a, b) => totalSeconds(a) - totalSeconds(b))
          return next
        })
      })

      .on('broadcast', { event: 'comment_liked' }, ({ payload }: { payload: WsCommentLiked }) => {
        setAllComments(prev =>
          prev.map(c =>
            c.id === payload.comment_id ? { ...c, likes_count: payload.likes_count } : c
          )
        )
        setVisibleComments(prev =>
          prev.map(c =>
            c.id === payload.comment_id ? { ...c, likes_count: payload.likes_count } : c
          )
        )
      })

      .on('broadcast', { event: 'comment_deleted' }, ({ payload }: { payload: WsCommentDeleted }) => {
        setAllComments(prev => prev.filter(c => c.id !== payload.comment_id))
        setVisibleComments(prev => prev.filter(c => c.id !== payload.comment_id))
      })

      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [episodeId])

  // ─── Enviar comentario ────────────────────────────────

  const sendComment = useCallback(async (
    content: string,
    videoMinute: number,
    videoSecond: number,
    hasSpoiler = false
  ) => {
    if (!accessToken || !isLoggedIn) throw new Error('No autenticado')

    setIsSending(true)
    try {
      await animeApi.postComment(
        animeSlug,
        episodeNumber,
        { content, videoMinute, videoSecond, hasSpoiler },
        accessToken
      )
    } finally {
      setIsSending(false)
    }
  }, [animeSlug, episodeNumber, isLoggedIn, accessToken])

  const likeComment = useCallback(async (commentId: string) => {
    if (!accessToken || !isLoggedIn) return
    await animeApi.likeComment(animeSlug, episodeNumber, commentId, accessToken)
  }, [animeSlug, episodeNumber, isLoggedIn, accessToken])

  return {
    visibleComments,
    allComments,
    isLoading,
    error,
    sendComment,
    likeComment,
    isSending,
  }
}
