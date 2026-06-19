import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import {
  UpdateProfileDto,
  UpdateUsernameDto,
  AddToWatchlistDto,
  UpdateWatchlistDto,
  SaveProgressDto,
  FriendRequestActionDto,
  GetNotificationsDto,
} from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  // ── GET /users/:username — Perfil público ─────────────────
  async getProfile(username: string, requesterId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username, isActive: true },
      select: {
        id: true,
        username: true,
        bio: true,
        avatarUrl: true,
        role: true,
        visibility: true,
        emailVerified: true,
        createdAt: true,
        lastActiveAt: true,
        favoriteAnime: {
          select: {
            id: true, slug: true, titleEs: true, titleJp: true,
            coverUrl: true, bannerUrl: true, malRating: true, status: true,
          },
        },
        _count: {
          select: {
            communityMemberships: true,
            userAchievements: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Verificar privacidad
    const isOwner = requesterId === user.id;
    const isFriend = requesterId
      ? await this.areFriends(user.id, requesterId)
      : false;

    const canSeeFullProfile =
      isOwner ||
      user.visibility === 'publico' ||
      (user.visibility === 'solo_amigos' && isFriend);

    if (!canSeeFullProfile) {
      // Perfil privado: solo datos básicos
      return {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt,
        isPrivate: true,
      };
    }

    // Estadísticas de episodios y horas
    const progressStats = await this.prisma.userProgress.aggregate({
      where: { userId: user.id, completed: true },
      _count: { id: true },
    });

    // Horas totales: suma de duration_minutes de episodios completados
    // Nota: aggregate no soporta relaciones anidadas, hacemos findMany
    const completedProgress = await this.prisma.userProgress.findMany({
      where: { userId: user.id, completed: true },
      select: {
        episode: {
          select: { durationMinutes: true },
        },
      },
    });
    const totalMinutes = completedProgress.reduce(
      (sum, p) => sum + (p.episode?.durationMinutes ?? 0),
      0,
    );
    const hoursWatched = Math.round(totalMinutes / 60);

    const friendsCount = await this.prisma.friendship.count({
      where: {
        OR: [
          { requesterId: user.id, status: 'aceptada' },
          { addresseeId: user.id, status: 'aceptada' },
        ],
      },
    });

    // Estado de amistad con el visitante
    let friendshipStatus: string | null = null;
    let friendshipId: string | null = null;

    if (requesterId && requesterId !== user.id) {
      const friendship = await this.prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId, addresseeId: user.id },
            { requesterId: user.id, addresseeId: requesterId },
          ],
        },
        select: { id: true, status: true },
      });
      if (friendship) {
        friendshipStatus = friendship.status;
        friendshipId = friendship.id;
      }
    }

    return {
      ...user,
      episodesWatched: progressStats._count.id,
      hoursWatched,
      friendsCount,
      friendshipStatus,
      friendshipId,
      isPrivate: false,
    };
  }

  // ── PUT /users/me — Actualizar perfil ─────────────────────
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: any = {};
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;
    if (dto.visibility !== undefined) data.visibility = dto.visibility;
    if (dto.favoriteAnimeId !== undefined) {
      if (dto.favoriteAnimeId === null) {
        data.favoriteAnimeId = null;
      } else {
        const anime = await this.prisma.anime.findUnique({
          where: { id: dto.favoriteAnimeId },
          select: { id: true },
        });
        if (!anime) throw new NotFoundException('Anime no encontrado');
        data.favoriteAnimeId = dto.favoriteAnimeId;
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        username: true,
        bio: true,
        avatarUrl: true,
        visibility: true,
        favoriteAnime: {
          select: {
            id: true, slug: true, titleEs: true, titleJp: true,
            coverUrl: true, bannerUrl: true, malRating: true, status: true,
          },
        },
      },
    });
  }

  // ── PUT /users/me/username — Cambiar username ─────────────
  async updateUsername(userId: string, dto: UpdateUsernameDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { usernameChangedAt: true },
    });

    // Validar límite de 30 días
    if (user.usernameChangedAt) {
      const daysSince = Math.floor(
        (Date.now() - user.usernameChangedAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSince < 30) {
        throw new ForbiddenException(
          `Puedes cambiar tu username en ${30 - daysSince} días`,
        );
      }
    }

    // Verificar disponibilidad
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing && existing.id !== userId) {
      throw new ConflictException('El nombre de usuario ya está en uso');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { username: dto.username, usernameChangedAt: new Date() },
      select: { id: true, username: true, usernameChangedAt: true },
    });
  }

  // ── GET /users/me/continue-watching ───────────────────────
  async getContinueWatching(userId: string) {
    const progress = await this.prisma.userProgress.findMany({
      where: { userId },
      orderBy: { watchedAt: 'desc' },
      take: 30,
      include: {
        episode: {
          select: {
            id: true,
            number: true,
            title: true,
            season: {
              select: {
                number: true,
                anime: {
                  select: {
                    id: true,
                    slug: true,
                    titleEs: true,
                    titleJp: true,
                    coverUrl: true,
                    bannerUrl: true,
                    totalEpisodes: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const seen = new Set<string>();
    const result: any[] = [];
    for (const p of progress) {
      const animeId = p.episode.season.anime.id;
      if (seen.has(animeId)) continue;
      seen.add(animeId);
      result.push({
        anime: p.episode.season.anime,
        episode: {
          id: p.episode.id,
          number: p.episode.number,
          title: p.episode.title,
          seasonNumber: p.episode.season.number,
        },
        lastMinute: p.lastMinute,
        watchedAt: p.watchedAt,
      });
      if (result.length >= 10) break;
    }
    return result;
  }

  // ── GET /users/:username/watchlist ────────────────────────
  async getWatchlist(username: string, requesterId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, visibility: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const isOwner = requesterId === user.id;
    const isFriend = requesterId ? await this.areFriends(user.id, requesterId) : false;
    const canSee =
      isOwner ||
      user.visibility === 'publico' ||
      (user.visibility === 'solo_amigos' && isFriend);

    if (!canSee) throw new ForbiddenException('Lista privada');

    const watchlist = await this.prisma.userWatchlist.findMany({
      where: { userId: user.id },
      orderBy: { lastWatchedAt: 'desc' },
      select: {
        id: true,
        userId: true,
        animeId: true,
        status: true,
        personalRating: true,
        lastWatchedAt: true,
        updatedAt: true,
        anime: {
          select: {
            id: true,
            slug: true,
            titleEs: true,
            titleJp: true,
            coverUrl: true,
            malRating: true,
            totalEpisodes: true,
            status: true,
          },
        },
      },
    });

    // Agrupar por estado
    const grouped = {
      viendo: watchlist.filter((w) => w.status === 'viendo'),
      completado: watchlist.filter((w) => w.status === 'completado'),
      pendiente: watchlist.filter((w) => w.status === 'pendiente'),
      abandonado: watchlist.filter((w) => w.status === 'abandonado'),
    };

    return {
      total: watchlist.length,
      grouped,
      data: watchlist,
    };
  }

  // ── POST /users/me/watchlist — Añadir anime ───────────────
  async addToWatchlist(userId: string, dto: AddToWatchlistDto) {
    const anime = await this.prisma.anime.findUnique({
      where: { id: dto.animeId },
      select: { id: true },
    });
    if (!anime) throw new NotFoundException('Anime no encontrado');

    const existing = await this.prisma.userWatchlist.findUnique({
      where: { userId_animeId: { userId, animeId: dto.animeId } },
    });
    if (existing) throw new ConflictException('El anime ya está en tu lista');

    return this.prisma.userWatchlist.create({
      data: {
        userId,
        animeId: dto.animeId,
        status: (dto.status as any) ?? 'pendiente',
      },
      select: {
        status: true,
        anime: { select: { id: true, slug: true, titleEs: true } },
      },
    });
  }

  // ── PUT /users/me/watchlist/:animeId — Cambiar estado ─────
  async updateWatchlistEntry(userId: string, animeId: string, dto: UpdateWatchlistDto) {
    const entry = await this.prisma.userWatchlist.findUnique({
      where: { userId_animeId: { userId, animeId } },
    });
    if (!entry) throw new NotFoundException('Anime no está en tu lista');

    return this.prisma.userWatchlist.update({
      where: { userId_animeId: { userId, animeId } },
      data: {
        status: dto.status as any,
        personalRating: dto.personalRating,
        manualOverride: true, // el usuario cambió manualmente, no revertir automáticamente
        lastWatchedAt: new Date(),
      },
      select: {
        status: true,
        personalRating: true,
        manualOverride: true,
      },
    });
  }

  // ── DELETE /users/me/watchlist/:animeId ───────────────────
  async removeFromWatchlist(userId: string, animeId: string) {
    const entry = await this.prisma.userWatchlist.findUnique({
      where: { userId_animeId: { userId, animeId } },
    });
    if (!entry) throw new NotFoundException('Anime no está en tu lista');

    await this.prisma.userWatchlist.delete({
      where: { userId_animeId: { userId, animeId } },
    });

    return { message: 'Anime eliminado de tu lista' };
  }

  // ── POST /users/me/progress — Guardar progreso ────────────
  async saveProgress(userId: string, dto: SaveProgressDto) {
    const episode = await this.prisma.episode.findUnique({
      where: { id: dto.episodeId },
      select: { id: true, season: { select: { animeId: true } } },
    });
    if (!episode) throw new NotFoundException('Episodio no encontrado');

    const progress = await this.prisma.userProgress.upsert({
      where: { userId_episodeId: { userId, episodeId: dto.episodeId } },
      update: {
        lastMinute: dto.lastMinute,
        completed: dto.completed ?? false,
        watchedAt: new Date(),
      },
      create: {
        userId,
        episodeId: dto.episodeId,
        lastMinute: dto.lastMinute,
        completed: dto.completed ?? false,
      },
      select: { lastMinute: true, completed: true, watchedAt: true },
    });

    // Actualizar watchlist automáticamente si no tiene manual_override
    await this.updateWatchlistStatusAuto(userId, episode.season.animeId);

    return progress;
  }

  // ── GET /users/:username/activity ────────────────────────
  async getActivity(username: string, requesterId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, visibility: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const isOwner = requesterId === user.id;
    const isFriend = requesterId ? await this.areFriends(user.id, requesterId) : false;
    const canSee =
      isOwner ||
      user.visibility === 'publico' ||
      (user.visibility === 'solo_amigos' && isFriend);

    if (!canSee) throw new ForbiddenException('Actividad privada');

    // Últimos episodios vistos
    const recentProgress = await this.prisma.userProgress.findMany({
      where: { userId: user.id },
      orderBy: { watchedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        watchedAt: true,
        completed: true,
        episode: {
          select: {
            number: true,
            title: true,
            season: {
              select: {
                anime: { select: { slug: true, titleEs: true, coverUrl: true } },
              },
            },
          },
        },
      },
    });

    // Últimas comunidades unidas
    const recentCommunities = await this.prisma.communityMember.findMany({
      where: { userId: user.id },
      orderBy: { joinedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        joinedAt: true,
        community: { select: { slug: true, name: true, avatarUrl: true } },
      },
    });

    // Logros recientes
    const recentAchievements = await this.prisma.userAchievement.findMany({
      where: { userId: user.id },
      orderBy: { unlockedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        unlockedAt: true,
        achievement: { select: { name: true, description: true, xpReward: true } },
      },
    });

    // Posts recientes del usuario
    const recentPosts = await this.prisma.post.findMany({
      where: { userId: user.id, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        content: true,
        createdAt: true,
        community: { select: { slug: true, name: true } },
      },
    });

    const activity: any[] = [];

    // Mapear episodios vistos
    for (const p of recentProgress) {
      const anime = p.episode.season.anime;
      activity.push({
        id: `progress_${p.id}`,
        type: 'episode_watched',
        description: `Vio el episodio ${p.episode.number}${p.completed ? '' : ' (en progreso)'} de ${anime.titleEs}`,
        link: `/anime/${anime.slug}`,
        meta: `EP ${p.episode.number} — ${anime.titleEs}`,
        createdAt: p.watchedAt,
      });
    }

    // Mapear comunidades unidas
    for (const c of recentCommunities) {
      activity.push({
        id: `community_${c.id}`,
        type: 'community_joined',
        description: `Se unió a la comunidad ${c.community.name}`,
        link: `/comunidad/${c.community.slug}`,
        meta: c.community.name,
        createdAt: c.joinedAt,
      });
    }

    // Mapear logros
    for (const a of recentAchievements) {
      activity.push({
        id: `achievement_${a.id}`,
        type: 'achievement',
        description: `Desbloqueó el logro: ${a.achievement.name}`,
        link: undefined,
        meta: `+${a.achievement.xpReward} XP`,
        createdAt: a.unlockedAt,
      });
    }

    // Mapear posts
    for (const p of recentPosts) {
      activity.push({
        id: `post_${p.id}`,
        type: 'post',
        description: `Publicó en ${p.community.name}: "${p.content.substring(0, 80)}${p.content.length > 80 ? '...' : ''}"`,
        link: `/comunidad/${p.community.slug}`,
        meta: p.community.name,
        createdAt: p.createdAt,
      });
    }

    // Ordenar por fecha descendente
    activity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { data: activity };
  }

  // ── GET /users/:username/friends ──────────────────────────
  async getFriends(username: string, requesterId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, visibility: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const isOwner = requesterId === user.id;
    const isFriend = requesterId ? await this.areFriends(user.id, requesterId) : false;
    const canSee =
      isOwner ||
      user.visibility === 'publico' ||
      (user.visibility === 'solo_amigos' && isFriend);

    if (!canSee) throw new ForbiddenException('Lista de amigos privada');

    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: user.id, status: 'aceptada' },
          { addresseeId: user.id, status: 'aceptada' },
        ],
      },
      select: {
        id: true,
        requesterId: true,
        addresseeId: true,
        status: true,
        createdAt: true,
        requester: {
          select: { id: true, username: true, avatarUrl: true, bio: true },
        },
        addressee: {
          select: { id: true, username: true, avatarUrl: true, bio: true },
        },
      },
    });

    // Aplanar: devolver el otro usuario como "user"
    return friendships.map((f) => {
      const friendUser = f.requesterId === user.id ? f.addressee : f.requester;
      return {
        id: f.id,
        requesterId: f.requesterId,
        addresseeId: f.addresseeId,
        status: f.status,
        createdAt: f.createdAt,
        user: friendUser,
      };
    });
  }

  // ── GET /users/:username/communities ──────────────────────
  async getUserCommunities(username: string, requesterId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, visibility: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const isOwner = requesterId === user.id;
    const isFriend = requesterId ? await this.areFriends(user.id, requesterId) : false;
    const canSee =
      isOwner ||
      user.visibility === 'publico' ||
      (user.visibility === 'solo_amigos' && isFriend);

    if (!canSee) throw new ForbiddenException('Comunidades privadas');

    const memberships = await this.prisma.communityMember.findMany({
      where: { userId: user.id },
      select: {
        role: true,
        joinedAt: true,
        community: {
          select: {
            id: true,
            slug: true,
            name: true,
            avatarUrl: true,
            type: true,
            membersCount: true,
          },
        },
      },
    });

    return memberships.map((m) => ({
      id: m.community.id,
      slug: m.community.slug,
      name: m.community.name,
      avatarUrl: m.community.avatarUrl,
      type: m.community.type,
      membersCount: m.community.membersCount,
      role: m.role,
    }));
  }

  // ── POST /users/:username/friend-request ──────────────────
  async sendFriendRequest(requesterId: string, targetUsername: string) {
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { id: true, username: true, avatarUrl: true },
    });
    const target = await this.prisma.user.findUnique({
      where: { username: targetUsername },
      select: { id: true, username: true, avatarUrl: true },
    });
    if (!target || !requester) throw new NotFoundException('Usuario no encontrado');

    if (requesterId === target.id) {
      throw new BadRequestException('No puedes enviarte una solicitud a ti mismo');
    }

    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId: target.id },
          { requesterId: target.id, addresseeId: requesterId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'aceptada') {
        throw new ConflictException('Ya son amigos');
      }
      if (existing.status === 'pendiente') {
        throw new ConflictException('Ya existe una solicitud pendiente');
      }
      if (existing.status === 'rechazada') {
        const friendship = await this.prisma.friendship.update({
          where: { id: existing.id },
          data: { status: 'pendiente' },
          select: { id: true, status: true, createdAt: true },
        });

        await this.createNotification(target.id, 'amistad_recibida', {
          title: 'Nueva solicitud de amistad',
          body: `${requester.username} te envió una solicitud de amistad`,
          metadata: { requesterId, friendshipId: friendship.id, username: requester.username },
        });

        await this.createNotification(requesterId, 'amistad_enviada' as any, {
          title: 'Solicitud de amistad enviada',
          body: `Le enviaste una solicitud de amistad a ${targetUsername}`,
          metadata: { targetUsername, friendshipId: friendship.id },
        });

        await this.realtime.emitFriendshipUpdate(requesterId, {
          friendship_id: friendship.id,
          status: 'pendiente',
          actor_id: requesterId,
          other_user_id: target.id,
          other_username: target.username,
          other_avatar_url: target.avatarUrl ?? undefined,
        });

        await this.realtime.emitFriendshipUpdate(target.id, {
          friendship_id: friendship.id,
          status: 'pendiente',
          actor_id: requesterId,
          other_user_id: requesterId,
          other_username: requester.username,
          other_avatar_url: requester.avatarUrl ?? undefined,
        });

        return friendship;
      }
      if (existing.status === 'bloqueada') {
        throw new ForbiddenException('No puedes enviar una solicitud a este usuario');
      }
    }

    const friendship = await this.prisma.friendship.create({
      data: { requesterId, addresseeId: target.id },
      select: { id: true, status: true, createdAt: true },
    });

    // Notificar al destinatario
    await this.createNotification(target.id, 'amistad_recibida', {
      title: 'Nueva solicitud de amistad',
      body: `${requester.username} te envió una solicitud de amistad`,
      metadata: { requesterId, friendshipId: friendship.id, username: requester.username },
    });

    // Notificar al remitente que la solicitud fue enviada
    await this.createNotification(requesterId, 'amistad_enviada' as any, {
      title: 'Solicitud de amistad enviada',
      body: `Le enviaste una solicitud de amistad a ${targetUsername}`,
      metadata: { targetUsername, friendshipId: friendship.id },
    });

    // Emitir actualización en tiempo real a ambos usuarios
    await this.realtime.emitFriendshipUpdate(requesterId, {
      friendship_id: friendship.id,
      status: 'pendiente',
      actor_id: requesterId,
      other_user_id: target.id,
      other_username: target.username,
      other_avatar_url: target.avatarUrl ?? undefined,
    });

    await this.realtime.emitFriendshipUpdate(target.id, {
      friendship_id: friendship.id,
      status: 'pendiente',
      actor_id: requesterId,
      other_user_id: requesterId,
      other_username: requester.username,
      other_avatar_url: requester.avatarUrl ?? undefined,
    });

    return friendship;
  }

  // ── PUT /users/me/friend-request/:id ─────────────────────
  async respondFriendRequest(userId: string, friendshipId: string, dto: FriendRequestActionDto) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
      select: { id: true, requesterId: true, addresseeId: true, status: true },
    });

    if (!friendship) throw new NotFoundException('Solicitud no encontrada');
    if (friendship.addresseeId !== userId) {
      throw new ForbiddenException('No puedes responder esta solicitud');
    }
    if (friendship.status !== 'pendiente') {
      throw new BadRequestException('La solicitud ya fue respondida');
    }

    // Obtener datos de ambos usuarios para el payload del evento
    const [requester, addressee] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: friendship.requesterId },
        select: { id: true, username: true, avatarUrl: true },
      }),
      this.prisma.user.findUnique({
        where: { id: friendship.addresseeId },
        select: { id: true, username: true, avatarUrl: true },
      }),
    ]);

    const updated = await this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: dto.action },
      select: { id: true, status: true },
    });

    if (dto.action === 'aceptada' && addressee) {
      await this.createNotification(friendship.requesterId, 'amistad_aceptada', {
        title: 'Solicitud aceptada',
        body: `${addressee.username} aceptó tu solicitud de amistad`,
        metadata: { friendshipId, username: addressee.username },
      });
    }

    // Emitir actualización en tiempo real a ambos usuarios
    if (requester && addressee) {
      await this.realtime.emitFriendshipUpdate(friendship.requesterId, {
        friendship_id: friendshipId,
        status: dto.action,
        actor_id: userId,
        other_user_id: addressee.id,
        other_username: addressee.username,
        other_avatar_url: addressee.avatarUrl ?? undefined,
      });

      await this.realtime.emitFriendshipUpdate(friendship.addresseeId, {
        friendship_id: friendshipId,
        status: dto.action,
        actor_id: userId,
        other_user_id: requester.id,
        other_username: requester.username,
        other_avatar_url: requester.avatarUrl ?? undefined,
      });
    }

    return updated;
  }

  // ── DELETE /users/me/friend/:friendshipId ─────────────────
  async removeFriend(userId: string, friendshipId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
      select: { id: true, requesterId: true, addresseeId: true, status: true },
    });

    if (!friendship) throw new NotFoundException('Amistad no encontrada');
    if (friendship.requesterId !== userId && friendship.addresseeId !== userId) {
      throw new ForbiddenException('No puedes eliminar esta amistad');
    }
    if (friendship.status !== 'aceptada') {
      throw new BadRequestException('La amistad no está activa');
    }

    await this.prisma.friendship.delete({ where: { id: friendshipId } });

    return { message: 'Amigo eliminado' };
  }

  // ── GET /users/me/friend-requests ─────────────────────────
  async getFriendRequests(userId: string) {
    const [received, sent] = await Promise.all([
      this.prisma.friendship.findMany({
        where: { addresseeId: userId, status: 'pendiente' },
        select: {
          id: true,
          createdAt: true,
          requester: {
            select: { id: true, username: true, avatarUrl: true, bio: true },
          },
        },
      }),
      this.prisma.friendship.findMany({
        where: { requesterId: userId, status: 'pendiente' },
        select: {
          id: true,
          createdAt: true,
          addressee: {
            select: { id: true, username: true, avatarUrl: true, bio: true },
          },
        },
      }),
    ]);

    return {
      received: received.map((f) => ({
        id: f.id,
        user: f.requester,
        createdAt: f.createdAt,
      })),
      sent: sent.map((f) => ({
        id: f.id,
        user: f.addressee,
        createdAt: f.createdAt,
      })),
    };
  }

  // ── GET /users/me/notifications ───────────────────────────
  async getNotifications(userId: string, dto: GetNotificationsDto) {
    const where: any = { userId };
    if (dto.type) where.type = dto.type;

    const skip = (dto.page - 1) * dto.limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: dto.limit,
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          isRead: true,
          metadata: true,
          stackedCount: true,
          createdAt: true,
        },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data: notifications,
      unreadCount,
      meta: {
        page: dto.page,
        total,
        total_pages: Math.ceil(total / dto.limit),
      },
    };
  }

  // ── PUT /users/me/notifications/read-all ─────────────────
  async markAllNotificationsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { message: 'Todas las notificaciones marcadas como leídas' };
  }

  // ── Helpers privados ──────────────────────────────────────
  private async areFriends(userAId: string, userBId: string): Promise<boolean> {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userAId, addresseeId: userBId, status: 'aceptada' },
          { requesterId: userBId, addresseeId: userAId, status: 'aceptada' },
        ],
      },
    });
    return !!friendship;
  }

  private async updateWatchlistStatusAuto(userId: string, animeId: string) {
    const entry = await this.prisma.userWatchlist.findUnique({
      where: { userId_animeId: { userId, animeId } },
      select: { status: true, manualOverride: true },
    });

    // Si no hay entrada en la watchlist, crear una con estado "viendo"
    if (!entry) {
      await this.prisma.userWatchlist.create({
        data: {
          userId,
          animeId,
          status: 'viendo',
          lastWatchedAt: new Date(),
        },
      });
      return;
    }

    if (entry.manualOverride) return; // respetar decisión manual

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentProgress = await this.prisma.userProgress.findFirst({
      where: {
        userId,
        episode: { season: { animeId } },
        watchedAt: { gte: sevenDaysAgo },
      },
    });

    let newStatus = entry.status;

    if (recentProgress) {
      if (entry.status === 'abandonado' || entry.status === 'pendiente') {
        newStatus = 'viendo';
        if (entry.status === 'abandonado') {
          await this.createNotification(userId, 'retoma_anime', {
            title: '¡Retomaste un anime!',
            body: 'Volviste a ver un anime que habías abandonado',
            metadata: { animeId },
          });
        }
      }
    } else if (entry.status === 'viendo') {
      newStatus = 'abandonado';
    }

    if (newStatus !== entry.status) {
      await this.prisma.userWatchlist.update({
        where: { userId_animeId: { userId, animeId } },
        data: { status: newStatus as any, lastWatchedAt: new Date() },
      });
    }
  }

  // ── createNotification — persiste, stackea, limita y emite push ──
  async createNotification(
    userId: string,
    type: any,
    payload: { title: string; body: string; metadata?: any; stackKey?: string },
  ) {
    const SOCIAL_TYPES: any[] = ['respuesta_post', 'respuesta_comment', 'like_post', 'like_comment', 'amistad_recibida', 'amistad_enviada', 'amistad_aceptada'];

    // 1) Stacking — si hay una notif del mismo tipo+stackKey sin leer en los últimos 5 min, incrementar
    if (payload.stackKey) {
      const recent = await this.prisma.notification.findFirst({
        where: {
          userId,
          type,
          isRead: false,
          createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
          metadata: { path: ['stackKey'], equals: payload.stackKey },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, stackedCount: true, body: true, metadata: true },
      });

      if (recent) {
        const newCount = recent.stackedCount + 1;
        const meta = (recent.metadata as any) ?? {};
        const stackedBy = meta.stackedBy ?? [];

        // Extraer nombre de quien dispara esta notificación del body
        const triggerName = payload.body.split(' ')[0] ?? 'Alguien';

        // Actualizar body con el nuevo conteo
        let newBody: string;
        if (newCount === 2) {
          newBody = `${stackedBy[0] ?? triggerName} y ${triggerName} ${payload.body.includes('publicación') ? 'respondieron a tu publicación' : 'respondieron a tu comentario'}`;
        } else {
          newBody = `${stackedBy[0] ?? triggerName}, ${stackedBy[1] ?? triggerName} y ${newCount - 1} más ${payload.body.includes('publicación') ? 'respondieron a tu publicación' : 'respondieron a tu comentario'}`;
        }

        await this.prisma.notification.update({
          where: { id: recent.id },
          data: {
            stackedCount: newCount,
            body: newBody,
            metadata: { ...meta, stackedBy: [...new Set([...stackedBy, triggerName])].slice(0, 2) },
          },
        });

        // Emitir actualización
        const updated = await this.prisma.notification.findUnique({ where: { id: recent.id } });
        if (updated) await this.realtime.emitNotification(userId, updated);
        return updated;
      }
    }

    // 2) Límite social — max 10 notificaciones social sin leer
    if (SOCIAL_TYPES.includes(type)) {
      const socialCount = await this.prisma.notification.count({
        where: { userId, isRead: false, type: { in: SOCIAL_TYPES } },
      });
      if (socialCount >= 10) {
        const oldest = await this.prisma.notification.findFirst({
          where: { userId, isRead: false, type: { in: SOCIAL_TYPES } },
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        });
        if (oldest) {
          await this.prisma.notification.delete({ where: { id: oldest.id } });
        }
      }
    }

    // 3) Crear nueva notificación
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title: payload.title,
        body: payload.body,
        stackedCount: 1,
        metadata: payload.stackKey
          ? { ...(payload.metadata ?? {}), stackKey: payload.stackKey }
          : (payload.metadata ?? {}),
      },
    });

    // Emitir push al canal user:{userId}
    await this.realtime.emitNotification(userId, notification);

    return notification;
  }
}