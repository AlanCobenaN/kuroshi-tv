import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum AnimeOrder {
  POPULAR = 'popular',
  WEEKLY = 'weekly',
  RATING = 'rating',
  RECENT = 'recent',
  ALPHABETICAL = 'alphabetical',
}

export class GetAnimesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  season?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studio?: string;

  @ApiPropertyOptional({ enum: AnimeOrder })
  @IsOptional()
  @IsEnum(AnimeOrder)
  order?: AnimeOrder = AnimeOrder.POPULAR;

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
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

export class GetEpisodesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  season?: number;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc' = 'asc';
}

export class GetEpisodeCommentsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minute?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

export class CreateEpisodeCommentDto {
  @IsString()
  content: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  videoMinute: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(59)
  videoSecond: number = 0;

  @IsOptional()
  @IsBoolean()
  hasSpoiler?: boolean = false;
}

export class RateAnimeDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  stars: number;
}