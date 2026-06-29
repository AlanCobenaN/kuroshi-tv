// ============================================================
// KUROSHI.LAT — Tipos TypeScript
// Derivados del modelo de datos (Arquitectura Técnica v1.0)
// 18 tablas → interfaces, enums y tipos de API
// ============================================================

// ─── Enums ───────────────────────────────────────────────────

export type UserRole = 'owner' | 'moderador' | 'usuario' | 'visitante'
export type ProfileVisibility = 'publico' | 'solo_amigos' | 'privado'
export type WatchStatus = 'viendo' | 'completado' | 'pendiente' | 'abandonado'
export type FriendshipStatus = 'pendiente' | 'aceptada' | 'rechazada' | 'bloqueada'
export type AnimeStatus = 'en_emision' | 'finalizado' | 'proximamente'
export type AnimeType = 'tv' | 'ova' | 'especial' | 'pelicula'
export type SeasonType = 'temporada' | 'ova' | 'especial'
export type CommunityType = 'oficial' | 'no_oficial'
export type CommunityRole = 'creador' | 'moderador' | 'miembro'
export type ReportStatus = 'pendiente' | 'revisado' | 'desestimado'
export type ReportContentType = 'comentario' | 'post' | 'mensaje' | 'usuario' | 'episodio'
export type NotificationType =
  | 'nuevo_ep'
  | 'like_post'
  | 'like_comment'
  | 'amistad_recibida'
  | 'amistad_enviada'
  | 'amistad_aceptada'
  | 'logro_desbloqueado'
  | 'comunidad_promovida'
  | 'retoma_anime'
  | 'respuesta_post'
  | 'respuesta_comment'
  | 'anuncio_comunidad'

// ─── Grupo Usuarios ──────────────────────────────────────────

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  visibility: ProfileVisibility
  bio?: string
  avatar_url?: string
  oauth_google_id?: string
  oauth_discord_id?: string
  favorite_anime_id?: string
  favorite_anime?: AnimeSummary
  last_active_at: string
  created_at: string
  email_verified: boolean
}

export interface UserPublicProfile {
  id: string
  username: string
  bio?: string
  avatar_url?: string
  role: UserRole
  visibility: ProfileVisibility
  email_verified?: boolean
  favorite_anime?: AnimeSummary
  created_at: string
  friendship_status?: 'pendiente' | 'aceptada' | 'rechazada' | 'bloqueada'
  friendship_id?: string
  followers_count?: number
  following_count?: number
  is_following?: boolean
  stats: {
    episodes_watched: number
    hours_watched: number
    friends_count: number
    communities_count: number
  }
  rank?: Rank
  xp: number
}

export interface UserWatchlist {
  user_id: string
  anime_id: string
  anime: AnimeSummary
  status: WatchStatus
  manual_override: boolean
  personal_rating?: number // 1-5
  last_watched_at?: string
  progress?: {
    current_episode: number
    total_episodes: number
  }
}

export interface UserProgress {
  user_id: string
  episode_id: string
  last_minute: number
  completed: boolean
  watched_at: string
  episode?: { id: string; number: number; title?: string }
}

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendshipStatus
  created_at: string
  user?: UserPublicProfile // el otro usuario en la relación
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  is_read: boolean
  metadata: NotificationMetadata
  stacked_count: number
  created_at: string
}

export type NotificationMetadata =
  | { anime_id: string; episode_number: number; anime_title: string }
  | { post_id: string; community_slug: string; comment_id?: string }
  | { comment_id: string; episode_slug: string }
  | { friendship_id: string; username: string; avatar_url?: string }
  | { achievement_id: string; achievement_name: string; xp_reward: number }
  | { community_id: string; community_slug: string; community_name: string }

// ─── Grupo Anime y Video ─────────────────────────────────────

