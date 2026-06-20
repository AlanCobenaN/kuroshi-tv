import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchDto } from './dto/search.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // GET /api/search?q=termino
  @Public()
  @Get()
  @ApiOperation({ summary: 'Búsqueda global: anime, comunidades y usuarios. Mínimo 2 caracteres' })
  search(@Query() dto: SearchDto) {
    return this.searchService.search(dto);
  }

  // GET /api/search/tenor?q=keyword
  @Public()
  @Get('tenor')
  @ApiOperation({ summary: 'Buscar GIFs en Tenor. Requiere TENOR_API_KEY en .env' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'limit', required: false })
  searchTenor(@Query('q') q: string, @Query('limit') limit?: string) {
    return this.searchService.searchTenor(q, limit ? parseInt(limit, 10) : 12);
  }
}