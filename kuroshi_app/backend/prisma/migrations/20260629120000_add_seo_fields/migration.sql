-- Agregar campos SEO a la tabla animes
ALTER TABLE "animes" ADD COLUMN "title_en" VARCHAR(200);
ALTER TABLE "animes" ADD COLUMN "aliases" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "animes" ADD COLUMN "same_as" JSONB DEFAULT '[]'::jsonb;
