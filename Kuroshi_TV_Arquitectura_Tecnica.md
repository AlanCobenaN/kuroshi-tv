# KUROSHI.TV
## Documento de Arquitectura Técnica
**Versión 1.0 | Junio 2026**

*Complemento al Documento de Requisitos del Sistema v1.0*

| Sección | Descripción |
|---|---|
| 1. Modelo de Datos | Esquema entidad-relación: 18 tablas, columnas y relaciones |
| 2. Contratos de API | 52 endpoints REST organizados en 7 módulos |
| 3. Estrategia WebSockets | 4 canales Supabase Realtime, eventos y flujos completos |
| 4. Variables de Entorno | 30 variables para backend, frontend y Docker |
| 5. Orden de Desarrollo | Secuencia de implementación por capas y dependencias |

---

# 1. Modelo de Datos

El modelo cubre todas las entidades del sistema derivadas del documento de requisitos. Se organiza en cinco grupos funcionales. Implementado en PostgreSQL vía Supabase self-hosted con Prisma como ORM.

## 1.1 Principios de Diseño

- Todos los IDs son UUID v4, no enteros autoincrementales
- Todos los timestamps son UTC en formato ISO 8601
- Campos de texto largo usan tipo TEXT en PostgreSQL
- Enumeraciones se definen como ENUM nativo en la base de datos
- Foreign keys explícitas con ON DELETE definido por entidad

## 1.2 Grupo Usuarios

| Tabla | Descripción | Columnas clave |
|---|---|---|
| USERS | Cuenta de usuario. Rol global del sistema | id, username, email, role, visibility, oauth_google_id, oauth_discord_id, favorite_anime_id, last_active_at |
| USER_WATCHLIST | Lista personal de anime por usuario | user_id, anime_id, status, manual_override, personal_rating, last_watched_at |
| USER_PROGRESS | Progreso de reproducción por episodio | user_id, episode_id, last_minute, completed, watched_at |
| FRIENDSHIPS | Solicitudes y relaciones de amistad | requester_id, addressee_id, status (pendiente/aceptada/rechazada/bloqueada) |
| NOTIFICATIONS | Notificaciones del sistema | user_id, type, title, body, is_read, metadata (jsonb), created_at |

> `USER_WATCHLIST.manual_override`: cuando es `true` el sistema no cambia el estado automáticamente. Respeta la decisión manual del usuario sobre el estado de su anime.

> `NOTIFICATIONS.metadata` es `jsonb`. Cada tipo de notificación tiene un payload distinto sin necesidad de columnas específicas por tipo.

## 1.3 Grupo Anime y Video

| Tabla | Descripción | Columnas clave |
|---|---|---|
| ANIMES | Catálogo principal | id, slug, title_es, title_jp, status, mal_rating, mal_id, is_visible |
| GENRES | Géneros disponibles | id, name (único) |
| ANIME_GENRES | Relación N:M anime-género | anime_id, genre_id |
| SEASONS | Temporadas, OVAs y especiales | anime_id, number, title, type |
| EPISODES | Episodios con configuración de anuncios | season_id, number, ad_preroll_minute, ad_preroll_enabled, ad_ending_minute, ad_ending_enabled |
| VIDEO_SERVERS | Servidores de embed por episodio | episode_id, server_name, embed_url, sort_order |
| EPISODE_COMMENTS | Comentarios anclados al minuto | episode_id, user_id, content, video_minute, likes_count, has_spoiler |
| ANIME_RATINGS | Rating de comunidad 1-5 estrellas | user_id, anime_id, stars, created_at |

> `EPISODES` contiene los campos de publicidad directamente. Los valores por episodio sobreescriben la configuración global que vive en la aplicación, no en la BD.

## 1.4 Grupo Comunidades

