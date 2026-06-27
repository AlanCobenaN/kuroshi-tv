import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WallpapersService } from './wallpapers.service';
import { CreateWallpaperDto } from './dto/wallpaper.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin Wallpapers')
@Controller('admin/wallpapers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WallpapersAdminController {
  constructor(private readonly wallpapersService: WallpapersService) {}

  @Get()
  @Roles('owner', 'moderador')
  @ApiOperation({ summary: 'Listar todos los wallpapers (admin)' })
  findAll() {
    return this.wallpapersService.getAll();
  }

  @Post()
  @Roles('owner')
  @ApiOperation({ summary: 'Subir un nuevo wallpaper (solo owner)' })
  create(@Body() dto: CreateWallpaperDto) {
    return this.wallpapersService.create(dto);
  }

  @Delete(':id')
  @Roles('owner')
  @ApiOperation({ summary: 'Eliminar un wallpaper (solo owner)' })
  remove(@Param('id') id: string) {
    return this.wallpapersService.remove(id);
  }
}
