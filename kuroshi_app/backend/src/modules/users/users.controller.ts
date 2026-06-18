import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  UpdateProfileDto,
  UpdateUsernameDto,
  AddToWatchlistDto,
  UpdateWatchlistDto,
  SaveProgressDto,
  FriendRequestActionDto,
  GetNotificationsDto,
} from './dto/users.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /api/users/:username
  @Public()
  @Get(':username')
  @ApiOperation({ summary: 'Perfil público. Respeta configuración de privacidad' })
  getProfile(
    @Param('username') username: string,
    @CurrentUser('id') requesterId?: string,
  ) {
    return this.usersService.getProfile(username, requesterId);
  }

  // PUT /api/users/me
  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar bio, avatar, anime favorito y visibilidad' })
  updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  // PUT /api/users/me/username
  @Put('me/username')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar username. Solo permitido cada 30 días' })
  updateUsername(
    @Body() dto: UpdateUsernameDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.updateUsername(userId, dto);
  }

  // GET /api/users/me/continue-watching
  @Get('me/continue-watching')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Animes que el usuario está viendo con su último progreso' })
  getContinueWatching(@CurrentUser('id') userId: string) {
    return this.usersService.getContinueWatching(userId);
  }

  // GET /api/users/:username/watchlist
  @Public()
  @Get(':username/watchlist')
  @ApiOperation({ summary: 'Lista de anime. Respeta privacidad del perfil' })
  getWatchlist(
    @Param('username') username: string,
    @CurrentUser('id') requesterId?: string,
  ) {
    return this.usersService.getWatchlist(username, requesterId);
  }

  // POST /api/users/me/watchlist
  @Post('me/watchlist')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Añadir anime a la lista con estado inicial' })
  addToWatchlist(
    @Body() dto: AddToWatchlistDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.addToWatchlist(userId, dto);
  }

  // PUT /api/users/me/watchlist/:animeId
  @Put('me/watchlist/:animeId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar estado. Activa manual_override automáticamente' })
  updateWatchlist(
    @Param('animeId') animeId: string,
    @Body() dto: UpdateWatchlistDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.updateWatchlistEntry(userId, animeId, dto);
  }

  // DELETE /api/users/me/watchlist/:animeId
  @Delete('me/watchlist/:animeId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar anime de la lista personal' })
  removeFromWatchlist(
    @Param('animeId') animeId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.removeFromWatchlist(userId, animeId);
  }

  // POST /api/users/me/progress
  @Post('me/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Guardar minuto exacto de reproducción del episodio' })
  saveProgress(
    @Body() dto: SaveProgressDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.saveProgress(userId, dto);
  }

  // GET /api/users/:username/activity
  @Public()
  @Get(':username/activity')
  @ApiOperation({ summary: 'Feed cronológico de actividad reciente' })
  getActivity(
    @Param('username') username: string,
    @CurrentUser('id') requesterId?: string,
  ) {
    return this.usersService.getActivity(username, requesterId);
  }

  // GET /api/users/:username/friends
  @Public()
  @Get(':username/friends')
  @ApiOperation({ summary: 'Lista de amigos del perfil' })
  getFriends(
    @Param('username') username: string,
    @CurrentUser('id') requesterId?: string,
  ) {
    return this.usersService.getFriends(username, requesterId);
  }

  // GET /api/users/:username/communities
  @Public()
  @Get(':username/communities')
  @ApiOperation({ summary: 'Comunidades del usuario con rol' })
  getUserCommunities(
    @Param('username') username: string,
    @CurrentUser('id') requesterId?: string,
  ) {
    return this.usersService.getUserCommunities(username, requesterId);
  }

  // POST /api/users/:username/friend-request
  @Post(':username/friend-request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar solicitud de amistad' })
  sendFriendRequest(
    @Param('username') targetUsername: string,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.usersService.sendFriendRequest(requesterId, targetUsername);
  }

  // PUT /api/users/me/friend-request/:id
  @Put('me/friend-request/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aceptar o rechazar solicitud recibida' })
  respondFriendRequest(
    @Param('id') friendshipId: string,
    @Body() dto: FriendRequestActionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.respondFriendRequest(userId, friendshipId, dto);
  }

  // DELETE /api/users/me/friend/:friendshipId
  @Delete('me/friend/:friendshipId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar amigo (cualquier lado de la amistad)' })
  removeFriend(
    @Param('friendshipId') friendshipId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.removeFriend(userId, friendshipId);
  }

  // GET /api/users/me/friend-requests
  @Get('me/friend-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Solicitudes de amistad recibidas y enviadas pendientes' })
  getFriendRequests(@CurrentUser('id') userId: string) {
    return this.usersService.getFriendRequests(userId);
  }

  // GET /api/users/me/notifications
  @Get('me/notifications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar notificaciones con filtros y paginación' })
  getNotifications(
    @Query() dto: GetNotificationsDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.usersService.getNotifications(userId, dto);
  }

  // PUT /api/users/me/notifications/read-all
  @Put('me/notifications/read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  markAllRead(@CurrentUser('id') userId: string) {
    return this.usersService.markAllNotificationsRead(userId);
  }
}