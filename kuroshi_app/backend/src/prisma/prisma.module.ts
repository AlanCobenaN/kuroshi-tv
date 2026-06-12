import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()   // disponible en todos los módulos sin necesidad de importarlo explícitamente
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}