export interface Anime {
  id: string
  slug: string
  title_es: string
  title_jp: string
  synopsis: string
  cover_url: string
  banner_url?: string
  status: AnimeStatus
  mal_rating?: number
  mal_id?: number
  community_rating?: number
  community_rating_count?: number
  genres: Genre[]
  seasons: Season[]
  studio?: string
  year?: number
  season_name?: string // 'invierno' | 'primavera' | 'verano' | 'otoño'
  total_episodes?: number
  total_views?: number
  is_visible: boolean
  created_at: string
  // Presentes si hay sesión activa
  user_watchlist?: UserWatchlist
  user_progress?: UserProgress
}

export interface AnimeSummary {
  id: string
  slug: string
  title_es: string
  title_jp: string
  cover_url: string
  banner_url?: string
  mal_rating?: number
  status: AnimeStatus
  genres: Genre[]
  total_views?: number
  ratings_count?: number
}

export interface Genre {
  id: string
  name: string
}

export interface Season {
  id: string
  anime_id: string
  number: number
  title?: string
  type: SeasonType
  episodes?: Episode[]
}

export interface Episode {
  id: string
  season_id: string
  number: number
  title?: string
  synopsis?: string
  thumbnail_url?: string
  air_date?: string
  duration_minutes?: number
  views?: number
  // Config de anuncios
  ad_preroll_minute: number
  ad_preroll_enabled: boolean
  ad_ending_minute?: number
  ad_ending_enabled: boolean
  // Servidores disponibles
  video_servers?: VideoServer[]
}

export interface VideoServer {
  id: string
  episode_id: string
  server_name: string
  embed_url: string
  sort_order: number
}

export interface EpisodeComment {
  id: string
  episode_id: string
  user_id: string
  user: {
    username: string
    avatar_url?: string
    role: UserRole
  }
  content: string
  video_minute: number
  video_second: number
  likes_count: number
  has_spoiler: boolean
  created_at: string
  liked_by_me?: boolean
}

export interface AnimeRating {
  user_id: string
  anime_id: string
  stars: number // 1-5
  created_at: string
}

// ─── Grupo Comunidades ───────────────────────────────────────

export interface Community {
  id: string
  slug: string
  name: string
  description?: string
  banner_url?: string
  avatar_url?: string
  type: CommunityType
  members_count: number
  members_threshold: number
  progress_pct: number // hacia comunidad oficial
  is_active: boolean
  created_by: string
  creator?: UserPublicProfile
  rules?: string
  created_at: string
  // Si el usuario autenticado es miembro
  user_membership?: CommunityMember
}

export interface CommunityMember {
  community_id: string
  user_id: string
  user?: UserPublicProfile
  role: CommunityRole
  joined_at: string
}

export interface CommunityWithMembership extends Community {
  user_role: CommunityRole
  joined_at: string
}

export interface CommunityMemberInfo {
  id: string
  username: string
  avatar_url?: string
  role: UserRole
  community_role: CommunityRole
  is_online: boolean
  last_active_at?: string
  joined_at: string
}

export interface JoinRequest {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  user: {
    id: string
    username: string
    avatar_url?: string
  }
}

export interface CommunityBanInfo {
  id: string
  user_id: string
  reason?: string
  banned_by_id: string
  expires_at?: string
  created_at: string
  user?: { id: string; username: string; avatar_url?: string }
}

export interface Post {
  id: string
  community_id?: string
  user_id: string
  user: {
    username: string
    avatar_url?: string
    role: UserRole
    community_role?: CommunityRole
    followers_count?: number
  }
  content: string
  image_url?: string
  linked_episode_id?: string
  linked_episode?: {
    anime_slug: string
    episode_number: number
    anime_title: string
    thumbnail_url?: string
  }
  shared_post_id?: string
  shared_text?: string
  shared_post?: {
    id: string
    content: string
    image_url?: string
    likes_count: number
    created_at: string
    user: {
      username: string
      avatar_url?: string
      role: UserRole
      followers_count?: number
    }
    community?: { slug: string; name: string }
    user_followers_count?: number
  }
  is_pinned: boolean
  is_deleted?: boolean
  likes_count: number
  comments_count: number
  liked_by_me?: boolean
  created_at: string
  edited_at?: string
  community?: { slug: string; name: string }
}

