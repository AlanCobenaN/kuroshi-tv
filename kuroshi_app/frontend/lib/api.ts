// ============================================================
// KUROSHI.LAT — lib/api.ts
// Fetcher centralizado para todos los endpoints REST
//
// REGLA: INTERNAL_API_URL → Server Components (SSR, ~1ms Docker)
//        NEXT_PUBLIC_API_URL → Client Components (navegador → Nginx)
// ============================================================

import { ApiError } from '@/types'

function getBaseUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.INTERNAL_API_URL ?? 'http://localhost:4000/api'
  }
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

interface FetchOptions {
  method?: HttpMethod
  body?: unknown
  token?: string
  cache?: RequestCache
  revalidate?: number | false
  tags?: string[]
}

export class KuroshiApiError extends Error {
  statusCode: number
  error: string

  constructor(data: ApiError) {
    super(data.message)
    this.name = 'KuroshiApiError'
    this.statusCode = data.statusCode
    this.error = data.error
  }
}

function camelToSnake(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(camelToSnake)
  if (obj instanceof Date) return obj
  if (typeof obj === 'object') {
    const result: Record<string, any> = {}
    for (const key of Object.keys(obj)) {
      // Flatten Prisma _count → { comments: 5 } → { comments_count: 5 }
      if (key === '_count' && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        for (const countKey of Object.keys(obj[key])) {
          const countSnake = countKey.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`)
          result[`${countSnake}_count`] = camelToSnake(obj[key][countKey])
        }
        continue
      }
      const snakeKey = key.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`)
      result[snakeKey] = camelToSnake(obj[key])
    }
    return result
  }
  return obj
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = 'GET', body, token, cache, revalidate, tags } = options

  const url = `${getBaseUrl()}${endpoint}`

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const nextOptions: RequestInit['next'] = {}
  if (revalidate !== undefined) nextOptions.revalidate = revalidate
  if (tags?.length) nextOptions.tags = tags

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache,
    next: Object.keys(nextOptions).length ? nextOptions : undefined,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const data = await response.json()

  if (!response.ok) {
    throw new KuroshiApiError(data as ApiError)
  }

  return camelToSnake(data) as T
}

