import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { UploadImageDto } from './dto/upload.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  // POST /api/uploads/image
  @Post('image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sube imagen a Cloudinary. El cliente nunca llama a Cloudinary directamente.',
  })
  uploadImage(@Body() dto: UploadImageDto) {
    return this.uploadsService.uploadToCloudinary(dto.image, dto.mimeType);
  }
}