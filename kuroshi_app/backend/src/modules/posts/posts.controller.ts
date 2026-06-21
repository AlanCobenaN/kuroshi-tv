import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { SharePostDto } from './dto/posts.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get(':id')
  @UseGuards(OptionalJwtGuard)
  @ApiOperation({ summary: 'Obtener una publicación por ID (para preview al compartir)' })
  getPostById(
    @Param('id') id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.postsService.getPostById(id, userId);
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Compartir una publicación en el perfil o en una comunidad' })
  sharePost(
    @Param('id') id: string,
    @Body() dto: SharePostDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.postsService.sharePost(userId, id, dto);
  }
}