| Tabla | Descripción | Columnas clave |
|---|---|---|
| COMMUNITIES | Comunidades de fans | slug, type (oficial/no_oficial), members_count, members_threshold, is_active, created_by |
| COMMUNITY_MEMBERS | Membresía con rol por comunidad | community_id, user_id, role (creador/moderador/miembro), joined_at |
| POSTS | Posts del feed | community_id, user_id, content, image_url, linked_episode_id, is_pinned |
| POST_COMMENTS | Comentarios en posts con anidado | post_id, user_id, parent_id (self-referencial), has_spoiler, likes_count |
| COMMUNITY_CHAT | Mensajes del chat en tiempo real | community_id, user_id, content, reply_to_id, created_at |

> `POST_COMMENTS.parent_id` es FK self-referencial a la misma tabla. Permite comentarios anidados (respuestas a respuestas) sin límite de profundidad.

## 1.5 Grupo Gamificación

| Tabla | Descripción | Columnas clave |
|---|---|---|
| ACHIEVEMENTS | Logros desbloqueables | id, code, name, description, xp_reward |
| USER_ACHIEVEMENTS | Logros obtenidos por usuario | user_id, achievement_id, unlocked_at |
| RANKS | Rangos con nombres de universos anime | name, anime_reference, xp_required, sort_order |

## 1.6 Grupo Moderación

| Tabla | Descripción | Columnas clave |
|---|---|---|
| REPORTS | Reportes de contenido por usuarios | reporter_id, content_type, content_id, reason, status (pendiente/revisado/desestimado), reviewed_by |

## 1.7 Decisiones Técnicas del Modelo

| Decisión | Razón |
|---|---|
| USERS.favorite_anime_id como FK directa | Define el banner automático del perfil. Referencia directa es más eficiente que buscar en watchlist. |
| NOTIFICATIONS.metadata como jsonb | Cada tipo de notificación tiene payload diferente. jsonb evita crear columnas específicas por tipo. |
| FRIENDSHIPS con requester_id y addressee_id separados | Necesario saber quién inició la solicitud para el flujo de aceptar y rechazar. |
| Campos de anuncios directamente en EPISODES | El admin configura por episodio individualmente. Los defaults vienen de la configuración global en la app. |
| manual_override en USER_WATCHLIST | Cuando el usuario cambia el estado manualmente, el sistema respeta esa decisión y no la revierte automáticamente. |
| FRIENDSHIPS.status incluye 'bloqueada' | Permite implementar bloqueo de usuarios en Fase 2 sin cambiar el esquema. |

---

# 2. Contratos de API

La API REST es el contrato entre el frontend (Next.js) y el backend (NestJS). 52 endpoints en 7 módulos.

## 2.1 Convenciones Generales

| Convención | Valor |
|---|---|
| Base URL producción | https://kuroshi.tv/api |
| Base URL desarrollo | http://localhost:4000/api |
| Formato de respuesta | JSON en todos los endpoints |
| Autenticación | Bearer token JWT en header Authorization |
| Paginación | Parámetros `page` y `limit`. Responde con `meta: { page, total, total_pages }` |
| Errores | `{ statusCode, message, error }` con el código HTTP correspondiente |
| Fechas | ISO 8601 UTC en todos los campos timestamp |

## 2.2 Niveles de Autenticación

| Nivel | Descripción | Implementación en NestJS |
|---|---|---|
| Público | Cualquier visitante sin token | `@Public()` decorator — sin guard |
| Usuario | JWT válido de cualquier usuario registrado | `@UseGuards(JwtAuthGuard)` |
| Moderador | JWT con rol moderador o owner | `@UseGuards(JwtAuthGuard, RolesGuard)` `@Roles('moderador','owner')` |
| Owner | Solo el propietario del sitio | `@UseGuards(JwtAuthGuard, RolesGuard)` `@Roles('owner')` |

## 2.3 Módulo Anime — 10 endpoints

