import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadImageDto {
  @ApiProperty({ description: 'Imagen en base64 sin el prefijo data:image/...' })
  @IsString()
  image: string;

  @ApiProperty({
    enum: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    example: 'image/jpeg',
  })
  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
  mimeType: string;
}