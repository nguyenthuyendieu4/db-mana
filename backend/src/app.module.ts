import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { BackupsController } from './backups/backups.controller';
import { BackupsService } from './backups/backups.service';
import { DatabaseService } from './common/database.service';
import { InstancesController } from './instances/instances.controller';
import { InstancesService } from './instances/instances.service';
import { MonitoringController } from './monitoring/monitoring.controller';
import { TemplatesController } from './templates/templates.controller';
import { UsersController } from './users/users.controller';

@Module({
  imports: [],
  controllers: [
    AppController,
    InstancesController,
    BackupsController,
    MonitoringController,
    UsersController,
    TemplatesController,
  ],
  providers: [DatabaseService, BackupsService, InstancesService],
})
export class AppModule {}
