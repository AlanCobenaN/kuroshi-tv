import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { WebSocket as WebSocketConstructor } from 'ws';
import type { WebSocketLikeConstructor } from '@supabase/realtime-js';

@Injectable()
export class RealtimeService implements OnModuleInit {
  private readonly logger = new Logger(RealtimeService.name);
  private supabase: SupabaseClient;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_SERVICE_KEY');

    if (!url || !key || key === 'placeholder') {
      this.logger.warn(
        'Supabase no configurado. Realtime deshabilitado. ' +
        'Configura SUPABASE_URL y SUPABASE_SERVICE_KEY en el .env',
      );
      return;
    }

    this.supabase = createClient(url, key, {
      auth: { persistSession: false },
      realtime: { transport: WebSocketConstructor as unknown as WebSocketLikeConstructor },
    });

    this.logger.log('Supabase Realtime inicializado');
  }

  // ── Canal episode:{id} ────────────────────────────────────
  // Emite cuando se crea un comentario nuevo en un episodio
  async emitNewEpisodeComment(episodeId: string, comment: any) {
    if (!this.supabase) return;

    await this.supabase
      .channel(`episode:${episodeId}`)
      .send({
        type: 'broadcast',
        event: 'new_comment',
        payload: {
          id: comment.id,
          content: comment.content,
          video_minute: comment.videoMinute,
          likes_count: comment.likesCount,
          has_spoiler: comment.hasSpoiler,
          created_at: comment.createdAt,
          user: comment.user,
        },
      });
  }

  // Emite cuando un comentario de episodio recibe un like
  async emitEpisodeCommentLiked(episodeId: string, commentId: string, likesCount: number) {
    if (!this.supabase) return;

    await this.supabase
      .channel(`episode:${episodeId}`)
      .send({
        type: 'broadcast',
        event: 'comment_liked',
        payload: { comment_id: commentId, likes_count: likesCount },
      });
  }

  // Emite cuando un moderador elimina un comentario de episodio
  async emitEpisodeCommentDeleted(episodeId: string, commentId: string) {
    if (!this.supabase) return;

    await this.supabase
      .channel(`episode:${episodeId}`)
      .send({
        type: 'broadcast',
        event: 'comment_deleted',
        payload: { comment_id: commentId },
      });
  }

  // ── Canal community:{id} ──────────────────────────────────
  // Emite cuando se envía un mensaje en el chat de una comunidad
  async emitNewCommunityMessage(communityId: string, message: any) {
    if (!this.supabase) return;

    await this.supabase
      .channel(`community:${communityId}`)
      .send({
        type: 'broadcast',
        event: 'new_message',
        payload: {
          id: message.id,
          content: message.content,
          reply_to_id: message.replyToId ?? null,
          created_at: message.createdAt,
          reply_to: message.replyTo
            ? { id: message.replyTo.id, content: message.replyTo.content, user: { username: message.replyTo.user.username, avatar_url: message.replyTo.user.avatarUrl } }
            : null,
          user: {
            id: message.user.id,
            username: message.user.username,
            avatar_url: message.user.avatarUrl,
            role: message.user.role,
          },
        },
      });
  }

  // Emite cuando un moderador elimina un mensaje del chat
  async emitCommunityMessageDeleted(communityId: string, messageId: string) {
    if (!this.supabase) return;

    await this.supabase
      .channel(`community:${communityId}`)
      .send({
        type: 'broadcast',
        event: 'message_deleted',
        payload: { message_id: messageId, is_deleted: true },
      });
  }

  // ── Canal user:{id} ───────────────────────────────────────
  // Emite notificación push al usuario sin necesidad de recargar la página
  async emitNotification(userId: string, notification: any) {
    if (!this.supabase) return;

    await this.supabase
      .channel(`user:${userId}`)
      .send({
        type: 'broadcast',
        event: 'notification',
        payload: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          is_read: notification.isRead,
          metadata: notification.metadata,
          created_at: notification.createdAt,
        },
      });
  }
}