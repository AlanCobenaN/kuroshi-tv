import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WallpapersService } from './wallpapers.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Wallpapers')
@Controller('wallpapers')
export class WallpapersController {
  constructor(private readonly wallpapersService: WallpapersService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Obtener todos los wallpapers activos (público)' })
  findAll() {
    return this.wallpapersService.getAllActive();
  }
}
