import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  favoriteAnimeId?: string | null;

  @ApiPropertyOptional({ enum: ['publico', 'solo_amigos', 'privado'] })
  @IsOptional()
  @IsEnum(['publico', 'solo_amigos', 'privado'])
  visibility?: string;

  @ApiPropertyOptional({ enum: ['publico', 'solo_amigos', 'privado'] })
  @IsOptional()
  @IsEnum(['publico', 'solo_amigos', 'privado'])
  watchlistVisibility?: string;
}

export class UpdateUsernameDto {
  @ApiProperty()
  @IsString()
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'El username solo puede contener letras, números y guión bajo.' })
  username: string;
}

export class AddToWatchlistDto {
  @ApiProperty()
  @IsString()
  animeId: string;

  @ApiPropertyOptional({ enum: ['viendo', 'completado', 'pendiente', 'abandonado'] })
  @IsOptional()
  @IsEnum(['viendo', 'completado', 'pendiente', 'abandonado'])
  status?: string = 'pendiente';
}

export class UpdateWatchlistDto {
  @ApiProperty({ enum: ['viendo', 'completado', 'pendiente', 'abandonado'] })
  @IsEnum(['viendo', 'completado', 'pendiente', 'abandonado'])
  status: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  personalRating?: number;
}

export class CreateUserPostDto {
  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class SaveProgressDto {
  @ApiProperty()
  @IsString()
  episodeId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lastMinute: number;

  @ApiPropertyOptional()
  @IsOptional()
  completed?: boolean = false;
}

export class FriendRequestActionDto {
  @ApiProperty({ enum: ['aceptada', 'rechazada'] })
  @IsEnum(['aceptada', 'rechazada'])
  action: 'aceptada' | 'rechazada';
}

export class FollowDto {
  @ApiProperty()
  @IsString()
  targetUsername: string;
}

export class GetNotificationsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

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