import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsEnum,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ── Anime ─────────────────────────────────────────────────────
export class ImportAnimeDto {
  @ApiProperty({ description: 'ID de MyAnimeList o AniList' })
  @IsInt()
  malId: number;

  @ApiPropertyOptional({ enum: ['mal', 'anilist'] })
  @IsOptional()
  @IsString()
  source?: 'mal' | 'anilist' = 'mal';
}

export class CreateAnimeDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  titleEs: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleJp?: string;

  @ApiPropertyOptional({ description: 'Nombres alternativos/sinónimos (JSON array)' })
  @IsOptional()
  aliases?: string[];

  @ApiPropertyOptional({ description: 'URLs externas (MAL, Wikipedia, etc.) — JSON array' })
  @IsOptional()
  sameAs?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  synopsis?: string;

  @ApiPropertyOptional({ enum: ['en_emision', 'finalizado', 'proximamente'] })
  @IsOptional()
  @IsEnum(['en_emision', 'finalizado', 'proximamente'])
  status?: string = 'proximamente';

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  season?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  totalEpisodes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  malRating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  malId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean = true;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  genres?: string[];
}

export class UpdateAnimeDto extends CreateAnimeDto {}

// ── Episodios ─────────────────────────────────────────────────
export class CreateEpisodeDto {
  @ApiProperty()
  @IsString()
  animeSlug: string;

  @ApiProperty()
  @IsInt()
  seasonNumber: number;

  @ApiPropertyOptional({ description: 'Título personalizado para la temporada (solo si se crea una nueva)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  seasonTitle?: string;

  @ApiPropertyOptional({ enum: ['regular', 'ova', 'especial'] })
  @IsOptional()
  @IsEnum(['regular', 'ova', 'especial'])
  seasonType?: string = 'regular';

  @ApiProperty()
  @IsInt()
  number: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  synopsis?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  airDate?: string;

  // Configuración de anuncios
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  adPrerollEnabled?: boolean = true;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  adPrerollMinute?: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  adPrerollMaxSec?: number = 15;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  adEndingEnabled?: boolean = true;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  adEndingMinute?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  adEndingMaxSec?: number = 30;
}

export class AddVideoServerDto {
  @ApiProperty()
  @IsString()
  serverName: string;

  @ApiProperty()
  @IsString()
  embedUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number = 0;
}

// ── Usuarios ──────────────────────────────────────────────────
export class GetUsersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['todos', 'activos', 'silenciados', 'baneados', 'moderadores'] })
  @IsOptional()
  @IsString()
  filter?: string = 'todos';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 20;
}

export class WarnUserDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  reason: string;
}

export class SilenceUserDto {
  @ApiProperty({ description: 'Días de silencio' })
  @IsInt()
  @Min(1)
  @Max(365)
  days: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BanUserDto {
  @ApiPropertyOptional({ description: 'Días de baneo. Null = permanente' })
  @IsOptional()
  @IsInt()
  @Min(1)
  days?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ChangeRoleDto {
  @ApiProperty({ enum: ['usuario', 'moderador'] })
  @IsEnum(['usuario', 'moderador'])
  role: string;
}

// ── Comunidades ───────────────────────────────────────────────
export class PromoteCommunityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RejectPromotionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  reason: string;
}

// ── Reportes ──────────────────────────────────────────────────
export class ReviewReportDto {
  @ApiProperty({ enum: ['revisado', 'desestimado'] })
  @IsEnum(['revisado', 'desestimado'])
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewNote?: string;
}

// ── Config global ─────────────────────────────────────────────
export class UpdateGlobalSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  siteName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  siteDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowRegistration?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requireEmailVerification?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  maintenanceMessage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  adPrerollGlobalEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  adFeedFrequency?: number;
}

export class GetStatsDto {
  @ApiPropertyOptional({ enum: ['hoy', 'semana', 'mes', 'ano'] })
  @IsOptional()
  @IsEnum(['hoy', 'semana', 'mes', 'ano'])
  period?: string = 'mes';
}

// ── Géneros ───────────────────────────────────────────────────
export class CreateGenreDto {
  @ApiProperty({ description: 'Nombre del género (ej: "Acción")' })
  @IsString()
  @MaxLength(50)
  name: string;
}

export class UpdateGenreDto {
  @ApiProperty({ description: 'Nuevo nombre del género' })
  @IsString()
  @MaxLength(50)
  name: string;
}