import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { AuthModule } from './modules/auth/auth.module';
import { AnimeModule } from './modules/anime/anime.module';
import { UsersModule } from './modules/users/users.module';
import { CommunitiesModule } from './modules/communities/communities.module';
import { ChatModule } from './modules/chat/chat.module';
import { SearchModule } from './modules/search/search.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { AdminModule } from './modules/admin/admin.module';
import { GenresModule } from './modules/genres/genres.module';
import { PostsModule } from './modules/posts/posts.module';
import { ReportsModule } from './modules/reports/reports.module';
import { WallpapersModule } from './modules/wallpapers/wallpapers.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),
    PrismaModule,
    RealtimeModule,   // global — disponible en todos los módulos
    AuthModule,
    AnimeModule,
    UsersModule,
    CommunitiesModule,
    ChatModule,
    SearchModule,
    UploadsModule,
    AdminModule,
    GenresModule,
    PostsModule,
    ReportsModule,
    WallpapersModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}