| Método | URL | Auth | Descripción |
|---|---|---|---|
| GET | /anime | Público | Catálogo con filtros: genre, status, season, year, studio, order, page, limit |
| GET | /anime/trending | Público | Top 10 más vistos esta semana |
| GET | /anime/airing | Público | Animes en emisión con último episodio disponible |
| GET | /anime/:slug | Público | Detalle completo. Incluye user_watchlist y user_progress si hay sesión activa |
| GET | /anime/:slug/episodes | Público | Lista de episodios filtrable por temporada y orden |
| GET | /anime/:slug/episode/:number | Público | Detalle del episodio con servidores de video y configuración de anuncios |
| GET | /anime/:slug/episode/:number/comments | Público | Chat del episodio. Filtrable por `?minute=` para el reproductor en tiempo real |
| POST | /anime/:slug/episode/:number/comments | Usuario | Publicar comentario anclado al minuto. Límite: 200 chars, 1 comentario por minuto |
| POST | ...comments/:id/like | Usuario | Dar like a un comentario de episodio |
| POST | /anime/:slug/rate | Usuario | Votar rating de comunidad 1-5 estrellas |

## 2.4 Módulo Auth — 7 endpoints

| Método | URL | Auth | Descripción |
|---|---|---|---|
| POST | /auth/register | Público | Registro con email. Campos requeridos: username, email, password |
| POST | /auth/login | Público | Login con email y contraseña. Devuelve access_token JWT |
| GET | /auth/google | Público | Inicia flujo OAuth 2.0 con Google |
| GET | /auth/discord | Público | Inicia flujo OAuth 2.0 con Discord |
| POST | /auth/logout | Usuario | Invalida el token actual |
| POST | /auth/verify-email | Público | Verifica email con el token recibido por correo |
| GET | /auth/me | Usuario | Devuelve el perfil completo del usuario autenticado |

## 2.5 Módulo Usuarios — 13 endpoints

| Método | URL | Auth | Descripción |
|---|---|---|---|
| GET | /users/:username | Público | Perfil público. Contenido visible según configuración de privacidad |
| PUT | /users/me | Usuario | Actualizar bio, avatar, anime favorito y visibilidad |
| PUT | /users/me/username | Usuario | Cambiar username. Solo permitido cada 30 días |
| GET | /users/:username/watchlist | Público | Lista de anime. Respeta configuración de privacidad del perfil |
| POST | /users/me/watchlist | Usuario | Añadir anime a la lista con estado inicial |
| PUT | /users/me/watchlist/:animeId | Usuario | Cambiar estado. Activa `manual_override=true` automáticamente |
| DELETE | /users/me/watchlist/:animeId | Usuario | Eliminar anime de la lista personal |
| POST | /users/me/progress | Usuario | Guardar minuto exacto de reproducción del episodio |
| GET | /users/:username/activity | Público | Feed cronológico de actividad reciente |
| POST | /users/:username/friend-request | Usuario | Enviar solicitud de amistad |
| PUT | /users/me/friend-request/:id | Usuario | Aceptar o rechazar solicitud recibida |
| GET | /users/me/notifications | Usuario | Listar notificaciones con filtros por tipo y paginación |
| PUT | /users/me/notifications/read-all | Usuario | Marcar todas las notificaciones como leídas |

## 2.6 Módulo Comunidades — 11 endpoints

| Método | URL | Auth | Descripción |
|---|---|---|---|
| GET | /communities | Público | Explorar con filtros. Incluye secciones featured y trending |
| POST | /communities | Usuario | Crear comunidad. Se crea como `no_oficial` por defecto |
| GET | /communities/:slug | Público | Detalle incluyendo `progress_pct` hacia comunidad oficial |
| POST | /communities/:slug/join | Usuario | Unirse a la comunidad |
| DELETE | /communities/:slug/leave | Usuario | Abandonar la comunidad |
| GET | /communities/:slug/posts | Público | Feed de posts con paginación |
| POST | /communities/:slug/posts | Usuario | Publicar con texto, imagen (URL Imgur) o link a episodio |
| POST | /communities/:slug/posts/:id/like | Usuario | Dar like a un post |
| GET | /communities/:slug/posts/:id/comments | Público | Comentarios del post con respuestas anidadas |
| POST | /communities/:slug/posts/:id/comments | Usuario | Comentar en post o responder a otro comentario |
| GET | /communities/:slug/chat | Usuario | Historial del chat vía REST para cargar antes de conectar el WebSocket |

