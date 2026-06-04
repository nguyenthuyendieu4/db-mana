import { Controller, Get } from '@nestjs/common';

@Controller('api')
export class AppController {
  @Get('health')
  health() {
    return {
      service: 'dbstack-manager-backend',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
