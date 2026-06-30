import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  ImportAnimeDto,
  CreateAnimeDto,
  UpdateAnimeDto,
  CreateEpisodeDto,
  AddVideoServerDto,
  GetUsersDto,
  WarnUserDto,
  SilenceUserDto,
  BanUserDto,
  ChangeRoleDto,
  PromoteCommunityDto,
  ReviewReportDto,
  UpdateGlobalSettingsDto,
  GetStatsDto,
  CreateGenreDto,
  UpdateGenreDto,
} from './dto/admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Dashboard ─────────────────────────────────────────────
  @Get('dashboard')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Métricas y actividad reciente del sitio' })
  getDashboard() {
    return this.adminService.getDashboard();
  }

  // ── Stats ─────────────────────────────────────────────────
  @Get('stats')
  @Roles('owner')
  @ApiOperation({ summary: 'Estadísticas por período: hoy, semana, mes, año' })
  getStats(@Query() dto: GetStatsDto) {
    return this.adminService.getStats(dto);
  }

  // ── Anime ─────────────────────────────────────────────────
  @Get('anime')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Lista de animes con buscador' })
  getAnimes(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAnimes(+page, +limit, search);
  }

  @Post('anime/import')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Importar datos automáticamente desde MyAnimeList' })
  importFromMAL(@Body() dto: ImportAnimeDto) {
    return this.adminService.importFromMAL(dto);
  }

  @Post('anime/import-full')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Importar anime completo desde MAL: metadatos, banner, episodios y thumbnails' })
  importFullFromMAL(@Body() dto: ImportAnimeDto) {
    return this.adminService.importFullFromMAL(dto);
  }

  @Post('anime')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Crear anime manualmente o tras importar de MAL' })
  createAnime(@Body() dto: CreateAnimeDto) {
    return this.adminService.createAnime(dto);
  }

  @Put('anime/:id')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Editar anime' })
  updateAnime(@Param('id') id: string, @Body() dto: UpdateAnimeDto) {
    return this.adminService.updateAnime(id, dto);
  }

  @Patch('anime/:id/visibility')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Ocultar o mostrar anime' })
  toggleVisibility(@Param('id') id: string) {
    return this.adminService.toggleAnimeVisibility(id);
  }

  @Delete('anime/:id')
  @Roles('owner')
  @ApiOperation({ summary: 'Eliminar anime permanentemente (solo owner)' })
  deleteAnime(@Param('id') id: string) {
    return this.adminService.deleteAnime(id);
  }

  @Post('anime/:slug/sync-episodes')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Sincronizar episodios desde MAL para un anime existente' })
  syncEpisodesFromMAL(@Param('slug') slug: string) {
    return this.adminService.syncEpisodesFromMAL(slug);
  }

  // ── Episodios ─────────────────────────────────────────────
  @Post('episodes')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Añadir episodio con configuración de anuncios' })
  createEpisode(@Body() dto: CreateEpisodeDto) {
    return this.adminService.createEpisode(dto);
  }

  @Put('episodes/:id')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Editar episodio' })
  updateEpisode(@Param('id') id: string, @Body() dto: Partial<CreateEpisodeDto>) {
    return this.adminService.updateEpisode(id, dto);
  }

  @Delete('episodes/:id')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Eliminar episodio' })
  deleteEpisode(@Param('id') id: string) {
    return this.adminService.deleteEpisode(id);
  }

  @Put('seasons/:id')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Renombrar o cambiar tipo de temporada' })
  updateSeason(@Param('id') id: string, @Body() dto: { title?: string; type?: string }) {
    return this.adminService.updateSeason(id, dto);
  }

  @Delete('seasons/:id')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Eliminar temporada con todos sus episodios' })
  deleteSeason(@Param('id') id: string) {
    return this.adminService.deleteSeason(id);
  }

  @Post('episodes/:id/servers')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Añadir servidor de video al episodio' })
  addVideoServer(@Param('id') episodeId: string, @Body() dto: AddVideoServerDto) {
    return this.adminService.addVideoServer(episodeId, dto);
  }

  @Delete('servers/:id')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Eliminar servidor de video' })
  removeVideoServer(@Param('id') serverId: string) {
    return this.adminService.removeVideoServer(serverId);
  }

  // ── Usuarios ──────────────────────────────────────────────
  @Get('users')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Lista de usuarios con filtros' })
  getUsers(@Query() dto: GetUsersDto) {
    return this.adminService.getUsers(dto);
  }

  @Put('users/:id/role')
  @Roles('owner')
  @ApiOperation({ summary: 'Cambiar rol de usuario (solo owner)' })
  changeRole(
    @Param('id') userId: string,
    @Body() dto: ChangeRoleDto,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.adminService.changeUserRole(userId, dto, requesterId);
  }

  @Post('users/:id/warn')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Enviar advertencia formal al usuario' })
  warnUser(@Param('id') userId: string, @Body() dto: WarnUserDto) {
    return this.adminService.warnUser(userId, dto);
  }

  @Post('users/:id/silence')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Silenciar usuario por N días' })
  silenceUser(@Param('id') userId: string, @Body() dto: SilenceUserDto) {
    return this.adminService.silenceUser(userId, dto);
  }

  @Post('users/:id/ban')
  @Roles('owner')
  @ApiOperation({ summary: 'Banear usuario temporal o permanente (solo owner)' })
  banUser(@Param('id') userId: string, @Body() dto: BanUserDto) {
    return this.adminService.banUser(userId, dto);
  }

  @Delete('users/:id/ban')
  @Roles('owner')
  @ApiOperation({ summary: 'Levantar baneo (solo owner)' })
  unbanUser(@Param('id') userId: string) {
    return this.adminService.unbanUser(userId);
  }

  @Delete('users/:id')
  @Roles('owner')
  @ApiOperation({ summary: 'Eliminar cuenta permanentemente (solo owner)' })
  deleteUser(
    @Param('id') userId: string,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.adminService.deleteUser(userId, requesterId);
  }

  // ── Comunidades ───────────────────────────────────────────
  @Get('communities')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Lista de comunidades con filtros' })
  getCommunities(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.adminService.getCommunities(+page, +limit, search);
  }

  @Post('communities/:id/promote')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Promover comunidad a oficial' })
  promoteCommunity(
    @Param('id') communityId: string,
    @Body() dto: PromoteCommunityDto,
  ) {
    return this.adminService.promoteCommunity(communityId, dto);
  }

  @Delete('communities/:id/promote')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Degradar comunidad a no oficial' })
  demoteCommunity(@Param('id') communityId: string) {
    return this.adminService.demoteCommunity(communityId);
  }

  @Patch('communities/:id/active')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Silenciar o reactivar comunidad' })
  toggleCommunityActive(@Param('id') communityId: string) {
    return this.adminService.toggleCommunityActive(communityId);
  }

  @Delete('communities/:id')
  @Roles('owner')
  @ApiOperation({ summary: 'Eliminar comunidad permanentemente (solo owner)' })
  deleteCommunity(@Param('id') communityId: string) {
    return this.adminService.deleteCommunity(communityId);
  }

  // ── Moderación ────────────────────────────────────────────
  @Get('reports')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Lista de reportes pendientes' })
  getReports(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('filter') filter?: string,
  ) {
    return this.adminService.getReports(+page, +limit, filter);
  }

  @Put('reports/:id')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Revisar o desestimar reporte' })
  reviewReport(
    @Param('id') reportId: string,
    @Body() dto: ReviewReportDto,
    @CurrentUser('id') reviewerId: string,
  ) {
    return this.adminService.reviewReport(reportId, reviewerId, dto);
  }

  @Delete('content/:type/:id')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Eliminar contenido reportado (post, comment, episode_comment)' })
  deleteContent(
    @Param('type') contentType: string,
    @Param('id') contentId: string,
  ) {
    return this.adminService.deleteContent(contentType, contentId);
  }

  // ── Config global ─────────────────────────────────────────
  @Get('settings')
  @Roles('owner')
  @ApiOperation({ summary: 'Ver configuración global del sitio' })
  getSettings() {
    return this.adminService.getSettings();
  }

  @Put('settings')
  @Roles('owner')
  @ApiOperation({ summary: 'Actualizar configuración global del sitio' })
  updateSettings(@Body() dto: UpdateGlobalSettingsDto) {
    return this.adminService.updateSettings(dto);
  }

  // ── Géneros ────────────────────────────────────────────────
  @Get('genres')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Listar todos los géneros' })
  getGenres() {
    return this.adminService.getGenres();
  }

  @Post('genres')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Crear un nuevo género' })
  createGenre(@Body() dto: CreateGenreDto) {
    return this.adminService.createGenre(dto);
  }

  @Put('genres/:id')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Renombrar un género' })
  updateGenre(@Param('id') id: string, @Body() dto: UpdateGenreDto) {
    return this.adminService.updateGenre(id, dto);
  }

  @Delete('genres/:id')
  @Roles('moderador', 'owner')
  @ApiOperation({ summary: 'Eliminar un género' })
  deleteGenre(@Param('id') id: string) {
    return this.adminService.deleteGenre(id);
  }

  // ── Mantenimiento (público, sin auth) ──────────────────────
  @Public()
  @Get('maintenance-status')
  @ApiOperation({ summary: 'Estado del modo mantenimiento (público, sin auth)' })
  getMaintenanceStatus() {
    return this.adminService.getMaintenanceStatus();
  }
}