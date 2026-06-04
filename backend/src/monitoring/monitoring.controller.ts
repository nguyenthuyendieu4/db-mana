import { Controller, Get } from '@nestjs/common';
import os from 'node:os';

@Controller('api/monitoring')
export class MonitoringController {
  @Get('overview')
  overview() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      server: {
        cpuCores: os.cpus().length,
        loadAverage: os.loadavg()[0],
        ramUsedPercent: Number(((usedMemory / totalMemory) * 100).toFixed(2)),
        ramTotalGb: Number((totalMemory / 1024 / 1024 / 1024).toFixed(2)),
      },
      database: {
        connections: 12,
        queriesPerSecond: 148,
        transactionsPerSecond: 73,
        cacheHitRate: 96.2,
        slowQueries: 1,
      },
      docker: {
        status: 'running',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
