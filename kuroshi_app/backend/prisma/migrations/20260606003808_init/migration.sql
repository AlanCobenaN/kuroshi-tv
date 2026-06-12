-- CreateEnum
CREATE TYPE "Role" AS ENUM ('owner', 'moderador', 'usuario');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('publico', 'solo_amigos', 'privado');

-- CreateEnum
CREATE TYPE "WatchlistStatus" AS ENUM ('viendo', 'completado', 'pendiente', 'abandonado');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('pendiente', 'aceptada', 'rechazada', 'bloqueada');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('nuevo_ep', 'like_post', 'like_comment', 'amistad_recibida', 'amistad_aceptada', 'logro_desbloqueado', 'comunidad_promovida', 'retoma_anime');

-- CreateEnum
CREATE TYPE "AnimeStatus" AS ENUM ('en_emision', 'finalizado', 'proximamente');

-- CreateEnum
CREATE TYPE "SeasonType" AS ENUM ('regular', 'ova', 'especial');

-- CreateEnum
CREATE TYPE "CommunityType" AS ENUM ('oficial', 'no_oficial');

-- CreateEnum
CREATE TYPE "CommunityMemberRole" AS ENUM ('creador', 'moderador', 'miembro');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pendiente', 'revisado', 'desestimado');

-- CreateEnum
CREATE TYPE "ReportContentType" AS ENUM ('post', 'comment', 'episode_comment', 'usuario');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(30) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'usuario',
    "visibility" "ProfileVisibility" NOT NULL DEFAULT 'publico',
    "bio" VARCHAR(150),
    "avatar_url" TEXT,
    "oauth_google_id" TEXT,
    "oauth_discord_id" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_silenced" BOOLEAN NOT NULL DEFAULT false,
    "silenced_until" TIMESTAMP(3),
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "banned_until" TIMESTAMP(3),
    "username_changed_at" TIMESTAMP(3),
    "last_active_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "favorite_anime_id" UUID,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_watchlist" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "anime_id" UUID NOT NULL,
    "status" "WatchlistStatus" NOT NULL DEFAULT 'pendiente',
    "manual_override" BOOLEAN NOT NULL DEFAULT false,
    "personal_rating" INTEGER,
    "last_watched_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "episode_id" UUID NOT NULL,
    "last_minute" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "watched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friendships" (
    "id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "addressee_id" UUID NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'pendiente',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "body" VARCHAR(300) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animes" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "title_es" VARCHAR(200) NOT NULL,
    "title_jp" VARCHAR(200),
    "synopsis" TEXT,
    "status" "AnimeStatus" NOT NULL DEFAULT 'proximamente',
    "year" INTEGER,
    "season" VARCHAR(20),
    "studio" VARCHAR(100),
    "total_episodes" INTEGER,
    "cover_url" TEXT,
    "banner_url" TEXT,
    "mal_id" INTEGER,
    "mal_rating" DOUBLE PRECISION,
    "anilist_id" INTEGER,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "total_views" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "animes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anime_genres" (
    "anime_id" UUID NOT NULL,
    "genre_id" UUID NOT NULL,

    CONSTRAINT "anime_genres_pkey" PRIMARY KEY ("anime_id","genre_id")
);

-- CreateTable
CREATE TABLE "anime_seasons" (
    "id" UUID NOT NULL,
    "anime_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "title" VARCHAR(200),
    "type" "SeasonType" NOT NULL DEFAULT 'regular',

    CONSTRAINT "anime_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episodes" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "title" VARCHAR(200),
    "synopsis" TEXT,
    "thumbnail_url" TEXT,
    "air_date" TIMESTAMP(3),
    "views" BIGINT NOT NULL DEFAULT 0,
    "ad_preroll_enabled" BOOLEAN NOT NULL DEFAULT true,
    "ad_preroll_minute" INTEGER NOT NULL DEFAULT 0,
    "ad_preroll_max_sec" INTEGER NOT NULL DEFAULT 15,
    "ad_ending_enabled" BOOLEAN NOT NULL DEFAULT true,
    "ad_ending_minute" INTEGER,
    "ad_ending_max_sec" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_servers" (
    "id" UUID NOT NULL,
    "episode_id" UUID NOT NULL,
    "server_name" VARCHAR(50) NOT NULL,
    "embed_url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "video_servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episode_comments" (
    "id" UUID NOT NULL,
    "episode_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" VARCHAR(200) NOT NULL,
    "video_minute" INTEGER NOT NULL,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "has_spoiler" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "episode_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anime_ratings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "anime_id" UUID NOT NULL,
    "stars" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anime_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communities" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "rules" TEXT,
    "banner_url" TEXT,
    "avatar_url" TEXT,
    "type" "CommunityType" NOT NULL DEFAULT 'no_oficial',
    "members_count" INTEGER NOT NULL DEFAULT 0,
    "members_threshold" INTEGER NOT NULL DEFAULT 1000,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_members" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "CommunityMemberRole" NOT NULL DEFAULT 'miembro',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "linked_episode_id" UUID,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_comments" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "parent_id" UUID,
    "content" TEXT NOT NULL,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "has_spoiler" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_chat" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" VARCHAR(500) NOT NULL,
    "reply_to_id" UUID,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(300) NOT NULL,
    "xp_reward" INTEGER NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "achievement_id" UUID NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranks" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "anime_reference" VARCHAR(100) NOT NULL,
    "xp_required" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "ranks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "content_type" "ReportContentType" NOT NULL,
    "content_id" UUID NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'pendiente',
    "reviewed_by" UUID,
    "review_note" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_oauth_google_id_key" ON "users"("oauth_google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_oauth_discord_id_key" ON "users"("oauth_discord_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_watchlist_user_id_anime_id_key" ON "user_watchlist"("user_id", "anime_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_progress_user_id_episode_id_key" ON "user_progress"("user_id", "episode_id");

-- CreateIndex
CREATE UNIQUE INDEX "friendships_requester_id_addressee_id_key" ON "friendships"("requester_id", "addressee_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "animes_slug_key" ON "animes"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "animes_mal_id_key" ON "animes"("mal_id");

-- CreateIndex
CREATE UNIQUE INDEX "animes_anilist_id_key" ON "animes"("anilist_id");

-- CreateIndex
CREATE INDEX "animes_slug_idx" ON "animes"("slug");

-- CreateIndex
CREATE INDEX "animes_status_idx" ON "animes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "genres_name_key" ON "genres"("name");

-- CreateIndex
CREATE UNIQUE INDEX "anime_seasons_anime_id_number_type_key" ON "anime_seasons"("anime_id", "number", "type");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_season_id_number_key" ON "episodes"("season_id", "number");

-- CreateIndex
CREATE INDEX "episode_comments_episode_id_video_minute_idx" ON "episode_comments"("episode_id", "video_minute");

-- CreateIndex
CREATE UNIQUE INDEX "episode_comments_episode_id_user_id_video_minute_key" ON "episode_comments"("episode_id", "user_id", "video_minute");

-- CreateIndex
CREATE UNIQUE INDEX "anime_ratings_user_id_anime_id_key" ON "anime_ratings"("user_id", "anime_id");

-- CreateIndex
CREATE UNIQUE INDEX "communities_slug_key" ON "communities"("slug");

-- CreateIndex
CREATE INDEX "communities_type_idx" ON "communities"("type");

-- CreateIndex
CREATE UNIQUE INDEX "community_members_community_id_user_id_key" ON "community_members"("community_id", "user_id");

-- CreateIndex
CREATE INDEX "posts_community_id_created_at_idx" ON "posts"("community_id", "created_at");

-- CreateIndex
CREATE INDEX "post_comments_post_id_idx" ON "post_comments"("post_id");

-- CreateIndex
CREATE INDEX "community_chat_community_id_created_at_idx" ON "community_chat"("community_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_code_key" ON "achievements"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "user_achievements"("user_id", "achievement_id");

-- CreateIndex
CREATE UNIQUE INDEX "ranks_name_key" ON "ranks"("name");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_favorite_anime_id_fkey" FOREIGN KEY ("favorite_anime_id") REFERENCES "animes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_watchlist" ADD CONSTRAINT "user_watchlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_watchlist" ADD CONSTRAINT "user_watchlist_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "animes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_addressee_id_fkey" FOREIGN KEY ("addressee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_genres" ADD CONSTRAINT "anime_genres_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "animes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_genres" ADD CONSTRAINT "anime_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_seasons" ADD CONSTRAINT "anime_seasons_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "animes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "anime_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_servers" ADD CONSTRAINT "video_servers_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_comments" ADD CONSTRAINT "episode_comments_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_comments" ADD CONSTRAINT "episode_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_ratings" ADD CONSTRAINT "anime_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_ratings" ADD CONSTRAINT "anime_ratings_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "animes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communities" ADD CONSTRAINT "communities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "post_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_chat" ADD CONSTRAINT "community_chat_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_chat" ADD CONSTRAINT "community_chat_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_chat" ADD CONSTRAINT "community_chat_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "community_chat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
