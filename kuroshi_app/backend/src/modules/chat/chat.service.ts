import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { SendChatMessageDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  // ── POST /chat/community/:slug — Enviar mensaje ───────────
  async sendCommunityMessage(
    slug: string,
    userId: string,
    dto: SendChatMessageDto,
  ) {
    const community = await this.prisma.community.findUnique({
      where: { slug, isActive: true },
      select: { id: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    // Verificar membresía
    const member = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId } },
    });
    if (!member) throw new ForbiddenException('Debes ser miembro para chatear');

    // Verificar silencio específico de la comunidad
    if (member.isSilenced) {
      const stillSilenced =
        !member.silencedUntil || member.silencedUntil > new Date();
      if (stillSilenced) {
        throw new ForbiddenException('Estás silenciado en esta comunidad');
      }
      await this.prisma.communityMember.update({
        where: { id: member.id },
        data: { isSilenced: false, silencedUntil: null },
      });
    }

    // Verificar que el usuario no esté silenciado globalmente
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isSilenced: true, silencedUntil: true },
    });
    if (user?.isSilenced) {
      const stillSilenced =
        !user.silencedUntil || user.silencedUntil > new Date();
      if (stillSilenced) {
        throw new ForbiddenException('Estás silenciado y no puedes enviar mensajes');
      }
      // Si el silencio expiró, quitarlo automáticamente
      await this.prisma.user.update({
        where: { id: userId },
        data: { isSilenced: false, silencedUntil: null },
      });
    }

    // Verificar replyToId si existe
    if (dto.replyToId) {
      const parent = await this.prisma.communityChat.findUnique({
        where: { id: dto.replyToId },
        select: { id: true },
      });
      if (!parent) throw new NotFoundException('Mensaje original no encontrado');
    }

    // Guardar en PostgreSQL primero — luego emitir
    const message = await this.prisma.communityChat.create({
      data: {
        communityId: community.id,
        userId,
        content: dto.content,
        replyToId: dto.replyToId ?? null,
      },
      select: {
        id: true,
        content: true,
        replyToId: true,
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

    // Actualizar lastActiveAt para marcarlo como en línea
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    });

    // Emitir al canal community:{communityId}
    await this.realtime.emitNewCommunityMessage(community.id, message);

    return message;
  }

  // ── DELETE /chat/community/:slug/message/:id ──────────────
  async deleteCommunityMessage(
    slug: string,
    messageId: string,
    userId: string,
    userRole: string,
  ) {
    const community = await this.prisma.community.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!community) throw new NotFoundException('Comunidad no encontrada');

    const message = await this.prisma.communityChat.findUnique({
      where: { id: messageId },
      select: { id: true, userId: true, communityId: true },
    });
    if (!message) throw new NotFoundException('Mensaje no encontrado');

    // Solo el autor, moderadores de la comunidad o roles globales pueden eliminar
    const isModerator = ['owner', 'moderador'].includes(userRole);
    const isAuthor = message.userId === userId;
    const isCommunityMod = await this.prisma.communityMember.findFirst({
      where: {
        communityId: community.id,
        userId,
        role: { in: ['creador', 'moderador'] },
      },
    });

    if (!isAuthor && !isModerator && !isCommunityMod) {
      throw new ForbiddenException('No tienes permiso para eliminar este mensaje');
    }

    await this.prisma.communityChat.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });

    // Emitir eliminación al canal
    await this.realtime.emitCommunityMessageDeleted(community.id, messageId);

    return { message: 'Mensaje eliminado' };
  }
}