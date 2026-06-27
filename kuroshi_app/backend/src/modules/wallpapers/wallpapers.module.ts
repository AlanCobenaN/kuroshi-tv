import { Module } from '@nestjs/common';
import { WallpapersService } from './wallpapers.service';
import { WallpapersController } from './wallpapers.controller';
import { WallpapersAdminController } from './wallpapers.admin.controller';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [UploadsModule],
  controllers: [WallpapersController, WallpapersAdminController],
  providers: [WallpapersService],
  exports: [WallpapersService],
})
export class WallpapersModule {}
