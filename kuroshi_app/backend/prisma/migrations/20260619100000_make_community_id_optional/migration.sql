-- AlterTable: make community_id nullable to allow profile posts (without community)
ALTER TABLE "posts" ALTER COLUMN "community_id" DROP NOT NULL;