export interface PostComment {
  id: string
  post_id: string
  user_id: string
  user: {
    username: string
    avatar_url?: string
    role: UserRole
  }
  content: string
  parent_id?: string // self-referencial para respuestas anidadas
  replies?: PostComment[]
  has_spoiler: boolean
  likes_count: number
  liked_by_me?: boolean
  created_at: string
}

export interface CommunityMessage {
  id: string
  community_id: string
  user_id: string
  user: {
    username: string
    avatar_url?: string
    role: UserRole
  }
  content: string
  reply_to_id?: string
  reply_to?: {
    id: string
    content: string
    user: { username: string; avatar_url?: string }
  }
  is_deleted?: boolean
  reactions?: MessageReaction[]
  created_at: string
}

export interface MessageReaction {
  emoji: string
  count: number
  user_reacted: boolean
}

// ─── Grupo Gamificación ──────────────────────────────────────

export interface Achievement {
  id: string
  code: string
  name: string
  description: string
  xp_reward: number
  icon_url?: string
  unlocked?: boolean
  unlocked_at?: string
}

export interface Rank {
  id: string
  name: string
  anime_reference: string
  xp_required: number
  sort_order: number
  icon_url?: string
}

export interface UserAchievement {
  user_id: string
  achievement_id: string
  achievement: Achievement
  unlocked_at: string
}

// ─── Grupo Moderación ────────────────────────────────────────

export interface Report {
  id: string
  reporter_id: string
  reporter?: UserPublicProfile
  content_type: ReportContentType
  content_id: string
  reasons: string[]
  description?: string
  status: ReportStatus
  reviewed_by?: string
  reviewed_by_name?: string
  review_note?: string
  created_at: string
  content_ref?: string
}

// ─── Respuestas de API ───────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    total: number
    total_pages: number
    limit: number
  }
}

export interface ApiError {
  statusCode: number
  message: string
  error: string
}

export interface AuthResponse {
  access_token: string
  user: User
}

// ─── Parámetros de búsqueda ──────────────────────────────────

export interface AnimeFilters {
  genre?: string
  status?: AnimeStatus
  season?: string
  year?: number
  studio?: string
  order?: 'popular' | 'weekly' | 'rating' | 'recent' | 'alphabetical'
  page?: number
  limit?: number
  q?: string
}

export interface CommunityFilters {
  type?: CommunityType
  order?: 'active' | 'members' | 'recent'
  q?: string
  page?: number
  limit?: number
}

// ─── WebSocket — Eventos Realtime ────────────────────────────

export interface WsNewComment {
  id: string
  content: string
  video_minute: number
  video_second: number
  likes_count: number
  has_spoiler: boolean
  user: {
    username: string
    avatar_url?: string
  }
  created_at: string
}

export interface WsCommentLiked {
  comment_id: string
  likes_count: number
}

export interface WsCommentDeleted {
  comment_id: string
}

export interface WsNewMessage {
  id: string
  content: string
  is_deleted?: boolean
  reply_to_id?: string
  user: {
    username: string
    avatar_url?: string
  }
  reply_to?: {
    id: string
    content: string
    user: { username: string; avatar_url?: string }
  }
  reactions: MessageReaction[]
  created_at: string
}

export interface WsNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  is_read: boolean
  metadata: NotificationMetadata
  created_at: string
}

export interface WsUserTyping {
  username: string
}

// ─── Wallpapers ──────────────────────────────────────────────

export interface Wallpaper {
  id: string
  url: string
  is_active?: boolean
  created_at?: string
}

// ─── Cloudflare Turnstile ──────────────────────────────────
export interface TurnstileObject {
  render: (container: HTMLElement, options: TurnstileOptions) => string
  remove: (widgetId: string) => void
  reset: (widgetId: string) => void
}

export interface TurnstileOptions {
  sitekey: string
  callback: (token: string) => void
  'expired-callback': () => void
  theme?: 'light' | 'dark' | 'auto'
}

declare global {
  interface Window {
    turnstile?: TurnstileObject
  }
}