## 2.7 Módulos Restantes

| Módulo | Endpoints | Descripción |
|---|---|---|
| Búsqueda | GET /search | Búsqueda global con tabs: anime, comunidades, usuarios. Mínimo 2 caracteres. |
| Uploads | POST /uploads/image | Proxy para subir imágenes a Imgur. El cliente nunca llama a Imgur directamente. Evita exponer el API key. |
| Admin — Stats | GET /admin/stats (Mod) | Métricas en tiempo real y por período: hoy, semana, mes, año |
| Admin — Catálogo | POST y PUT /admin/anime (Mod), POST y PUT /admin/episodes (Mod) | Gestión de anime y episodios con import automático desde MAL/AniList |
| Admin — Usuarios | GET /admin/users, PUT /role (Owner), POST /warn y /silence (Mod), POST /ban (Owner) | Gestión de usuarios. Ban y cambio de rol solo para Owner. |
| Admin — Moderación | GET y PUT /admin/reports (Mod), PUT /admin/communities/:id/promote (Mod) | Gestión de reportes y promoción de comunidades a oficiales |
| Admin — Config | GET y PUT /admin/settings (Owner) | Configuración global del sitio, anuncios, SEO y modo mantenimiento |

---

# 3. Estrategia WebSockets / Realtime

Kuroshi.tv usa Supabase Realtime, ya incluido en el stack self-hosted sobre el VPS. No se requiere ningún servicio adicional ni costo extra.

## 3.1 Regla de Arquitectura Central

> **El cliente NUNCA escribe directamente a un canal WebSocket (excepto el indicador 'está escribiendo'). Todo mensaje pasa primero por la REST API de NestJS donde se valida, se guarda en PostgreSQL, y después NestJS lo emite al canal.** Esto garantiza validación, persistencia y control de spam.

## 3.2 Los 4 Canales

| Canal | Patrón | Auth requerida | Propósito |
|---|---|---|---|
| `episode:{episode_id}` | Dinámico por episodio | Lectura pública / Escritura con sesión | Chat anclado al minuto del video. Característica diferenciadora. |
| `community:{community_id}` | Dinámico por comunidad | Solo miembros autenticados | Chat en tiempo real estilo Discord dentro de cada comunidad |
| `user:{user_id}` | Dinámico por usuario | Solo el propio usuario | Notificaciones push sin recargar página |
| `presence:episode:{episode_id}` | Presence por episodio | Público | Contador 'X usuarios viendo ahora' |

## 3.3 Flujo del Chat de Episodio

| Paso | Actor | Acción |
|---|---|---|
| 1 | Frontend | Al abrir el reproductor, carga historial completo del episodio vía REST (GET /episode/comments) |
| 2 | Frontend | Se suscribe al canal `episode:{id}` para recibir comentarios nuevos en tiempo real |
| 3 | Usuario | Escribe comentario. El cliente captura el minuto actual del video automáticamente |
| 4 | Frontend | Llama a `POST /anime/:slug/episode/:number/comments` con `{ content, video_minute }` |
| 5 | NestJS | Valida: autenticado, max 200 chars, no duplicó minuto, no está silenciado. Guarda en PostgreSQL |
| 6 | NestJS | Emite evento `new_comment` al canal `episode:{id}` vía Supabase Realtime |
| 7 | Todos los clientes suscritos | Reciben el evento e insertan el comentario en el buffer del minuto correspondiente |

> **Lógica del reproductor (frontend):** cada 10 segundos filtra el buffer local buscando comentarios con `video_minute` igual al minuto actual del video. Los ordena por `likes_count` descendente. Si no hay en ese minuto, muestra los más cercanos. El chat nunca se ve vacío porque los comentarios históricos persisten.

