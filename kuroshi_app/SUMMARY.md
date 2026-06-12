## Goal
Build a complete community management system with roles (miembro/moderador/owner), private communities, join requests, bans, silencing, kick, feed moderation, and a Discord-style 3-column layout.

## Constraints & Preferences
- Left sidebar: load 10 communities at a time with "Ver más" button (pagination)
- Center default: global feed; when community selected: community info + feed + comments + chat + moderator/owner tabs
- Right sidebar default: user's communities; when inside community: member list with online/offline indicators
- Floating + button (bottom-right): opens centered modal to create posts with rich text
- Chat: own messages right, others left; same-user messages within 1 minute stack; reply support
- Backend: NestJS + Prisma + PostgreSQL; frontend: Next.js 15 App Router + Supabase Realtime
- Auth via NextAuth.js + NestJS JWT
- Private communities: users request join, moderators/owner approve or reject
- Owner can transfer ownership, change name (30-day cooldown), ban members, promote/demote moderators, delete community
- Moderator can silence members (timed) or kick them, hide posts; cannot silence/kick other moderators
- Moderator and owner can delete chat messages; deleted messages remain visible to staff but hidden from regular members
- Feed: mod hides posts (soft delete), owner can hard delete
- 30-day cooldown on community name changes
- Owner cannot leave community; members cannot see Moderator/Owner tabs; mods cannot see Owner tab
- Max 2 communities per user (owner)
- Users can delete their own chat messages
- Users can edit their own posts
- Rich text: **bold**, *italic*, ***bold+italic***, ~~strikethrough~~, __underline__, &lt;small&gt;/&lt;large&gt;/&lt;xlarge&gt; per-word sizing

## Progress
### Done
- **Prisma schema:** added `CommunityBan` model, `CommunityJoinRequest` model + `JoinRequestStatus` enum, `isPrivate` field on Community, `isSilenced`/`silencedUntil` on CommunityMember, relations to User
- **19 backend endpoints:**
  - `PATCH /communities/:slug` — owner updates settings (name, description, banner, avatar, isPrivate) with 30-day name change cooldown
  - `DELETE /communities/:slug` — owner deletes community
  - `POST /communities/:slug/transfer` — owner transfers ownership
  - `POST /communities/:slug/kick` — moderator+ kicks member
  - `POST /communities/:slug/silence` — moderator+ silences member (duration in minutes)
  - `POST /communities/:slug/ban` — owner bans member (temporal/permanent)
  - `POST /communities/:slug/unban` — owner unbans
  - `POST /communities/:slug/moderator` — owner promotes to moderator
  - `POST /communities/:slug/demote` — owner demotes moderator
  - `POST /communities/:slug/request-join` — request join private community
  - `GET /communities/:slug/join-requests` — moderator+ sees pending requests
  - `POST /communities/:slug/join-requests/approve` — moderator+ approves request
  - `POST /communities/:slug/join-requests/reject` — moderator+ rejects request
  - `PATCH /communities/:slug/posts/:id/hide` — moderator+ hides post (soft delete)
  - `DELETE /communities/:slug/posts/:id` — owner hard deletes post
  - `PATCH /communities/:slug/posts/:id` — author edits post content
