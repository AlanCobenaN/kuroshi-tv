import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWallpaperDto {
  @ApiProperty({ description: 'Imagen en base64' })
  @IsString()
  image: string;

  @ApiProperty({ description: 'MIME type de la imagen (image/jpeg, image/png, image/webp)' })
  @IsString()
  mimeType: string;
}

export class UpdateWallpaperDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
