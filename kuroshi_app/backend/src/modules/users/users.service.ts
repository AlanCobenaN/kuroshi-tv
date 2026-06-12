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
          select: { id: true, slug: true, titleEs: true, coverUrl: true, bannerUrl: true },
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

    return {
      ...user,
      episodesWatched: progressStats._count.id,
      hoursWatched,
      friendsCount,
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
      // Verificar que el anime existe
      const anime = await this.prisma.anime.findUnique({
        where: { id: dto.favoriteAnimeId },
        select: { id: true },
      });
      if (!anime) throw new NotFoundException('Anime no encontrado');
      data.favoriteAnimeId = dto.favoriteAnimeId;
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
          select: { id: true, slug: true, titleEs: true, bannerUrl: true },
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
        unlockedAt: true,
        achievement: { select: { name: true, description: true, xpReward: true } },
      },
    });

    return {
      recentProgress,
      recentCommunities,
      recentAchievements,
    };
  }

  // ── POST /users/:username/friend-request ──────────────────
  async sendFriendRequest(requesterId: string, targetUsername: string) {
    const target = await this.prisma.user.findUnique({
      where: { username: targetUsername },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('Usuario no encontrado');

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
    }

    const friendship = await this.prisma.friendship.create({
      data: { requesterId, addresseeId: target.id },
      select: { id: true, status: true, createdAt: true },
    });

    // Notificar al destinatario
    await this.createNotification(target.id, 'amistad_recibida', {
      title: 'Nueva solicitud de amistad',
      body: `Te enviaron una solicitud de amistad`,
      metadata: { requesterId, friendshipId: friendship.id },
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

    const updated = await this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: dto.action },
      select: { id: true, status: true },
    });

    if (dto.action === 'aceptada') {
      await this.createNotification(friendship.requesterId, 'amistad_aceptada', {
        title: 'Solicitud aceptada',
        body: 'Tu solicitud de amistad fue aceptada',
        metadata: { friendshipId },
      });
    }

    return updated;
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

    if (!entry || entry.manualOverride) return; // respetar decisión manual

    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const recentProgress = await this.prisma.userProgress.findFirst({
      where: {
        userId,
        episode: { season: { animeId } },
        watchedAt: { gte: fiveDaysAgo },
      },
    });

    let newStatus = entry.status;

    if (recentProgress) {
      if (entry.status === 'abandonado' || entry.status === 'pendiente') {
        newStatus = 'viendo';
        // Notificar retoma si venía de abandonado
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
    const SOCIAL_TYPES: any[] = ['respuesta_post', 'respuesta_comment', 'like_post', 'like_comment', 'amistad_recibida', 'amistad_aceptada'];

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