## 3.4 Eventos por Canal

| Canal | Evento | Dirección | Payload resumido |
|---|---|---|---|
| episode:{id} | new_comment | Servidor → Clientes | `{ id, content, video_minute, likes_count, has_spoiler, user }` |
| episode:{id} | comment_liked | Servidor → Clientes | `{ comment_id, likes_count }` |
| episode:{id} | comment_deleted | Servidor → Clientes | `{ comment_id }` |
| community:{id} | new_message | Servidor → Clientes | `{ id, content, user, reply_to?, reactions }` |
| community:{id} | message_deleted | Servidor → Clientes | `{ message_id }` |
| community:{id} | reaction_updated | Servidor → Clientes | `{ message_id, reactions: [{ emoji, count, user_reacted }] }` |
| community:{id} | user_typing | Cliente → Clientes (broadcast directo) | `{ username }` — TTL 3 segundos. No se guarda en BD. Única excepción a la regla. |
| user:{id} | notification | Servidor → Cliente | `{ id, type, title, body, is_read, metadata }` |

## 3.5 Tipos de Notificación

| Tipo | Lo dispara | Destinatario |
|---|---|---|
| nuevo_ep | Admin sube episodio nuevo | Todos los usuarios con ese anime en watchlist |
| like_post / like_comment | Cualquier usuario da like | Autor del post o comentario |
| amistad_recibida | Alguien envía solicitud | Usuario destinatario |
| amistad_aceptada | Alguien acepta solicitud | Usuario que la envió |
| logro_desbloqueado | Sistema detecta hito (ep 100, 500h, etc) | El usuario que lo logró |
| comunidad_promovida | Admin aprueba promoción | Creador y mods de la comunidad |
| retoma_anime | Sistema detecta retoma de Abandonado | El usuario que retomó |

---

# 4. Variables de Entorno

30 variables organizadas por servicio. Los archivos `.env` **nunca deben subirse a Git**. Agregar `.env`, `.env.local` y `.env.production` al `.gitignore` antes del primer commit.

> **`SUPABASE_SERVICE_KEY` y `JWT_SECRET` son las variables más críticas del proyecto.** Acceso total a la base de datos. Solo existen en el backend (NestJS). Nunca en el frontend, nunca en el navegador.

## 4.1 Niveles de Seguridad

| Nivel | Descripción | Ejemplos |
|---|---|---|
| Crítico | Nunca exponer, nunca commitear a Git | JWT_SECRET, DB_PASSWORD, GOOGLE_CLIENT_SECRET, SUPABASE_SERVICE_KEY |
| Privado | Solo existe en el servidor, no en el cliente | GOOGLE_CLIENT_ID, DISCORD_CLIENT_ID, IMGUR_CLIENT_ID, SMTP_USER |
| Público | Puede estar en el navegador, RLS lo limita | NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_API_URL |
| Interno | Comunicación entre servicios Docker | PORT, DB_HOST, API_PREFIX, SUPABASE_URL (nombre servicio Docker) |

## 4.2 Variables del Backend (NestJS)

