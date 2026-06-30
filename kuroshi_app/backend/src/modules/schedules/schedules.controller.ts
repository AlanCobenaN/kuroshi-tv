import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Schedules')
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Calendario de emisión: próximos episodios agrupados por día' })
  getSchedule() {
    return this.schedulesService.getSchedule();
  }
}
