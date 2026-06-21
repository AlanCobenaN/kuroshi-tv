-- Add followers_count and following_count to users
ALTER TABLE "users" ADD COLUMN "followers_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "following_count" INTEGER NOT NULL DEFAULT 0;

-- Create follows table
CREATE TABLE "follows" (
    "id" UUID NOT NULL,
    "follower_id" UUID NOT NULL,
    "following_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Add unique constraint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_following_id_key" UNIQUE ("follower_id", "following_id");