| Variable | Valor / Fuente | Nivel |
|---|---|---|
| NODE_ENV | production | Interno |
| PORT | 4000 | Interno |
| API_PREFIX | api | Interno |
| FRONTEND_URL | https://kuroshi.tv | Interno |
| DATABASE_URL | postgresql://kuroshi:PASS@postgres:5432/kuroshi_db | Crítico |
| DB_HOST / DB_PORT / DB_NAME / DB_USER | postgres / 5432 / kuroshi_db / kuroshi | Interno |
| DB_PASSWORD | `openssl rand -base64 32` | Crítico |
| JWT_SECRET | `openssl rand -base64 64` | Crítico |
| JWT_EXPIRES_IN | 7d | Interno |
| GOOGLE_CLIENT_ID | console.cloud.google.com | Privado |
| GOOGLE_CLIENT_SECRET | console.cloud.google.com | Crítico |
| GOOGLE_CALLBACK_URL | https://kuroshi.tv/api/auth/google/callback | Privado |
| DISCORD_CLIENT_ID | discord.com/developers/applications | Privado |
| DISCORD_CLIENT_SECRET | discord.com/developers/applications | Crítico |
| DISCORD_CALLBACK_URL | https://kuroshi.tv/api/auth/discord/callback | Privado |
| SUPABASE_URL | http://supabase-kong:8000 (nombre servicio Docker) | Interno |
| SUPABASE_SERVICE_KEY | JWT firmado con SUPABASE_JWT_SECRET, rol service_role | Crítico |
| SUPABASE_JWT_SECRET | `openssl rand -base64 64` | Crítico |
| IMGUR_CLIENT_ID | api.imgur.com/oauth2/addclient | Privado |
| MAL_CLIENT_ID | myanimelist.net/apiconfig | Privado |
| ANILIST_API_URL | https://graphql.anilist.co (sin clave para queries públicas) | Interno |
| SMTP_HOST / SMTP_PORT | smtp.gmail.com / 587 | Privado |
| SMTP_USER / SMTP_PASSWORD | noreply@... / Gmail App Password | Crítico |
| EMAIL_FROM_NAME | Kuroshi.tv | Interno |

## 4.3 Variables del Frontend (Next.js)

> Solo las variables con prefijo `NEXT_PUBLIC_` son visibles en el navegador. El resto existe únicamente durante SSR en el servidor de Next.js.

| Variable | Dev / Prod | Nivel |
|---|---|---|
| NEXT_PUBLIC_API_URL | localhost:4000/api / kuroshi.tv/api | Público |
| NEXT_PUBLIC_SITE_URL | localhost:3000 / https://kuroshi.tv | Público |
| NEXT_PUBLIC_SUPABASE_URL | localhost:8000 / kuroshi.tv/supabase | Público |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | JWT firmado con SUPABASE_JWT_SECRET, rol anon | Público |
| NEXT_PUBLIC_GA_ID | G-XXXXXXXXXX (opcional Fase 1) | Público |
| NEXTAUTH_URL | localhost:3000 / https://kuroshi.tv | Privado |
| NEXTAUTH_SECRET | `openssl rand -base64 32` | Crítico |
| INTERNAL_API_URL | localhost:4000/api / http://backend:4000/api | Interno |

> `INTERNAL_API_URL` en producción usa el nombre del servicio Docker `backend` en lugar del dominio. Los Server Components de Next.js van por la red interna Docker (~1ms). Las llamadas del navegador van por Nginx a través de internet (`NEXT_PUBLIC_API_URL`).

## 4.4 Cómo Obtener Cada Clave

| Clave | Fuente | Pasos clave |
|---|---|---|
| Google OAuth | console.cloud.google.com | Crear proyecto → APIs y Servicios → Credenciales → OAuth 2.0 → Aplicación web → agregar redirect URI exacta |
| Discord OAuth | discord.com/developers/applications | New Application → OAuth2 → copiar Client ID y Secret → agregar redirect → scopes: identify, email |
| Imgur Client ID | api.imgur.com/oauth2/addclient | Iniciar sesión → Authorization type: OAuth 2 without callback → copiar Client ID (no necesitas el secret) |
| MAL Client ID | myanimelist.net/apiconfig | Create ID → App type: web → redirect: https://kuroshi.tv → copiar Client ID |
| Gmail SMTP | myaccount.google.com/security | Activar verificación 2 pasos → Contraseñas de aplicación → Correo → generar → copiar los 16 dígitos |
| Supabase Keys | CLI de Supabase o manual | Generar SUPABASE_JWT_SECRET con openssl → firmar ANON_KEY (rol anon) y SERVICE_KEY (rol service_role) con ese mismo secret |
| JWT_SECRET, DB_PASSWORD, NEXTAUTH_SECRET | Terminal local | `openssl rand -base64 64` para JWT. `openssl rand -base64 32` para los demás |

---

