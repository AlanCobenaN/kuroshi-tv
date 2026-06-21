-- AlterTable: add shared_post_id and shared_text columns for post sharing
ALTER TABLE "posts" ADD COLUMN "shared_post_id" UUID;
ALTER TABLE "posts" ADD COLUMN "shared_text" TEXT;

-- AddForeignKey: shared_post_id references posts(id) with SET NULL on delete
ALTER TABLE "posts" ADD CONSTRAINT "posts_shared_post_id_fkey" FOREIGN KEY ("shared_post_id") REFERENCES "posts"(id) ON DELETE SET NULL ON UPDATE CASCADE;
