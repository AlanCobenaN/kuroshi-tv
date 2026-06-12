import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { SendChatMessageDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // POST /api/chat/community/:slug
  @Post('community/:slug')
  @ApiOperation({ summary: 'Enviar mensaje al chat de comunidad. Requiere ser miembro.' })
  sendMessage(
    @Param('slug') slug: string,
    @Body() dto: SendChatMessageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.sendCommunityMessage(slug, userId, dto);
  }

  // DELETE /api/chat/community/:slug/message/:id
  @Delete('community/:slug/message/:id')
  @ApiOperation({ summary: 'Eliminar mensaje del chat. Autor, mod de comunidad o mod global.' })
  deleteMessage(
    @Param('slug') slug: string,
    @Param('id') messageId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.chatService.deleteCommunityMessage(slug, messageId, userId, userRole);
  }
}