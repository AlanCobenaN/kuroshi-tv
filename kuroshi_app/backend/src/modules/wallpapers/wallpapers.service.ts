import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateWallpaperDto } from './dto/wallpaper.dto';

@Injectable()
export class WallpapersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  async getAllActive() {
    return this.prisma.wallpaper.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true, url: true },
    });
  }

  async getAll() {
    return this.prisma.wallpaper.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, url: true, isActive: true, createdAt: true },
    });
  }

  async create(dto: CreateWallpaperDto) {
    const { url, publicId } = await this.uploadsService.uploadToCloudinary(
      dto.image,
      dto.mimeType,
      7,
    );

    return this.prisma.wallpaper.create({
      data: { url, publicId },
      select: { id: true, url: true, isActive: true, createdAt: true },
    });
  }

  async remove(id: string) {
    const wallpaper = await this.prisma.wallpaper.findUnique({ where: { id } });
    if (!wallpaper) throw new NotFoundException('Wallpaper no encontrado');

    await this.prisma.wallpaper.delete({ where: { id } });
    return { message: 'Wallpaper eliminado' };
  }
}
