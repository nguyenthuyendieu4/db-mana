import { Controller, Get, Query } from '@nestjs/common';
import { BackupsService } from './backups.service';

@Controller('api/backups')
export class BackupsController {
  constructor(private readonly backupsService: BackupsService) {}

  @Get()
  list(@Query('instanceId') instanceId?: string) {
    return this.backupsService.list(instanceId);
  }
}