- **Backend DTOs:** `UpdateCommunityDto`, `KickMemberDto`, `SilenceMemberDto`, `BanMemberDto`, `UnbanMemberDto`, `PromoteModeratorDto`, `TransferOwnershipDto`, `ApproveJoinRequestDto`, `RejectJoinRequestDto`
- **Frontend API methods** for all management endpoints in `api.ts`
- **ModeratorPanel.tsx** — member list with silence (select 1h–7d) and kick buttons
- **OwnerPanel.tsx** — four sub-tabs: Settings (name, description, banner, avatar, isPrivate, transfer, delete), Moderators (promote/demote), Bans (ban with reason + duration selector, unban), Join Requests (accept/reject with avatar)
- **CenterPanel.tsx** — tabs Feed/Chat/Moderador/Owner, role-based visibility (`userRole` derived from `user_membership`)
- **CommunityHub.tsx** — `refreshCommunity` callback for owner settings updates
- **Chat service:** `sendCommunityMessage` now includes `replyTo` relation with `id`, `content`, `user` (username, avatar_url) in the Prisma select
- **Realtime service:** `emitNewCommunityMessage` now includes full `reply_to` object in WS payload; `emitCommunityMessageDeleted` now includes `is_deleted: true`
- **Chat history (`getChatHistory`):** includes `replyTo` relation, includes `isDeleted` flag; staff see deleted messages, regular users do not
- **useCommunityChat hook:** accepts `userRole`, filters deleted messages for non-staff, marks deleted messages for staff
- **Chat UI (`CommunityChatPanel.tsx`):** shows reply previews, reply indicators in sent messages, delete button for both own messages and staff, scroll only when near bottom, staff sees deleted messages with badge
- **PostCard:** `onHide`/`onDelete`/`onEdit` callbacks, moderation buttons for mod+/owner/author, "Oculto" badge for hidden posts
- **PostCard images:** changed from `<Image>` to `<img>` with `max-width: 100%; max-height: 400px; object-fit: contain` to prevent stretching/cropping
- **RichText parser:** supports `***bold+italic***`, `~~strikethrough~~`, `__underline__`, per-word `<small>`/`<large>`/`<xlarge>` sizing. Bold+italic no longer shows asterisks.
- **CreatePostModal:** per-word size wrapping (instead of global), added strikethrough (`~~`), underline (`__`), and bold+italic (`***`) buttons; removed global `buildRichContent`/`getTextareaStyle` in favor of raw markdown insertion
- **GlobalFeed:** "Crear comunidad" button opens a simple modal with name + description fields; calls `communitiesApi.create`
- **Community creation limit:** backend rejects with `ForbiddenException` if user already owns 2+ active communities
- **Edit post:** `PATCH /communities/:slug/posts/:id` endpoint (author only), `onEdit` callback on PostCard, simple inline edit modal in CenterPanel
- **Bugfixes:**
  - WebSocket payload sends `avatar_url` (snake_case) instead of `avatarUrl` (camelCase)
  - `chat.service.ts` updates `lastActiveAt` on message send
  - Prisma client regenerated inside Docker container after schema change
- **Other:** ping/heartbeat endpoint for online presence, PostComments reply banner, bigger CreatePostModal, online status works

### Blocked
- None (pre-existing Prisma type errors require `docker-compose restart backend` after `prisma generate`)

## Key Decisions
- "My communities" derived from `user_membership` field in `getAll` response instead of separate API call
- Used `OptionalJwtGuard` on public routes that need optional user context
- Presence derived from `lastActiveAt` (< 5 min = online) via heartbeat every 2 minutes
- Community bans use separate `CommunityBan` model; when banned, member record is deleted
- Chat deleted messages remain in DB; staff see them, regular users filter at query level
- PostCard moderation/editing controlled by callbacks, keeping component simple
- Per-word size tags (`<small>`/`<large>`/`<xlarge>`) inline in content rather than global text style
- Edit post uses a simple modal overlay reusing styles from CreatePostModal

## Relevant Files
- `backend/prisma/schema.prisma` — schema with CommunityBan, CommunityJoinRequest, isPrivate, isSilenced/silencedUntil
- `backend/src/modules/communities/communities.service.ts` — 19 management methods + getChatHistory + hidePost/deletePost/updatePost/createCommunity (with limit)
- `backend/src/modules/communities/communities.controller.ts` — 19 endpoints
- `backend/src/modules/communities/dto/communities.dto.ts` — 11 DTOs
- `backend/src/modules/realtime/realtime.service.ts` — WS payload with reply_to + is_deleted
- `backend/src/modules/chat/chat.service.ts` — sendMessage with replyTo, deleteMessage with author/role check
- `frontend/lib/api.ts` — all API methods including updatePost, create, hidePost, deletePost
- `frontend/types/index.ts` — JoinRequest, CommunityBanInfo, is_deleted on Post/CommunityMessage, WsNewMessage reply_to
- `frontend/components/community/RichText.tsx` — parser with bold+italic, strikethrough, underline, per-word sizes
- `frontend/app/comunidades/CreatePostModal.tsx` — toolbar with bold/italic/bold+italic/strikethrough/underline/size/image/GIF, per-word wrapping
- `frontend/components/community/PostCard.tsx` — edit/hide/delete buttons, responsive image display
- `frontend/components/community/ModeratorPanel.tsx` — member list with silence/kick
- `frontend/components/community/OwnerPanel.tsx` — 4 sub-tabs (Settings, Moderators, Bans, Join Requests)
- `frontend/components/community/GlobalFeed.tsx` — create community button + modal
- `frontend/app/comunidades/CenterPanel.tsx` — role-based tabs, edit post modal, CommunityFeedPanel passes userId/userRole
- `frontend/app/comunidades/CommunityHub.tsx` — refreshCommunity callback
- `frontend/app/comunidades/[slug]/CommunityChatPanel.tsx` — self-delete, reply indicators, scroll behavior
- `frontend/hooks/useCommunityChat.ts` — userRole prop, role-based deleted message filtering
