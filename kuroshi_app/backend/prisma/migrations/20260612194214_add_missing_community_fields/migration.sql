-- Add missing columns to communities
ALTER TABLE "communities" ADD COLUMN "is_private" BOOLEAN NOT NULL DEFAULT false;

-- Add missing columns to community_members
ALTER TABLE "community_members" ADD COLUMN "is_silenced" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "community_members" ADD COLUMN "silenced_until" TIMESTAMP(3);

-- Add missing column to notifications
ALTER TABLE "notifications" ADD COLUMN "stacked_count" INTEGER NOT NULL DEFAULT 1;

-- CreateEnum (if not exists already)
DO $$ BEGIN
  CREATE TYPE "JoinRequestStatus" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable community_bans
CREATE TABLE "community_bans" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reason" VARCHAR(300),
    "banned_by" UUID NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_bans_pkey" PRIMARY KEY ("id")
);

-- CreateTable community_join_requests
CREATE TABLE "community_join_requests" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" UUID,

    CONSTRAINT "community_join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "community_bans_community_id_user_id_key" ON "community_bans"("community_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_join_requests_community_id_user_id_key" ON "community_join_requests"("community_id", "user_id");

-- AddForeignKey
ALTER TABLE "community_bans" ADD CONSTRAINT "community_bans_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_bans" ADD CONSTRAINT "community_bans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_bans" ADD CONSTRAINT "community_bans_banned_by_fkey" FOREIGN KEY ("banned_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_join_requests" ADD CONSTRAINT "community_join_requests_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_join_requests" ADD CONSTRAINT "community_join_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_join_requests" ADD CONSTRAINT "community_join_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
