// ============================================================
// KUROSHI.LAT — lib/supabase.ts
// Cliente Supabase para Realtime (WebSockets)
//
// SEGURIDAD: Solo NEXT_PUBLIC_SUPABASE_ANON_KEY en el frontend.
// NUNCA el SERVICE_KEY. La ANON_KEY está limitada por RLS.
// ✅ CORREGIDO: no lanza error en build si Supabase no está
//    configurado — el Realtime simplemente queda deshabilitado.
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'placeholder') {
  console.warn(
    '[Kuroshi] Supabase no configurado. ' +
    'El Realtime (chat en vivo, notificaciones push) estará deshabilitado ' +
    'hasta que configures NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  )
}

// Cliente singleton — null si Supabase no está configurado
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey && supabaseAnonKey !== 'placeholder'
    ? createClient(supabaseUrl, supabaseAnonKey, {
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
        auth: {
          // Supabase auth NO se usa — la auth es JWT de NestJS vía NextAuth
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    : null

// ─── Helpers de canales (devuelven null si Supabase no está listo) ──

export const episodeChannel = (episodeId: string) =>
  supabase?.channel(`episode:${episodeId}`) ?? null

export const episodePresenceChannel = (episodeId: string) =>
  supabase?.channel(`presence:episode:${episodeId}`, {
    config: { presence: { key: episodeId } },
  }) ?? null

export const communityChannel = (communityId: string) =>
  supabase?.channel(`community:${communityId}`) ?? null

export const userNotificationsChannel = (userId: string) =>
  supabase?.channel(`user:${userId}`) ?? null