# 5. Orden de Desarrollo

El orden está determinado por dependencias técnicas. No es posible iniciar un paso sin que el anterior esté funcionando y verificado.

## 5.1 Secuencia de Implementación

| Paso | Entregable | Depende de | Descripción |
|---|---|---|---|
| 1 | docker-compose.yml + Nginx | — | Levantar todos los servicios en el VPS: Next.js, NestJS, PostgreSQL, Supabase, Nginx. Sin esto nada funciona. |
| 2 | Schema de Prisma + migraciones | Docker levantado | Traducir el modelo de datos a `schema.prisma` y correr migraciones para crear las tablas reales en PostgreSQL. |
| 3 | NestJS — Módulo Auth | Prisma + BD funcionando | JWT, Google OAuth, Discord OAuth, registro y login. Base de todo lo que requiere sesión. |
| 4 | NestJS — Módulos core | Auth funcionando | Módulos de Anime, Usuarios, Comunidades con sus endpoints REST definidos en los contratos. |
| 5 | NestJS — Realtime | Módulos core | Integrar Supabase Realtime en NestJS para emitir eventos a los canales desde los módulos core. |
| 6 | NestJS — Panel Admin | Módulos core | Gestión de anime, episodios, usuarios, reportes y configuración global. |
| 7 | Next.js — Base | API funcionando | Estructura de carpetas, layout principal, header, footer, sistema de autenticación con NextAuth. |
| 8 | Next.js — Páginas públicas | Next.js base | Home, catálogo de anime, página individual de anime con lista de episodios. |
| 9 | Next.js — Reproductor | WebSockets listos | Reproductor con embeds, selección de servidores, chat anclado al minuto, contador de presencia. |
| 10 | Next.js — Social | Páginas públicas | Perfil de usuario, lista personal, comunidades, notificaciones en tiempo real. |

## 5.2 Stack Completo y Costos

| Componente | Tecnología | Puerto Docker | Costo mensual |
|---|---|---|---|
| Frontend | Next.js + Tailwind CSS | 3000 | $0 adicional |
| Backend API | NestJS | 4000 | $0 adicional |
| Base de datos | PostgreSQL vía Supabase self-hosted | 5432 | $0 adicional |
| Realtime + Panel BD | Supabase self-hosted | 8000 | $0 adicional |
| ORM | Prisma | — | $0 |
| Autenticación | NextAuth.js | — | $0 |
| Imágenes de usuarios | Imgur API (tier gratuito) | — | $0 |
| Video | Embeds de terceros (Streamtape, Filemoon, YourUpload) | — | $0 |
| CDN + SSL + DDoS | Cloudflare (tier gratuito permanente) | — | $0 |
| Intermediario web | Nginx | 80 / 443 | $0 adicional |
| Dominio | kuroshi.tv (Porkbun o Namecheap) | — | ~$2.50 |
| VPS | Hetzner CX22 (2 vCPU, 4GB RAM, 40GB SSD) | — | $4.90 |
| **TOTAL** | | | **$7.40 USD/mes** |

## 5.3 Notas Finales

> Todo el proyecto corre en el VPS de Hetzner. Tu PC no necesita estar encendida para que el sitio funcione. Solo la necesitas encendida mientras desarrollas.

> Flujo de trabajo recomendado: desarrollar en local con Docker Compose, commit a GitHub, en el VPS hacer `git pull + docker compose up`. No se requiere CI/CD en Fase 1.

> Al generar `SUPABASE_JWT_SECRET`, ese mismo valor debe usarse para firmar el `ANON_KEY` y el `SERVICE_KEY`. Los tres deben ser coherentes o Supabase rechazará todos los tokens.

> El dominio `.tv` tiene renovación anual más cara que `.com`. Verificar el precio de renovación en Porkbun antes de comprarlo para evitar sorpresas en el año 2.

---

*Kuroshi.tv — Arquitectura Técnica v1.0 — Junio 2026*
*Confidencial — Uso Interno*
