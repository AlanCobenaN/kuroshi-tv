-- Add video_second column
ALTER TABLE "episode_comments" ADD COLUMN "video_second" INTEGER NOT NULL DEFAULT 0;

-- Drop unique constraint (user can comment at different seconds within same minute)
DROP INDEX IF EXISTS "episode_comments_episode_id_user_id_video_minute_key";

-- Drop old index, add new one that includes video_second
DROP INDEX IF EXISTS "episode_comments_episode_id_video_minute_idx";
CREATE INDEX "episode_comments_episode_id_video_minute_video_second_idx" ON "episode_comments"("episode_id", "video_minute", "video_second");
