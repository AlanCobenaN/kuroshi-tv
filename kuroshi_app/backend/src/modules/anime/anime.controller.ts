import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnimeService } from './anime.service';
import {
  GetAnimesDto,
  GetEpisodesDto,
  GetEpisodeCommentsDto,
  CreateEpisodeCommentDto,
  RateAnimeDto,
} from './dto/anime.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Anime')
@Controller('anime')
export class AnimeController {
  constructor(private readonly animeService: AnimeService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Catálogo con filtros' })
  getAnimes(@Query() dto: GetAnimesDto, @CurrentUser('id') userId?: string) {
    return this.animeService.getAnimes(dto, userId);
  }

  @Public()
  @Get('trending')
  @ApiOperation({ summary: 'Top 10 más vistos esta semana' })
  getTrending() {
    return this.animeService.getTrending();
  }

  @Public()
  @Get('airing')
  @ApiOperation({ summary: 'Animes en emisión con último episodio' })
  getAiring() {
    return this.animeService.getAiring();
  }

  @Public()
  @Get('latest-episodes')
  @ApiOperation({ summary: 'Últimos episodios agregados (ordenados por fecha real de emisión)' })
  getLatestEpisodes() {
    return this.animeService.getLatestEpisodes();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Detalle completo del anime' })
  getAnime(@Param('slug') slug: string, @CurrentUser('id') userId?: string) {
    return this.animeService.getAnimeBySlug(slug, userId);
  }

  @Public()
  @Get(':slug/episodes')
  @ApiOperation({ summary: 'Lista de episodios por temporada' })
  getEpisodes(@Param('slug') slug: string, @Query() dto: GetEpisodesDto) {
    return this.animeService.getEpisodes(slug, dto);
  }

  @Public()
  @Get(':slug/episode/:number')
  @ApiOperation({ summary: 'Detalle del episodio con servidores y config de anuncios' })
  getEpisode(
    @Param('slug') slug: string,
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.animeService.getEpisode(slug, number);
  }

  @Public()
  @Get(':slug/episode/:number/comments')
  @ApiOperation({ summary: 'Chat del episodio filtrable por minuto' })
  getEpisodeComments(
    @Param('slug') slug: string,
    @Param('number', ParseIntPipe) number: number,
    @Query() dto: GetEpisodeCommentsDto,
  ) {
    return this.animeService.getEpisodeComments(slug, number, dto);
  }

  @Post(':slug/episode/:number/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publicar comentario anclado al minuto' })
  createComment(
    @Param('slug') slug: string,
    @Param('number', ParseIntPipe) number: number,
    @Body() dto: CreateEpisodeCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.animeService.createEpisodeComment(slug, number, userId, dto);
  }

  @Post(':slug/episode/:number/comments/:id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dar like a un comentario' })
  likeComment(
    @Param('id') commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.animeService.likeEpisodeComment(commentId, userId);
  }

  @Post(':slug/rate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Votar rating 1-5 estrellas' })
  rateAnime(
    @Param('slug') slug: string,
    @Body() dto: RateAnimeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.animeService.rateAnime(slug, userId, dto);
  }
}