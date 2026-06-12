import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
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
}