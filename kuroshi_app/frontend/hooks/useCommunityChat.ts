'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { communityChannel } from '@/lib/supabase'
import { CommunityMessage, WsNewMessage } from '@/types'
import { communitiesApi, chatApi } from '@/lib/api'

interface UseCommunityChat {
  communitySlug: string
  communityId: string
  accessToken?: string
  userRole?: string | null
}

export function useCommunityChat({ communitySlug, communityId, accessToken, userRole }: UseCommunityChat) {
  const [messages, setMessages]   = useState<CommunityMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])

  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const knownIds = useRef<Set<string>>(new Set())
  const isStaff = userRole === 'creador' || userRole === 'moderador'
  const messagesRef = useRef<CommunityMessage[]>([])

  function enrichReply(msg: CommunityMessage): CommunityMessage {
    if (!msg.reply_to_id || msg.reply_to) return msg
    const found = messagesRef.current.find(m => m.id === msg.reply_to_id)
    if (!found) return msg
    return {
      ...msg,
      reply_to: {
        id: found.id,
        content: found.content,
        user: { username: found.user.username, avatar_url: found.user.avatar_url },
      },
    }
  }

  const mergeMessages = useCallback((incoming: CommunityMessage[]) => {
    setMessages(prev => {
      const merged = [...prev]
      for (const msg of incoming) {
        if (!knownIds.current.has(msg.id)) {
          knownIds.current.add(msg.id)
          merged.push(enrichReply(msg))
        }
      }
      merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      return merged
    })
  }, [])

  // Keep ref in sync
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    if (!accessToken) { setIsLoading(false); return }
    setIsLoading(true)
    knownIds.current.clear()
    communitiesApi
      .getChatHistory(communitySlug, accessToken)
      .then((data: any) => {
        const msgs: CommunityMessage[] = Array.isArray(data) ? data : data.data ?? []
        const enriched = msgs.map(enrichReply)
        for (const m of enriched) knownIds.current.add(m.id)
        setMessages(enriched)
      })
      .catch(() => setError('No se pudo cargar el chat.'))
      .finally(() => setIsLoading(false))
  }, [communitySlug, accessToken, userRole])

  const hasSupabase = useRef(false)

  useEffect(() => {
    if (!communityId) return

    const channel = communityChannel(communityId)

    if (!channel) {
      hasSupabase.current = false
      return
    }

    hasSupabase.current = true

    channel
      .on('broadcast', { event: 'new_message' }, ({ payload }: { payload: WsNewMessage }) => {
        if (knownIds.current.has(payload.id)) return
        knownIds.current.add(payload.id)
        const replyId = payload.reply_to_id || payload.reply_to?.id
        let msg: CommunityMessage = {
          id:           payload.id,
          community_id: communityId,
          user_id:      '',
          user:         { username: payload.user.username, avatar_url: payload.user.avatar_url, role: 'usuario' },
          content:      payload.content,
          reply_to_id:  replyId ?? undefined,
          reply_to:     payload.reply_to ?? undefined,
          is_deleted:   payload.is_deleted ?? false,
          created_at:   payload.created_at ?? new Date().toISOString(),
        }
        msg = enrichReply(msg)
        setMessages(prev => [...prev, msg])
      })

      .on('broadcast', { event: 'message_deleted' }, ({ payload }: { payload: { message_id: string; is_deleted?: boolean } }) => {
        if (isStaff) {
          setMessages(prev => prev.map(m => m.id === payload.message_id ? { ...m, is_deleted: true } : m))
        } else {
          knownIds.current.delete(payload.message_id)
          setMessages(prev => prev.filter(m => m.id !== payload.message_id))
        }
      })

      .on('broadcast', { event: 'typing' }, ({ payload }: { payload: { username: string } }) => {
        setTypingUsers(prev => {
          if (prev.includes(payload.username)) return prev
          return [...prev, payload.username]
        })
        const existing = typingTimers.current.get(payload.username)
        if (existing) clearTimeout(existing)
        typingTimers.current.set(
          payload.username,
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u !== payload.username))
            typingTimers.current.delete(payload.username)
          }, 3000)
        )
      })

      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [communityId, isStaff])

  useEffect(() => {
    if (!accessToken || !communitySlug) return
    if (hasSupabase.current) return

    const poll = async () => {
      try {
        const data: any = await communitiesApi.getChatHistory(communitySlug, accessToken)
        const msgs: CommunityMessage[] = Array.isArray(data) ? data : data.data ?? []
        mergeMessages(msgs)
      } catch {}
    }

    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [communitySlug, accessToken, mergeMessages, userRole])

  // Filter out deleted messages for regular users (staff sees them)
  const visibleMessages = isStaff ? messages : messages.filter(m => !m.is_deleted)

  const sendMessage = useCallback(async (content: string, replyToId?: string) => {
    const token = accessToken
    if (!token) throw new Error('No autenticado')

    setIsSending(true)
    try {
      const created: any = await chatApi.sendMessage(communitySlug, { content, replyToId }, token)
      if (created?.id && !knownIds.current.has(created.id)) {
        knownIds.current.add(created.id)
        const enriched = enrichReply(created as CommunityMessage)
        setMessages(prev => [...prev, enriched].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ))
      }
    } finally {
      setIsSending(false)
    }
  }, [communitySlug, accessToken])

  const deleteMessage = useCallback(async (messageId: string) => {
    const token = accessToken
    if (!token) throw new Error('No autenticado')
    knownIds.current.delete(messageId)
    await chatApi.deleteMessage(communitySlug, messageId, token)
  }, [communitySlug, accessToken])

  const sendTyping = useCallback(async (username: string) => {
    const channel = communityChannel(communityId)
    if (!channel) return
    await channel.send({ type: 'broadcast', event: 'typing', payload: { username } })
  }, [communityId])

  return { messages: visibleMessages, typingUsers, isLoading, isSending, error, sendMessage, deleteMessage, sendTyping }
}
