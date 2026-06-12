import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
  Max,
  IsEnum,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCommunityDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class GetCommunitiesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['oficial', 'no_oficial'] })
  @IsOptional()
  @IsEnum(['oficial', 'no_oficial'])
  type?: string;

  @ApiPropertyOptional({ enum: ['activas', 'miembros', 'recientes'] })
  @IsOptional()
  @IsEnum(['activas', 'miembros', 'recientes'])
  order?: string = 'activas';

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

export class CreatePostDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkedEpisodeId?: string;
}

export class CreatePostCommentDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500, { message: 'El comentario no puede exceder los 500 caracteres' })
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  hasSpoiler?: boolean = false;
}

export class GetPostsDto {
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

export class UpdateCommunityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

export class KickMemberDto {
  @ApiProperty()
  @IsUUID()
  userId: string;
}

export class SilenceMemberDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Duration in minutes (max 43200 = 30 days)' })
  @IsInt()
  @Min(1)
  @Max(43200)
  durationMinutes: number;
}

export class BanMemberDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;

  @ApiPropertyOptional({ description: 'Duration in minutes. Omit for permanent.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(525600)
  durationMinutes?: number;
}

export class UnbanMemberDto {
  @ApiProperty()
  @IsUUID()
  userId: string;
}

export class PromoteModeratorDto {
  @ApiProperty()
  @IsUUID()
  userId: string;
}

export class TransferOwnershipDto {
  @ApiProperty()
  @IsUUID()
  userId: string;
}

export class ApproveJoinRequestDto {
  @ApiProperty()
  @IsUUID()
  requestId: string;
}

export class RejectJoinRequestDto {
  @ApiProperty()
  @IsUUID()
  requestId: string;
}