import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GenresService } from './genres.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Genres')
@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar todos los géneros disponibles' })
  findAll() {
    return this.genresService.findAll();
  }
}
