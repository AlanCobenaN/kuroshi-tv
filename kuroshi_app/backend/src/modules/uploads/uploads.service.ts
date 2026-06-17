import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class UploadsService {
  constructor(private readonly config: ConfigService) {}

  async uploadToCloudinary(
    base64Image: string,
    mimeType: string,
  ): Promise<{ url: string; publicId: string }> {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Cloudinary no está configurado. Agrega CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET al .env',
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(mimeType)) {
      throw new BadRequestException(
        'Tipo de archivo no permitido. Solo JPG, PNG, GIF y WEBP',
      );
    }

    // Validar tamaño aproximado (base64 es ~33% más grande que el original)
    const approximateSizeBytes = (base64Image.length * 3) / 4;
    const maxSizeBytes = 3 * 1024 * 1024; // 3MB
    if (approximateSizeBytes > maxSizeBytes) {
      throw new BadRequestException('La imagen no puede superar 3MB');
    }

    try {
      // Cloudinary requiere firma para uploads autenticados
      const timestamp = Math.round(Date.now() / 1000);
      const folder = 'kuroshi';

      const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto
        .createHash('sha256')
        .update(signatureString)
        .digest('hex');

      // Preparar el data URI completo
      const dataUri = `data:${mimeType};base64,${base64Image}`;

      const formData = new URLSearchParams();
      formData.append('file', dataUri);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 20000,
        },
      );

      return {
        url: response.data.secure_url,
        publicId: response.data.public_id,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new BadRequestException(
          `Error de Cloudinary: ${error.response.data?.error?.message ?? 'Error desconocido'}`,
        );
      }
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      throw new InternalServerErrorException(
        `No se pudo conectar con Cloudinary: ${msg}`,
      );
    }
  }
}