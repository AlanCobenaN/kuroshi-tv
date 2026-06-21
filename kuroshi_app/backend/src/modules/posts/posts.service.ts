import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { SharePostDto } from './dto/posts.dto';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async getPostById(postId: string, userId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
      select: {
        id: true,
        userId: true,
        content: true,
        imageUrl: true,
        likesCount: true,
        isPinned: true,
        createdAt: true,
        editedAt: true,
        sharedPostId: true,
        sharedText: true,
        user: {
          select: { id: true, username: true, avatarUrl: true, role: true },
        },
        community: {
          select: { slug: true, name: true },
        },
        sharedPost: {
          select: {
            id: true,
            content: true,
            imageUrl: true,
            likesCount: true,
            createdAt: true,
            user: {
              select: { id: true, username: true, avatarUrl: true, role: true },
            },
            community: {
              select: { slug: true, name: true },
            },
          },
        },
        _count: { select: { comments: true } },
      },
    });

    if (!post) throw new NotFoundException('Publicación no encontrada');

    const result: any = { ...post, liked_by_me: false };

    if (userId) {
      const like = await this.prisma.postLike.findUnique({
        where: { postId_userId: { postId, userId } },
      });
      result.liked_by_me = !!like;
    }

    return result;
  }

  async sharePost(userId: string, postId: string, dto: SharePostDto) {
    const originalPost = await this.prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
      select: { id: true },
    });

    if (!originalPost) throw new NotFoundException('Publicación no encontrada');

    const { content, communitySlug } = dto;

    if (communitySlug) {
      const community = await this.prisma.community.findUnique({
        where: { slug: communitySlug, isActive: true },
        select: { id: true },
      });
      if (!community) throw new NotFoundException('Comunidad no encontrada');

      const member = await this.prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId: community.id, userId } },
      });
      if (!member) throw new ForbiddenException('Debes ser miembro de la comunidad para compartir allí');

      if (member.isSilenced) {
        const stillSilenced = !member.silencedUntil || member.silencedUntil > new Date();
        if (stillSilenced) throw new ForbiddenException('Estás silenciado en esta comunidad');
      }

      const post = await this.prisma.post.create({
        data: {
          communityId: community.id,
          userId,
          content: content || '',
          sharedPostId: postId,
          sharedText: content || null,
        },
        select: {
          id: true,
          content: true,
          sharedPostId: true,
          sharedText: true,
          createdAt: true,
          user: {
            select: { id: true, username: true, avatarUrl: true, role: true },
          },
          community: {
            select: { slug: true, name: true },
          },
        },
      });

      return post;
    }

    const post = await this.prisma.post.create({
      data: {
        communityId: null,
        userId,
        content: content || '',
        sharedPostId: postId,
        sharedText: content || null,
      },
      select: {
        id: true,
        content: true,
        sharedPostId: true,
        sharedText: true,
        createdAt: true,
        user: {
          select: { id: true, username: true, avatarUrl: true, role: true },
        },
        _count: { select: { comments: true } },
      },
    });

    if (content) {
      const originalAuthor = await this.prisma.post.findUnique({
        where: { id: postId },
        select: { userId: true },
      });

      if (originalAuthor && originalAuthor.userId !== userId) {
        const sharer = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { username: true },
        });
        await this.usersService.createNotification(originalAuthor.userId, 'like_post', {
          title: '¡Compartieron tu publicación!',
          body: `${sharer?.username ?? 'Alguien'} compartió tu publicación`,
          metadata: { postId, sharePostId: post.id },
        });
      }
    }

    return post;
  }
}
