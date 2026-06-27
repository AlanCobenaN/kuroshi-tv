-- CreateTable
CREATE TABLE "wallpapers" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "public_id" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallpapers_pkey" PRIMARY KEY ("id")
);
