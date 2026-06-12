import { Global, Module } from '@nestjs/common';
import { RealtimeService } from './realtime.service';

// @Global() para que cualquier módulo pueda inyectar RealtimeService
// sin necesidad de importar RealtimeModule explícitamente
@Global()
@Module({
  providers: [RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}