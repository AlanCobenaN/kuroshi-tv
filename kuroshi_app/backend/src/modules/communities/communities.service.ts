import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import {
  CreateCommunityDto,
  GetCommunitiesDto,
  CreatePostDto,
  CreatePostCommentDto,
  GetPostsDto,
  UpdateCommunityDto,
} from './dto/communities.dto';

@Injectable()
export class CommunitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  // ── GET /communities ──────────────────────────────────────
  async getCommunities(dto: GetCommunitiesDto, userId?: string) {
    const { search, type, order, page, limit } = dto;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (type) where.type = type;

    let orderBy: any = { membersCount: 'desc' };
    if (order === 'recientes') orderBy = { createdAt: 'desc' };
    else if (order === 'miembros') orderBy = { membersCount: 'desc' };

    const [communities, total] = await Promise.all([
      this.prisma.community.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          avatarUrl: true,
          type: true,
          membersCount: true,
          membersThreshold: true,
          createdAt: true,
          _count: { select: { posts: true } },
        },
      }),
      this.prisma.community.count({ where }),
    ]);

    // Añadir user_membership si hay sesión
    let userMembershipMap = new Map<string, { role: string; joinedAt: Date }>();
    if (userId) {
      const membershipRecords = await this.prisma.communityMember.findMany({
        where: { userId },
        select: { communityId: true, role: true, joinedAt: true },
      });
      for (const m of membershipRecords) {
        userMembershipMap.set(m.communityId, { role: m.role, joinedAt: m.joinedAt });
      }
    }

    const communitiesWithMembership = communities.map(c => ({
      ...c,
      user_membership: userMembershipMap.get(c.id) ?? null,
    }));

    // Comunidades oficiales destacadas
    const featured = await this.prisma.community.findMany({
      where: { isActive: true, type: 'oficial' },
      orderBy: { membersCount: 'desc' },
      take: 6,
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        avatarUrl: true,
        bannerUrl: true,
        membersCount: true,
      },
    });

    // Top 5 más activas hoy (por posts recientes)
    const trending = await this.prisma.community.findMany({
      where: { isActive: true },
      orderBy: { membersCount: 'desc' },
      take: 5,
      select: {
        id: true,
        slug: true,
        name: true,
        avatarUrl: true,
        type: true,
        membersCount: true,
        _count: { select: { posts: true } },
      },
    });

    return {
      featured,
      trending,
      data: communitiesWithMembership,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // ── POST /communities ─────────────────────────────────────
  async createCommunity(userId: string, dto: CreateCommunityDto) {
    const slug = this.generateSlug(dto.name);

    const existing = await this.prisma.community.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Ya existe una comunidad con ese nombre');

    // Limitar a 2 comunidades por usuario
    const ownedCount = await this.prisma.community.count({
      where: { createdById: userId, isActive: true },
    });
    if (ownedCount >= 2) {
      throw new ForbiddenException('No puedes ser creador de más de 2 comunidades');
    }

    const community = await this.prisma.community.create({
      data: {
        slug,
        name: dto.name,
        description: dto.description,
        avatarUrl: dto.avatarUrl,
        type: 'no_oficial',
        createdById: userId,
        members: {
          create: {
            userId,
            role: 'creador',
          },
        },
        membersCount: 1,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        type: true,
        membersCount: true,
        membersThreshold: true,
        createdAt: true,
      },
    });

    return community;
  }

  // ── GET /communities/:slug ────────────────────────────────
  async getCommunity(slug: string, userId?: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug, isActive: true },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        rules: true,
        avatarUrl: true,
        bannerUrl: true,
        type: true,
        membersCount: true,
        membersThreshold: true,
        createdAt: true,
        creator: {
          select: { id: true, username: true, avatarUrl: true },
        },
        members: {
          where: { role: { in: ['creador', 'moderador'] } },
          select: {
            role: true,
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
        _count: { select: { posts: true, members: true } },
      },
    });

    if (!community) throw new NotFoundException('Comunidad no encontrada');

    // Progreso hacia comunidad oficial
    const progressPct =
      community.type === 'no_oficial'
        ? Math.min(
            100,
            Math.round((community.membersCount / community.membersThreshold) * 100),
          )
        : 100;

    // Si hay sesión, verificar membresía
    let userMembership = null;
    if (userId) {
      userMembership = await this.prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: community.id, userId } },
        select: { role: true, joinedAt: true },
      });
    }

    return {
      ...community,
      progressPct,
      userMembership,
    };
  }

  // ── POST /communities/:slug/join ──────────────────────────
  async joinCommunity(slug: string, userId: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug, isActive: true },
      select: { id: true, membersCount: true, membersThreshold: true, type: true, isPrivate: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    const existing = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
    });
    if (existing) throw new ConflictException('Ya eres miembro de esta comunidad');

    const ban = await this.prisma.communityBan.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
    });
    if (ban && (!ban.expiresAt || ban.expiresAt > new Date())) {
      throw new ForbiddenException('Estás baneado de esta comunidad');
    }

    // Si es privada, crear solicitud en lugar de unirse directamente
    if (community.isPrivate) {
      const existingRequest = await this.prisma.communityJoinRequest.findUnique({
        where: { communityId_userId: { communityId: community.id, userId } },
      });
      if (existingRequest && existingRequest.status === 'pending') {
        throw new ConflictException('Ya tienes una solicitud pendiente');
      }
      if (existingRequest && existingRequest.status === 'rejected') {
        await this.prisma.communityJoinRequest.update({
          where: { id: existingRequest.id },
          data: { status: 'pending', reviewedAt: null, reviewedById: null },
        });
        return { message: 'Solicitud reenviada. Espera la aprobación de un moderador.' };
      }
      await this.prisma.communityJoinRequest.create({
        data: { communityId: community.id, userId },
      });
      return { message: 'Solicitud enviada. Espera la aprobación de un moderador.' };
    }

    await this.prisma.$transaction([
      this.prisma.communityMember.create({
        data: { communityId: community.id, userId, role: 'miembro' },
      }),
      this.prisma.community.update({
        where: { id: community.id },
        data: { membersCount: { increment: 1 } },
      }),
    ]);

    return { message: 'Te uniste a la comunidad exitosamente' };
  }

  // ── DELETE /communities/:slug/leave ───────────────────────
  async leaveCommunity(slug: string, userId: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    const member = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
      select: { role: true },
    });

    if (!member) throw new BadRequestException('No eres miembro de esta comunidad');
    if (member.role === 'creador') {
      throw new ForbiddenException('El creador no puede abandonar su comunidad');
    }

    await this.prisma.$transaction([
      this.prisma.communityMember.delete({
        where: { communityId_userId: { communityId: community.id, userId } },
      }),
      this.prisma.community.update({
        where: { id: community.id },
        data: { membersCount: { decrement: 1 } },
      }),
    ]);

    return { message: 'Abandonaste la comunidad' };
  }

  // ── GET /communities/:slug/posts ──────────────────────────
  async getPosts(slug: string, dto: GetPostsDto, userId?: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug, isActive: true },
      select: { id: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    const skip = (dto.page - 1) * dto.limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { communityId: community.id, isDeleted: false },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: dto.limit,
        select: {
          id: true,
          content: true,
          imageUrl: true,
          likesCount: true,
          isPinned: true,
          createdAt: true,
          editedAt: true,
          user: { select: { id: true, username: true, avatarUrl: true, role: true } },
          _count: { select: { comments: true } },
        },
      }),
      this.prisma.post.count({
        where: { communityId: community.id, isDeleted: false },
      }),
    ]);

    return {
      data: posts,
      meta: { page: dto.page, total, total_pages: Math.ceil(total / dto.limit) },
    };
  }

  // ── GET /communities/feed ──────────────────────────────────
  async getFeed(dto: GetPostsDto, userId?: string) {
    const skip = (dto.page - 1) * dto.limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { isDeleted: false, community: { isActive: true } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: dto.limit,
        select: {
          id: true,
          content: true,
          imageUrl: true,
          likesCount: true,
          isPinned: true,
          createdAt: true,
          editedAt: true,
          user: { select: { id: true, username: true, avatarUrl: true, role: true } },
          community: { select: { slug: true, name: true } },
          _count: { select: { comments: true } },
        },
      }),
      this.prisma.post.count({
        where: { isDeleted: false, community: { isActive: true } },
      }),
    ]);

    return {
      data: posts,
      meta: { page: dto.page, total, total_pages: Math.ceil(total / dto.limit) },
    };
  }

  // ── POST /communities/:slug/posts ─────────────────────────
  async createPost(slug: string, userId: string, dto: CreatePostDto) {
    const community = await this.prisma.community.findUnique({
      where: { slug, isActive: true },
      select: { id: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    // Verificar membresía
    const member = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
    });
    if (!member) throw new ForbiddenException('Debes ser miembro para publicar');

    // Verificar silencio
    if (member.isSilenced) {
      const stillSilenced = !member.silencedUntil || member.silencedUntil > new Date();
      if (stillSilenced) {
        throw new ForbiddenException('Estás silenciado en esta comunidad');
      }
      // Auto-clear expired silence
      await this.prisma.communityMember.update({
        where: { id: member.id },
        data: { isSilenced: false, silencedUntil: null },
      });
    }

    const post = await this.prisma.post.create({
      data: {
        communityId: community.id,
        userId,
        content: dto.content,
        imageUrl: dto.imageUrl,
        linkedEpisodeId: dto.linkedEpisodeId,
      },
      select: {
        id: true,
        content: true,
        imageUrl: true,
        likesCount: true,
        createdAt: true,
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    // Si la comunidad es "Anuncios", notificar a todos los usuarios
    if (slug === 'anuncios') {
      const author = post.user?.username ?? 'Alguien';
      const allUsers = await this.prisma.user.findMany({
        select: { id: true },
      });
      const notificationPromises = allUsers.map(u =>
        this.usersService.createNotification(u.id, 'anuncio_comunidad', {
          title: `Nuevo anuncio — ${author}`,
          body: dto.content.length > 120
            ? dto.content.slice(0, 120) + '…'
            : dto.content,
          metadata: {
            postId: post.id,
            community_slug: slug,
            content: dto.content,
            imageUrl: dto.imageUrl,
            author: author,
          },
        }),
      );
      await Promise.allSettled(notificationPromises);
    }

    return post;
  }

  // ── PATCH /communities/:slug/posts/:id/hide ───────────────
  async hidePost(slug: string, userId: string, postId: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    const member = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
      select: { role: true },
    });
    if (!member || !['creador', 'moderador'].includes(member.role)) {
      throw new ForbiddenException('No tienes permiso para ocultar posts');
    }

    const post = await this.prisma.post.findUnique({
      where: { id: postId, communityId: community.id, isDeleted: false },
    });
    if (!post) throw new NotFoundException('Post no encontrado');

    return this.prisma.post.update({
      where: { id: postId },
      data: { isDeleted: true },
      select: { id: true, isDeleted: true },
    });
  }

  // ── DELETE /communities/:slug/posts/:id ────────────────────
  async deletePost(slug: string, userId: string, postId: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug },
      select: { id: true, createdById: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');
    if (community.createdById !== userId) {
      throw new ForbiddenException('Solo el creador puede eliminar posts permanentemente');
    }

    const post = await this.prisma.post.findUnique({
      where: { id: postId, communityId: community.id },
    });
    if (!post) throw new NotFoundException('Post no encontrado');

    await this.prisma.post.delete({ where: { id: postId } });
    return { message: 'Post eliminado permanentemente' };
  }

  // ── PATCH /communities/:slug/posts/:id ────────────────────
  async updatePost(slug: string, postId: string, userId: string, dto: CreatePostDto) {
    const community = await this.prisma.community.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    const post = await this.prisma.post.findUnique({
      where: { id: postId, communityId: community.id, isDeleted: false },
    });
    if (!post) throw new NotFoundException('Post no encontrado');
    if (post.userId !== userId) {
      throw new ForbiddenException('Solo puedes editar tus propios posts');
    }

    return this.prisma.post.update({
      where: { id: postId },
      data: {
        content: dto.content,
        imageUrl: dto.imageUrl,
        linkedEpisodeId: dto.linkedEpisodeId,
        editedAt: new Date(),
      },
      select: {
        id: true,
        content: true,
        imageUrl: true,
        linkedEpisodeId: true,
        editedAt: true,
      },
    });
  }

  // ── POST /communities/:slug/posts/:id/like — Toggle like ───
  async likePost(slug: string, postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
      select: { id: true, userId: true },
    });
    if (!post) throw new NotFoundException('Post no encontrado');

    const existing = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      // Unlike
      await this.prisma.postLike.delete({ where: { id: existing.id } });
      await this.prisma.post.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      });
      return { id: postId, liked: false, likesCount: Math.max(0, (await this.prisma.post.findUnique({ where: { id: postId }, select: { likesCount: true } }))?.likesCount ?? 0) };
    } else {
      // Like
      await this.prisma.postLike.create({ data: { postId, userId } });
      const updated = await this.prisma.post.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
        select: { id: true, likesCount: true },
      });

      // Notificar al autor del post si no es él mismo
      if (post.userId !== userId) {
        const liker = await this.prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
        await this.usersService.createNotification(post.userId, 'like_post', {
          title: '¡Like en tu publicación!',
          body: `${liker?.username ?? 'Alguien'} le gustó tu publicación`,
          metadata: { postId, communitySlug: slug },
        });
      }

      return { id: postId, liked: true, likesCount: updated.likesCount };
    }
  }

  // ── GET /communities/:slug/posts/:id/comments ─────────────
  async getPostComments(slug: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
      select: { id: true },
    });
    if (!post) throw new NotFoundException('Post no encontrado');

    // Traer todos los comentarios planos (sin anidar) para que el frontend
    // construya el árbol con cualquier profundidad.
    const comments = await this.prisma.postComment.findMany({
      where: { postId, isDeleted: false },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        postId: true,
        content: true,
        likesCount: true,
        hasSpoiler: true,
        parentId: true,
        createdAt: true,
        user: { select: { id: true, username: true, avatarUrl: true, role: true } },
      },
    });

    return comments;
  }

  // ── POST /communities/:slug/posts/:id/comments ────────────
  async createPostComment(
    slug: string,
    postId: string,
    userId: string,
    dto: CreatePostCommentDto,
  ) {
    const community = await this.prisma.community.findUnique({
      where: { slug, isActive: true },
      select: { id: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    // Verificar membresía y silencio
    const member = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
    });
    if (!member) throw new ForbiddenException('Debes ser miembro para comentar');
    if (member.isSilenced) {
      const stillSilenced = !member.silencedUntil || member.silencedUntil > new Date();
      if (stillSilenced) {
        throw new ForbiddenException('Estás silenciado en esta comunidad');
      }
      await this.prisma.communityMember.update({
        where: { id: member.id },
        data: { isSilenced: false, silencedUntil: null },
      });
    }

    const post = await this.prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
      select: { id: true, userId: true },
    });
    if (!post) throw new NotFoundException('Post no encontrado');

    // Si es respuesta, verificar que el comentario padre existe
    if (dto.parentId) {
      const parent = await this.prisma.postComment.findUnique({
        where: { id: dto.parentId },
        select: { id: true },
      });
      if (!parent) throw new NotFoundException('Comentario padre no encontrado');
    }

    const comment = await this.prisma.postComment.create({
      data: {
        postId,
        userId,
        content: dto.content,
        parentId: dto.parentId ?? null,
        hasSpoiler: dto.hasSpoiler ?? false,
      },
      select: {
        id: true,
        postId: true,
        userId: true,
        content: true,
        likesCount: true,
        hasSpoiler: true,
        parentId: true,
        createdAt: true,
        user: { select: { id: true, username: true, avatarUrl: true, role: true } },
      },
    });

    // Obtener datos del usuario que comenta para el body
    const commenter = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });
    const commenterName = commenter?.username ?? 'Alguien';

    if (dto.parentId) {
      // ── Respuesta a un comentario → notificar al autor del comentario padre ──
      const parentComment = await this.prisma.postComment.findUnique({
        where: { id: dto.parentId },
        select: { userId: true },
      });
      if (parentComment && parentComment.userId !== userId) {
        await this.usersService.createNotification(parentComment.userId, 'respuesta_comment', {
          title: 'Respuesta a tu comentario',
          body: `${commenterName} respondió a tu comentario`,
          metadata: { postId, commentId: comment.id, community_slug: slug },
          stackKey: postId,
        });
      }
    } else {
      // ── Comentario nuevo en el post → notificar al autor del post ──
      if (post.userId !== userId) {
        await this.usersService.createNotification(post.userId, 'respuesta_post', {
          title: 'Respuesta a tu publicación',
          body: `${commenterName} respondió a tu publicación`,
          metadata: { postId, commentId: comment.id, community_slug: slug },
          stackKey: postId,
        });
      }
    }

    return comment;
  }

  // ── GET /communities/mine ───────────────────────────────────
  async getMyCommunities(userId: string) {
    const memberships = await this.prisma.communityMember.findMany({
      where: { userId },
      select: {
        role: true,
        joinedAt: true,
        community: {
          select: {
            id: true,
            slug: true,
            name: true,
            description: true,
            avatarUrl: true,
            bannerUrl: true,
            type: true,
            membersCount: true,
            createdAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map(m => ({
      ...m.community,
      user_role: m.role,
      joined_at: m.joinedAt,
    }));
  }

  // ── GET /communities/:slug/members ──────────────────────────
  async getCommunityMembers(slug: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug, isActive: true },
      select: { id: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    const members = await this.prisma.communityMember.findMany({
      where: { communityId: community.id },
      select: {
        role: true,
        joinedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            role: true,
            lastActiveAt: true,
          },
        },
      },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });

    return members.map(m => ({
      id: m.user.id,
      username: m.user.username,
      avatar_url: m.user.avatarUrl,
      role: m.user.role,
      community_role: m.role,
      is_online: m.user.lastActiveAt
        ? Date.now() - new Date(m.user.lastActiveAt).getTime() < 300000
        : false,
      last_active_at: m.user.lastActiveAt,
      joined_at: m.joinedAt,
    }));
  }

  // ── GET /communities/:slug/chat ───────────────────────────
  async getChatHistory(slug: string, userId: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug, isActive: true },
      select: { id: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    const member = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
    });
    if (!member) throw new ForbiddenException('Debes ser miembro para ver el chat');

    const isStaff = ['creador', 'moderador'].includes(member.role);

    // Últimos 50 mensajes para cargar antes de conectar el WebSocket
    // Mods/owner ven mensajes eliminados también
    const messages = await this.prisma.communityChat.findMany({
      where: isStaff
        ? { communityId: community.id }
        : { communityId: community.id, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        content: true,
        replyToId: true,
        isDeleted: true,
        createdAt: true,
        user: { select: { id: true, username: true, avatarUrl: true, role: true } },
        replyTo: {
          select: {
            id: true,
            content: true,
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    return messages.reverse(); // más antiguos primero
  }

  // ── PATCH /communities/:slug ─────────────────────────────
  async updateCommunity(slug: string, userId: string, dto: UpdateCommunityDto) {
    const community = await this.prisma.community.findUnique({
      where: { slug },
      select: { id: true, createdById: true, name: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');
    if (community.createdById !== userId) throw new ForbiddenException('Solo el creador puede modificar la comunidad');

    const data: any = {};
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.bannerUrl !== undefined) data.bannerUrl = dto.bannerUrl;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;
    if (dto.isPrivate !== undefined) data.isPrivate = dto.isPrivate;

    if (dto.name !== undefined) {
      const newSlug = this.generateSlug(dto.name);
      if (newSlug !== slug) {
        const existing = await this.prisma.community.findUnique({ where: { slug: newSlug } });
        if (existing) throw new ConflictException('Ya existe una comunidad con ese nombre');
      }
      // Validar límite de 30 días para cambio de nombre
      const lastChange = await this.prisma.community.findUnique({
        where: { id: community.id },
        select: { updatedAt: true },
      });
      if (lastChange) {
        const daysSinceUpdate = (Date.now() - new Date(lastChange.updatedAt).getTime()) / 86400000;
        if (daysSinceUpdate < 30) {
          const daysLeft = Math.ceil(30 - daysSinceUpdate);
          throw new BadRequestException(`Debes esperar ${daysLeft} días para cambiar el nombre nuevamente`);
        }
      }
      data.name = dto.name;
      data.slug = newSlug;
    }

    return this.prisma.community.update({
      where: { id: community.id },
      data,
      select: {
        id: true, slug: true, name: true, description: true,
        bannerUrl: true, avatarUrl: true, isPrivate: true,
      },
    });
  }

  // ── DELETE /communities/:slug ─────────────────────────────
  async deleteCommunity(slug: string, userId: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug },
      select: { id: true, createdById: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');
    if (community.createdById !== userId) throw new ForbiddenException('Solo el creador puede eliminar la comunidad');

    await this.prisma.community.delete({ where: { id: community.id } });
    return { message: 'Comunidad eliminada' };
  }

  // ── POST /communities/:slug/transfer ──────────────────────
  async transferOwnership(slug: string, userId: string, newOwnerId: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug },
      select: { id: true, createdById: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');
    if (community.createdById !== userId) throw new ForbiddenException('Solo el creador puede transferir la propiedad');

    const newOwnerMember = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId: newOwnerId } },
    });
    if (!newOwnerMember) throw new BadRequestException('El usuario no es miembro de la comunidad');
    if (newOwnerMember.userId === userId) throw new BadRequestException('Ya eres el creador');

    await this.prisma.$transaction([
      this.prisma.communityMember.update({
        where: { communityId_userId: { communityId: community.id, userId } },
        data: { role: 'miembro' },
      }),
      this.prisma.communityMember.update({
        where: { communityId_userId: { communityId: community.id, userId: newOwnerId } },
        data: { role: 'creador' },
      }),
      this.prisma.community.update({
        where: { id: community.id },
        data: { createdById: newOwnerId },
      }),
    ]);

    return { message: 'Propiedad transferida exitosamente' };
  }

  // ── POST /communities/:slug/kick ──────────────────────────
  async kickMember(slug: string, userId: string, targetUserId: string) {
    if (userId === targetUserId) throw new BadRequestException('No puedes expulsarte a ti mismo');

    const community = await this.prisma.community.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    const actor = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
      select: { role: true },
    });
    if (!actor || !['creador', 'moderador'].includes(actor.role)) {
      throw new ForbiddenException('No tienes permiso para expulsar miembros');
    }

    const target = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId: targetUserId } },
      select: { role: true },
    });
    if (!target) throw new NotFoundException('El usuario no es miembro de la comunidad');
    if (target.role === 'creador') throw new ForbiddenException('No puedes expulsar al creador');
    if (actor.role === 'moderador' && target.role === 'moderador') {
      throw new ForbiddenException('Un moderador no puede expulsar a otro moderador');
    }

    await this.prisma.$transaction([
      this.prisma.communityMember.delete({
        where: { communityId_userId: { communityId: community.id, userId: targetUserId } },
      }),
      this.prisma.community.update({
        where: { id: community.id },
        data: { membersCount: { decrement: 1 } },
      }),
    ]);

    return { message: 'Miembro expulsado' };
  }

  // ── POST /communities/:slug/silence ───────────────────────
  async silenceMember(slug: string, userId: string, targetUserId: string, durationMinutes: number) {
    if (userId === targetUserId) throw new BadRequestException('No puedes silenciarte a ti mismo');

    const community = await this.prisma.community.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    const actor = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
      select: { role: true },
    });
    if (!actor || !['creador', 'moderador'].includes(actor.role)) {
      throw new ForbiddenException('No tienes permiso para silenciar miembros');
    }

    const target = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId: targetUserId } },
      select: { role: true },
    });
    if (!target) throw new NotFoundException('El usuario no es miembro de la comunidad');
    if (target.role === 'creador') throw new ForbiddenException('No puedes silenciar al creador');
    if (actor.role === 'moderador' && target.role === 'moderador') {
      throw new ForbiddenException('Un moderador no puede silenciar a otro moderador');
    }

    const silencedUntil = new Date(Date.now() + durationMinutes * 60000);
    await this.prisma.communityMember.update({
      where: { communityId_userId: { communityId: community.id, userId: targetUserId } },
      data: { isSilenced: true, silencedUntil },
    });

    return { message: `Usuario silenciado por ${durationMinutes} minutos` };
  }

  // ── POST /communities/:slug/ban ───────────────────────────
  async banMember(slug: string, userId: string, targetUserId: string, reason?: string, durationMinutes?: number) {
    if (userId === targetUserId) throw new BadRequestException('No puedes prohibirte a ti mismo');

    const community = await this.prisma.community.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    const actor = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
      select: { role: true },
    });
    if (!actor || actor.role !== 'creador') {
      throw new ForbiddenException('Solo el creador puede banear miembros');
    }

    const target = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId: targetUserId } },
      select: { role: true },
    });
    if (!target) throw new NotFoundException('El usuario no es miembro de la comunidad');
    if (target.role === 'creador') throw new ForbiddenException('No puedes banear al creador');

    const expiresAt = durationMinutes ? new Date(Date.now() + durationMinutes * 60000) : null;

    await this.prisma.$transaction([
      this.prisma.communityMember.delete({
        where: { communityId_userId: { communityId: community.id, userId: targetUserId } },
      }),
      this.prisma.community.update({
        where: { id: community.id },
        data: { membersCount: { decrement: 1 } },
      }),
    ]);

    // Crear registro de ban (upsert para evitar duplicados)
    await this.prisma.communityBan.upsert({
      where: { communityId_userId: { communityId: community.id, userId: targetUserId } },
      update: { reason: reason ?? null, bannedById: userId, expiresAt, createdAt: new Date() },
      create: {
        communityId: community.id,
        userId: targetUserId,
        reason: reason ?? null,
        bannedById: userId,
        expiresAt,
      },
    });

    return { message: expiresAt ? 'Usuario baneado temporalmente' : 'Usuario baneado permanentemente' };
  }

  // ── POST /communities/:slug/unban ─────────────────────────
  async unbanMember(slug: string, userId: string, targetUserId: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    const actor = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
      select: { role: true },
    });
    if (!actor || actor.role !== 'creador') {
      throw new ForbiddenException('Solo el creador puede desbanear usuarios');
    }

    const ban = await this.prisma.communityBan.findUnique({
      where: { communityId_userId: { communityId: community.id, userId: targetUserId } },
    });
    if (!ban) throw new NotFoundException('El usuario no está baneado');

    await this.prisma.communityBan.delete({
      where: { communityId_userId: { communityId: community.id, userId: targetUserId } },
    });

    return { message: 'Usuario desbaneado' };
  }

  // ── POST /communities/:slug/moderator ─────────────────────
  async promoteModerator(slug: string, userId: string, targetUserId: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    const actor = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
      select: { role: true },
    });
    if (!actor || actor.role !== 'creador') {
      throw new ForbiddenException('Solo el creador puede asignar moderadores');
    }

    const target = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId: targetUserId } },
    });
    if (!target) throw new NotFoundException('El usuario no es miembro');
    if (target.role === 'creador') throw new BadRequestException('El creador ya tiene el máximo rango');
    if (target.role === 'moderador') throw new ConflictException('El usuario ya es moderador');

    await this.prisma.communityMember.update({
      where: { communityId_userId: { communityId: community.id, userId: targetUserId } },
      data: { role: 'moderador' },
    });

    return { message: 'Usuario ascendido a moderador' };
  }

  // ── DELETE /communities/:slug/moderator ───────────────────
  async demoteModerator(slug: string, userId: string, targetUserId: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    const actor = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
      select: { role: true },
    });
    if (!actor || actor.role !== 'creador') {
      throw new ForbiddenException('Solo el creador puede degradar moderadores');
    }

    const target = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId: targetUserId } },
    });
    if (!target) throw new NotFoundException('El usuario no es miembro');
    if (target.role !== 'moderador') throw new BadRequestException('El usuario no es moderador');

    await this.prisma.communityMember.update({
      where: { communityId_userId: { communityId: community.id, userId: targetUserId } },
      data: { role: 'miembro' },
    });

    return { message: 'Moderador degradado a miembro' };
  }

  // ── POST /communities/:slug/request-join ──────────────────
  async requestJoin(slug: string, userId: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug, isActive: true },
      select: { id: true, isPrivate: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');
    if (!community.isPrivate) {
      // Si es pública, unirse directamente
      return this.joinCommunity(slug, userId);
    }

    const existing = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
    });
    if (existing) throw new ConflictException('Ya eres miembro');

    const ban = await this.prisma.communityBan.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
    });
    if (ban && (!ban.expiresAt || ban.expiresAt > new Date())) {
      throw new ForbiddenException('Estás baneado de esta comunidad');
    }

    const existingRequest = await this.prisma.communityJoinRequest.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
    });
    if (existingRequest) {
      if (existingRequest.status === 'pending') throw new ConflictException('Ya tienes una solicitud pendiente');
      await this.prisma.communityJoinRequest.update({
        where: { id: existingRequest.id },
        data: { status: 'pending', reviewedAt: null, reviewedById: null },
      });
      return { message: 'Solicitud reenviada' };
    }

    await this.prisma.communityJoinRequest.create({
      data: { communityId: community.id, userId },
    });

    return { message: 'Solicitud enviada' };
  }

  // ── GET /communities/:slug/join-requests ──────────────────
  async getJoinRequests(slug: string, userId: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug, isActive: true },
      select: { id: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    const actor = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
      select: { role: true },
    });
    if (!actor || !['creador', 'moderador'].includes(actor.role)) {
      throw new ForbiddenException('No tienes permiso para ver solicitudes');
    }

    return this.prisma.communityJoinRequest.findMany({
      where: { communityId: community.id, status: 'pending' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── POST /communities/:slug/join-requests/approve ─────────
  async approveJoinRequest(slug: string, requestId: string, userId: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug, isActive: true },
      select: { id: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    const actor = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
      select: { role: true },
    });
    if (!actor || !['creador', 'moderador'].includes(actor.role)) {
      throw new ForbiddenException('No tienes permiso para aprobar solicitudes');
    }

    const request = await this.prisma.communityJoinRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.communityId !== community.id) throw new NotFoundException('Solicitud no encontrada');
    if (request.status !== 'pending') throw new BadRequestException('La solicitud ya fue procesada');

    await this.prisma.$transaction([
      this.prisma.communityJoinRequest.update({
        where: { id: requestId },
        data: { status: 'approved', reviewedAt: new Date(), reviewedById: userId },
      }),
      this.prisma.communityMember.create({
        data: { communityId: community.id, userId: request.userId, role: 'miembro' },
      }),
      this.prisma.community.update({
        where: { id: community.id },
        data: { membersCount: { increment: 1 } },
      }),
    ]);

    return { message: 'Solicitud aprobada' };
  }

  // ── POST /communities/:slug/join-requests/reject ──────────
  async rejectJoinRequest(slug: string, requestId: string, userId: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug, isActive: true },
      select: { id: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    const actor = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
      select: { role: true },
    });
    if (!actor || !['creador', 'moderador'].includes(actor.role)) {
      throw new ForbiddenException('No tienes permiso para rechazar solicitudes');
    }

    const request = await this.prisma.communityJoinRequest.findUnique({
      where: { id: requestId },
    });
    if (!request || request.communityId !== community.id) throw new NotFoundException('Solicitud no encontrada');
    if (request.status !== 'pending') throw new BadRequestException('La solicitud ya fue procesada');

    await this.prisma.communityJoinRequest.update({
      where: { id: requestId },
      data: { status: 'rejected', reviewedAt: new Date(), reviewedById: userId },
    });

    return { message: 'Solicitud rechazada' };
  }

  // ── Helper ────────────────────────────────────────────────
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 100);
  }
}