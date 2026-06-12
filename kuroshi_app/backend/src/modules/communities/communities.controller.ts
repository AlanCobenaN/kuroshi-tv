import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommunitiesService } from './communities.service';
import {
  CreateCommunityDto,
  GetCommunitiesDto,
  CreatePostDto,
  CreatePostCommentDto,
  GetPostsDto,
  UpdateCommunityDto,
  KickMemberDto,
  SilenceMemberDto,
  BanMemberDto,
  UnbanMemberDto,
  PromoteModeratorDto,
  TransferOwnershipDto,
  ApproveJoinRequestDto,
  RejectJoinRequestDto,
} from './dto/communities.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';

@ApiTags('Communities')
@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  // GET /api/communities
  @UseGuards(OptionalJwtGuard)
  @Get()
  @ApiOperation({ summary: 'Explorar comunidades con filtros, featured y trending' })
  getCommunities(
    @Query() dto: GetCommunitiesDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.communitiesService.getCommunities(dto, userId);
  }

  // POST /api/communities
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear comunidad. Se crea como no_oficial por defecto' })
  createCommunity(
    @Body() dto: CreateCommunityDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.createCommunity(userId, dto);
  }

  // GET /api/communities/mine
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Comunidades del usuario autenticado' })
  getMyCommunities(@CurrentUser('id') userId: string) {
    return this.communitiesService.getMyCommunities(userId);
  }

  // GET /api/communities/:slug/members
  @Get(':slug/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Miembros de la comunidad con estado de presencia' })
  getCommunityMembers(@Param('slug') slug: string) {
    return this.communitiesService.getCommunityMembers(slug);
  }

  // GET /api/communities/feed
  @Public()
  @Get('feed')
  @ApiOperation({ summary: 'Feed global de posts de todas las comunidades con paginación' })
  getFeed(
    @Query() dto: GetPostsDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.communitiesService.getFeed(dto, userId);
  }

  // GET /api/communities/:slug
  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Detalle incluyendo progress_pct hacia comunidad oficial' })
  getCommunity(
    @Param('slug') slug: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.communitiesService.getCommunity(slug, userId);
  }

  // POST /api/communities/:slug/join
  @Post(':slug/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unirse a la comunidad' })
  joinCommunity(
    @Param('slug') slug: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.joinCommunity(slug, userId);
  }

  // DELETE /api/communities/:slug/leave
  @Delete(':slug/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Abandonar la comunidad' })
  leaveCommunity(
    @Param('slug') slug: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.leaveCommunity(slug, userId);
  }

  // GET /api/communities/:slug/posts
  @Public()
  @Get(':slug/posts')
  @ApiOperation({ summary: 'Feed de posts con paginación' })
  getPosts(
    @Param('slug') slug: string,
    @Query() dto: GetPostsDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.communitiesService.getPosts(slug, dto, userId);
  }

  // POST /api/communities/:slug/posts
  @Post(':slug/posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publicar con texto, imagen URL Imgur o link a episodio' })
  createPost(
    @Param('slug') slug: string,
    @Body() dto: CreatePostDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.createPost(slug, userId, dto);
  }

  // PATCH /api/communities/:slug/posts/:id/hide
  @Patch(':slug/posts/:id/hide')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ocultar un post (moderador+)' })
  hidePost(
    @Param('slug') slug: string,
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.hidePost(slug, userId, postId);
  }

  // PATCH /api/communities/:slug/posts/:id
  @Patch(':slug/posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar un post (solo autor)' })
  updatePost(
    @Param('slug') slug: string,
    @Param('id') postId: string,
    @Body() dto: CreatePostDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.updatePost(slug, postId, userId, dto);
  }

  // DELETE /api/communities/:slug/posts/:id
  @Delete(':slug/posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar permanentemente un post (solo creador)' })
  deletePost(
    @Param('slug') slug: string,
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.deletePost(slug, userId, postId);
  }

  // POST /api/communities/:slug/posts/:id/like
  @Post(':slug/posts/:id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dar like a un post' })
  likePost(
    @Param('slug') slug: string,
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.likePost(slug, postId, userId);
  }

  // GET /api/communities/:slug/posts/:id/comments
  @Public()
  @Get(':slug/posts/:id/comments')
  @ApiOperation({ summary: 'Comentarios del post con respuestas anidadas' })
  getPostComments(
    @Param('slug') slug: string,
    @Param('id') postId: string,
  ) {
    return this.communitiesService.getPostComments(slug, postId);
  }

  // POST /api/communities/:slug/posts/:id/comments
  @Post(':slug/posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Comentar en post o responder a otro comentario' })
  createPostComment(
    @Param('slug') slug: string,
    @Param('id') postId: string,
    @Body() dto: CreatePostCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.createPostComment(slug, postId, userId, dto);
  }

  // GET /api/communities/:slug/chat
  @Get(':slug/chat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Historial del chat vía REST para cargar antes del WebSocket' })
  getChatHistory(
    @Param('slug') slug: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.getChatHistory(slug, userId);
  }

  // ── Management endpoints ──────────────────────────────────

  // PATCH /api/communities/:slug
  @Patch(':slug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Owner] Actualizar comunidad (nombre, descripción, banner, avatar, privacidad)' })
  updateCommunity(
    @Param('slug') slug: string,
    @Body() dto: UpdateCommunityDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.updateCommunity(slug, userId, dto);
  }

  // DELETE /api/communities/:slug
  @Delete(':slug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Owner] Eliminar comunidad definitivamente' })
  deleteCommunity(
    @Param('slug') slug: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.deleteCommunity(slug, userId);
  }

  // POST /api/communities/:slug/transfer
  @Post(':slug/transfer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Owner] Transferir propiedad a otro miembro' })
  transferOwnership(
    @Param('slug') slug: string,
    @Body() dto: TransferOwnershipDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.transferOwnership(slug, userId, dto.userId);
  }

  // POST /api/communities/:slug/kick
  @Post(':slug/kick')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Moderator+] Expulsar miembro de la comunidad' })
  kickMember(
    @Param('slug') slug: string,
    @Body() dto: KickMemberDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.kickMember(slug, userId, dto.userId);
  }

  // POST /api/communities/:slug/silence
  @Post(':slug/silence')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Moderator+] Silenciar miembro por X minutos' })
  silenceMember(
    @Param('slug') slug: string,
    @Body() dto: SilenceMemberDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.silenceMember(slug, userId, dto.userId, dto.durationMinutes);
  }

  // POST /api/communities/:slug/ban
  @Post(':slug/ban')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Owner] Banear miembro (temporal o permanente)' })
  banMember(
    @Param('slug') slug: string,
    @Body() dto: BanMemberDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.banMember(slug, userId, dto.userId, dto.reason, dto.durationMinutes);
  }

  // POST /api/communities/:slug/unban
  @Post(':slug/unban')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Owner] Desbanear usuario' })
  unbanMember(
    @Param('slug') slug: string,
    @Body() dto: UnbanMemberDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.unbanMember(slug, userId, dto.userId);
  }

  // POST /api/communities/:slug/moderator
  @Post(':slug/moderator')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Owner] Ascender miembro a moderador' })
  promoteModerator(
    @Param('slug') slug: string,
    @Body() dto: PromoteModeratorDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.promoteModerator(slug, userId, dto.userId);
  }

  // POST /api/communities/:slug/demote
  @Post(':slug/demote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Owner] Degradar moderador a miembro' })
  demoteModerator(
    @Param('slug') slug: string,
    @Body() dto: PromoteModeratorDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.demoteModerator(slug, userId, dto.userId);
  }

  // Join Requests (private communities)
  // POST /api/communities/:slug/request-join
  @Post(':slug/request-join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Solicitar unirse a comunidad privada' })
  requestJoin(
    @Param('slug') slug: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.requestJoin(slug, userId);
  }

  // GET /api/communities/:slug/join-requests
  @Get(':slug/join-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Moderator+] Ver solicitudes de ingreso pendientes' })
  getJoinRequests(
    @Param('slug') slug: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.getJoinRequests(slug, userId);
  }

  // POST /api/communities/:slug/join-requests/approve
  @Post(':slug/join-requests/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Moderator+] Aprobar solicitud de ingreso' })
  approveJoinRequest(
    @Param('slug') slug: string,
    @Body() dto: ApproveJoinRequestDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.approveJoinRequest(slug, dto.requestId, userId);
  }

  // POST /api/communities/:slug/join-requests/reject
  @Post(':slug/join-requests/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Moderator+] Rechazar solicitud de ingreso' })
  rejectJoinRequest(
    @Param('slug') slug: string,
    @Body() dto: RejectJoinRequestDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.communitiesService.rejectJoinRequest(slug, dto.requestId, userId);
  }
}