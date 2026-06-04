import { Controller, Get } from '@nestjs/common';

@Controller('api/templates')
export class TemplatesController {
  @Get()
  list() {
    return [
      {
        id: 'mysql-prod',
        name: 'MySQL Production',
        engine: 'mysql',
        profile: 'production',
      },
      {
        id: 'mysql-dev',
        name: 'MySQL Development',
        engine: 'mysql',
        profile: 'development',
      },
      {
        id: 'mariadb-ecommerce',
        name: 'MariaDB Ecommerce',
        engine: 'mariadb',
        profile: 'ecommerce',
      },
      {
        id: 'postgres-analytics',
        name: 'PostgreSQL Analytics',
        engine: 'postgresql',
        profile: 'analytics',
      },
    ];
  }
}