export const api = {
  get: <T>(endpoint: string, opts?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiFetch<T>(endpoint, { ...opts, method: 'GET' }),

  post: <T>(endpoint: string, body: unknown, opts?: Omit<FetchOptions, 'method'>) =>
    apiFetch<T>(endpoint, { ...opts, method: 'POST', body }),

  put: <T>(endpoint: string, body: unknown, opts?: Omit<FetchOptions, 'method'>) =>
    apiFetch<T>(endpoint, { ...opts, method: 'PUT', body }),

  patch: <T>(endpoint: string, body: unknown, opts?: Omit<FetchOptions, 'method'>) =>
    apiFetch<T>(endpoint, { ...opts, method: 'PATCH', body }),

  delete: <T>(endpoint: string, opts?: Omit<FetchOptions, 'method' | 'body'>) =>
    apiFetch<T>(endpoint, { ...opts, method: 'DELETE' }),
}

// ─── Módulo Anime — 10 endpoints ─────────────────────────────

// ─── Módulo Géneros ──────────────────────────────────────────

export const genresApi = {
  getAll: () =>
    api.get('/genres', { cache: 'no-store' }),
}

export const animeApi = {
  getCatalog: (params: Record<string, string | number | undefined>, token?: string) => {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString()
    return api.get(`/anime${query ? `?${query}` : ''}`, { token, cache: 'no-store' })
  },

  getTrending: () =>
    api.get('/anime/trending', { cache: 'no-store' }),

  getAiring: () =>
    api.get('/anime/airing', { cache: 'no-store' }),

  getLatestEpisodes: () =>
    api.get('/anime/latest-episodes', { cache: 'no-store' }),

  getBySlug: (slug: string, token?: string) =>
    api.get(`/anime/${slug}`, { token, cache: 'no-store' }),

  getEpisodes: (slug: string, params?: { season?: number; order?: 'asc' | 'desc' }) => {
    const query = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : ''
    return api.get(`/anime/${slug}/episodes${query}`, { cache: 'no-store' })
  },

  getEpisode: (slug: string, number: number, token?: string) =>
    api.get(`/anime/${slug}/episode/${number}`, {
      token,
      cache: 'no-store',
    }),

  getEpisodeComments: (slug: string, number: number, minute?: number) => {
    const query = minute !== undefined ? `?minute=${minute}` : ''
    return api.get(`/anime/${slug}/episode/${number}/comments${query}`, { cache: 'no-store' })
  },

  postComment: (
    slug: string,
    number: number,
    body: { content: string; videoMinute: number; videoSecond: number; hasSpoiler?: boolean },
    token: string
  ) => api.post(`/anime/${slug}/episode/${number}/comments`, body, { token }),

  likeComment: (slug: string, number: number, commentId: string, token: string) =>
    api.post(`/anime/${slug}/episode/${number}/comments/${commentId}/like`, {}, { token }),

  rateAnime: (slug: string, stars: number, token: string) =>
    api.post(`/anime/${slug}/rate`, { stars }, { token }),
}

// ─── Módulo Auth — 7 endpoints ───────────────────────────────

export const authApi = {
  register: (body: { username: string; email: string; password: string; turnstileToken?: string }) =>
    api.post('/auth/register', body),

  login: (body: { email: string; password: string; turnstileToken?: string }) =>
    api.post('/auth/login', body),

  logout: (token: string) =>
    api.post('/auth/logout', {}, { token }),

  verifyEmail: (token_param: string) =>
    api.post('/auth/verify-email', { token: token_param }),

  resendVerification: (token: string) =>
    api.post('/auth/resend-verification', {}, { token }),

  me: (token: string) =>
    api.get('/auth/me', { token, cache: 'no-store' }),

  changePassword: (body: { currentPassword: string; newPassword: string }, token: string) =>
    api.post('/auth/me/password', body, { token }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  confirmResetPassword: (token: string) =>
    api.post('/auth/confirm-reset-password', { token }),

  ping: (token: string) =>
    api.post('/auth/ping', {}, { token }),
}

// ─── Módulo Usuarios — 13 endpoints ──────────────────────────

export const usersApi = {
  getProfile: (username: string, token?: string) =>
    api.get(`/users/${username}`, { token, cache: token ? 'no-store' : undefined, revalidate: token ? undefined : 60 }),

  updateMe: (
    body: Partial<{
      bio: string
      avatarUrl: string
      favoriteAnimeId: string
      visibility: string
    }>,
    token: string
  ) => api.put('/users/me', body, { token }),

  updateUsername: (username: string, token: string) =>
    api.put('/users/me/username', { username }, { token }),

  getWatchlist: (username: string, token?: string) =>
    api.get(`/users/${username}/watchlist`, { token, revalidate: 60 }),

  // ✅ CORREGIDO: camelCase — coincide con AddToWatchlistDto del backend
  addToWatchlist: (body: { animeId: string; status: string }, token: string) =>
    api.post('/users/me/watchlist', body, { token }),

  // ✅ CORREGIDO: camelCase — coincide con UpdateWatchlistDto del backend
  updateWatchlistEntry: (
    animeId: string,
    body: { status: string; personalRating?: number },
    token: string
  ) => api.put(`/users/me/watchlist/${animeId}`, body, { token }),

  removeFromWatchlist: (animeId: string, token: string) =>
    api.delete(`/users/me/watchlist/${animeId}`, { token }),

  // ✅ CORREGIDO: camelCase — coincide con SaveProgressDto del backend
  saveProgress: (
    body: { episodeId: string; lastMinute: number; completed: boolean },
    token: string
  ) => api.post('/users/me/progress', body, { token }),

  getActivity: (username: string, token?: string) =>
    api.get(`/users/${username}/activity`, { token, cache: token ? 'no-store' : undefined, revalidate: token ? undefined : 60 }),

  getFriends: (username: string, token?: string) =>
    api.get(`/users/${username}/friends`, { token, cache: token ? 'no-store' : undefined, revalidate: token ? undefined : 60 }),

  getUserCommunities: (username: string, token?: string) =>
    api.get(`/users/${username}/communities`, { token, cache: token ? 'no-store' : undefined, revalidate: token ? undefined : 60 }),

  sendFriendRequest: (username: string, token: string) =>
    api.post(`/users/${username}/friend-request`, {}, { token }),

  // ✅ CORREGIDO: acción en femenino — coincide con FriendRequestActionDto del backend
  respondFriendRequest: (
    id: string,
    action: 'aceptada' | 'rechazada',
    token: string
  ) => api.put(`/users/me/friend-request/${id}`, { action }, { token }),

  getFriendRequests: (token: string) =>
    api.get('/users/me/friend-requests', { token, cache: 'no-store' }),

  removeFriend: (friendshipId: string, token: string) =>
    api.delete(`/users/me/friend/${friendshipId}`, { token }),

  getNotifications: (params: { type?: string; page?: number }, token: string) => {
    const query = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString()
    return api.get(
      `/users/me/notifications${query ? `?${query}` : ''}`,
      { token, cache: 'no-store' }
    )
  },

  markAllNotificationsRead: (token: string) =>
    api.put('/users/me/notifications/read-all', {}, { token }),
}

// ─── Módulo Comunidades — 11 endpoints ───────────────────────

export const communitiesApi = {
  getAll: (params?: Record<string, string | number | undefined>, token?: string) => {
    const query = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : ''
    return api.get(`/communities${query}`, { token, revalidate: 300, tags: ['communities'] })
  },

  // ✅ CORREGIDO: no envía slug — el backend lo genera desde el name
  create: (body: { name: string; description?: string; avatarUrl?: string }, token: string) =>
    api.post('/communities', body, { token }),

  getBySlug: (slug: string, token?: string) =>
    api.get(`/communities/${slug}`, { token, cache: 'no-store' }),

  join: (slug: string, token: string) =>
    api.post(`/communities/${slug}/join`, {}, { token }),

  leave: (slug: string, token: string) =>
    api.delete(`/communities/${slug}/leave`, { token }),

  getPosts: (slug: string, page = 1, token?: string) =>
    api.get(`/communities/${slug}/posts?page=${page}`, { token, cache: 'no-store' }),

  getFeed: (page = 1, token?: string) =>
    api.get(`/communities/feed?page=${page}`, { token, cache: 'no-store' }),

  // ✅ CORREGIDO: camelCase — coincide con CreatePostDto del backend
  createPost: (
    slug: string,
    body: { content: string; imageUrl?: string; linkedEpisodeId?: string },
    token: string
  ) => api.post(`/communities/${slug}/posts`, body, { token }),

  likePost: (slug: string, postId: string, token: string) =>
    api.post(`/communities/${slug}/posts/${postId}/like`, {}, { token }),

  updatePost: (
    slug: string,
    postId: string,
    body: { content: string; imageUrl?: string; linkedEpisodeId?: string },
    token: string
  ) => api.patch(`/communities/${slug}/posts/${postId}`, body, { token }),

  hidePost: (slug: string, postId: string, token: string) =>
    api.patch(`/communities/${slug}/posts/${postId}/hide`, {}, { token }),

  deletePost: (slug: string, postId: string, token: string) =>
    api.delete(`/communities/${slug}/posts/${postId}`, { token }),

  getPostComments: (slug: string, postId: string, token?: string) =>
    api.get(`/communities/${slug}/posts/${postId}/comments`, { token, cache: 'no-store' }),

  // ✅ CORREGIDO: camelCase — coincide con CreatePostCommentDto del backend
  createPostComment: (
    slug: string,
    postId: string,
    body: { content: string; parentId?: string; hasSpoiler?: boolean },
    token: string
  ) => api.post(`/communities/${slug}/posts/${postId}/comments`, body, { token }),

  getMyCommunities: (token: string) =>
    api.get('/communities/mine', { token, cache: 'no-store' }),

  getCommunityMembers: (slug: string, token: string) =>
    api.get(`/communities/${slug}/members`, { token, cache: 'no-store' }),

  getChatHistory: (slug: string, token: string) =>
    api.get(`/communities/${slug}/chat`, { token, cache: 'no-store' }),

  // ── Management ─────────────────────────────────────────
  updateCommunity: (slug: string, body: Record<string, unknown>, token: string) =>
    api.patch(`/communities/${slug}`, body, { token }),

  deleteCommunity: (slug: string, token: string) =>
    api.delete(`/communities/${slug}`, { token }),

  transferOwnership: (slug: string, userId: string, token: string) =>
    api.post(`/communities/${slug}/transfer`, { userId }, { token }),

  kickMember: (slug: string, userId: string, token: string) =>
    api.post(`/communities/${slug}/kick`, { userId }, { token }),

  silenceMember: (slug: string, userId: string, durationMinutes: number, token: string) =>
    api.post(`/communities/${slug}/silence`, { userId, durationMinutes }, { token }),

  banMember: (slug: string, userId: string, reason: string | undefined, durationMinutes: number | undefined, token: string) =>
    api.post(`/communities/${slug}/ban`, { userId, reason, durationMinutes }, { token }),

  unbanMember: (slug: string, userId: string, token: string) =>
    api.post(`/communities/${slug}/unban`, { userId }, { token }),

  promoteModerator: (slug: string, userId: string, token: string) =>
    api.post(`/communities/${slug}/moderator`, { userId }, { token }),

  demoteModerator: (slug: string, userId: string, token: string) =>
    api.post(`/communities/${slug}/demote`, { userId }, { token }),

  requestJoin: (slug: string, token: string) =>
    api.post(`/communities/${slug}/request-join`, {}, { token }),

  getJoinRequests: (slug: string, token: string) =>
    api.get(`/communities/${slug}/join-requests`, { token, cache: 'no-store' }),

  approveJoinRequest: (slug: string, requestId: string, token: string) =>
    api.post(`/communities/${slug}/join-requests/approve`, { requestId }, { token }),

  rejectJoinRequest: (slug: string, requestId: string, token: string) =>
    api.post(`/communities/${slug}/join-requests/reject`, { requestId }, { token }),
}

// ─── Módulo Chat — 2 endpoints ───────────────────────────────

export const chatApi = {
  // ✅ camelCase — coincide con SendChatMessageDto del backend
  sendMessage: (
    slug: string,
    body: { content: string; replyToId?: string },
    token: string
  ) => api.post(`/chat/community/${slug}`, body, { token }),

  deleteMessage: (slug: string, messageId: string, token: string) =>
    api.delete(`/chat/community/${slug}/message/${messageId}`, { token }),
}

// ─── Módulo Búsqueda — 1 endpoint ────────────────────────────

export const searchApi = {
  search: (q: string, page = 1) =>
    api.get(
      `/search?q=${encodeURIComponent(q)}&page=${page}`,
      { revalidate: 60 }
    ),
}

// ─── Módulo Admin — Todos los endpoints ─────────────────────

export const adminApi = {
  // Dashboard
  getDashboard: (token: string) =>
    api.get('/admin/dashboard', { token, cache: 'no-store' }),

  // Estadísticas
  getStats: (token: string, period: string = 'mes') =>
    api.get(`/admin/stats?period=${period}`, { token, cache: 'no-store' }),

  // Anime
  getAnimes: (token: string, page = 1, search?: string, limit = 20) => {
    let query = `?page=${page}&limit=${limit}`
    if (search) query += `&search=${encodeURIComponent(search)}`
    return api.get(`/admin/anime${query}`, { token, cache: 'no-store' })
  },

  importAnimeFromMAL: (malId: number, token: string) =>
    api.post('/admin/anime/import', { malId }, { token }),

  importFullAnimeFromMAL: (malId: number, token: string) =>
    api.post('/admin/anime/import-full', { malId }, { token }),

  syncEpisodesFromMAL: (animeId: string, token: string) =>
    api.post(`/admin/anime/${animeId}/sync-episodes`, {}, { token }),

  createAnime: (body: Record<string, unknown>, token: string) =>
    api.post('/admin/anime', body, { token }),

  updateAnime: (animeId: string, body: Record<string, unknown>, token: string) =>
    api.put(`/admin/anime/${animeId}`, body, { token }),

  toggleAnimeVisibility: (animeId: string, token: string) =>
    api.patch(`/admin/anime/${animeId}/visibility`, {}, { token }),

  deleteAnime: (animeId: string, token: string) =>
    api.delete(`/admin/anime/${animeId}`, { token }),

  // Episodios
  createEpisode: (body: Record<string, unknown>, token: string) =>
    api.post('/admin/episodes', body, { token }),

  updateEpisode: (episodeId: string, body: Record<string, unknown>, token: string) =>
    api.put(`/admin/episodes/${episodeId}`, body, { token }),

  deleteEpisode: (episodeId: string, token: string) =>
    api.delete(`/admin/episodes/${episodeId}`, { token }),

  addVideoServer: (episodeId: string, body: { serverName: string; embedUrl: string; sortOrder?: number }, token: string) =>
    api.post(`/admin/episodes/${episodeId}/servers`, body, { token }),

  removeVideoServer: (serverId: string, token: string) =>
    api.delete(`/admin/servers/${serverId}`, { token }),

  // Usuarios
  getUsers: (token: string, page = 1, filter?: string) => {
    const query = filter ? `?page=${page}&filter=${filter}` : `?page=${page}`
    return api.get(`/admin/users${query}`, { token, cache: 'no-store' })
  },

  changeUserRole: (userId: string, role: string, token: string) =>
    api.put(`/admin/users/${userId}/role`, { role }, { token }),

  warnUser: (userId: string, reason: string, token: string) =>
    api.post(`/admin/users/${userId}/warn`, { reason }, { token }),

  silenceUser: (userId: string, days: number, reason: string, token: string) =>
    api.post(`/admin/users/${userId}/silence`, { days, reason }, { token }),

  banUser: (userId: string, days: number | null, reason: string, token: string) =>
    api.post(`/admin/users/${userId}/ban`, { days, reason }, { token }),

  unbanUser: (userId: string, token: string) =>
    api.delete(`/admin/users/${userId}/ban`, { token }),

  deleteUser: (userId: string, token: string) =>
    api.delete(`/admin/users/${userId}`, { token }),

  // Comunidades
  getCommunities: (token: string, page = 1, search?: string) => {
    const query = search ? `?page=${page}&search=${encodeURIComponent(search)}` : `?page=${page}`
    return api.get(`/admin/communities${query}`, { token, cache: 'no-store' })
  },

  promoteCommunity: (communityId: string, reason: string, token: string) =>
    api.post(`/admin/communities/${communityId}/promote`, { reason }, { token }),

  demoteCommunity: (communityId: string, token: string) =>
    api.delete(`/admin/communities/${communityId}/promote`, { token }),

  toggleCommunityActive: (communityId: string, token: string) =>
    api.patch(`/admin/communities/${communityId}/active`, {}, { token }),

  deleteCommunity: (communityId: string, token: string) =>
    api.delete(`/admin/communities/${communityId}`, { token }),

  // Reportes
  getReports: (token: string, page = 1, filter?: string) => {
    const query = filter ? `?page=${page}&filter=${filter}` : `?page=${page}`
    return api.get(`/admin/reports${query}`, { token, cache: 'no-store' })
  },

  reviewReport: (reportId: string, status: string, reviewNote: string, token: string) =>
    api.put(`/admin/reports/${reportId}`, { status, reviewNote }, { token }),

  deleteContent: (contentType: string, contentId: string, token: string) =>
    api.delete(`/admin/content/${contentType}/${contentId}`, { token }),

  // Config global
  getSettings: (token: string) =>
    api.get('/admin/settings', { token, cache: 'no-store' }),

  updateSettings: (body: Record<string, unknown>, token: string) =>
    api.put('/admin/settings', body, { token }),

  // Géneros
  getGenres: (token: string) =>
    api.get('/admin/genres', { token, cache: 'no-store' }),

  createGenre: (name: string, token: string) =>
    api.post('/admin/genres', { name }, { token }),

  updateGenre: (id: string, name: string, token: string) =>
    api.put(`/admin/genres/${id}`, { name }, { token }),

  deleteGenre: (id: string, token: string) =>
    api.delete(`/admin/genres/${id}`, { token }),
}

// ─── Módulo Uploads — 1 endpoint ─────────────────────────────

// ✅ CORREGIDO: envía JSON con base64 — coincide con UploadImageDto del backend
export const uploadsApi = {
  uploadImage: (base64: string, mimeType: string, token: string) =>
    api.post<{ url: string; publicId: string }>(
      '/uploads/image',
      { image: base64, mimeType },
      { token }
    ),
}