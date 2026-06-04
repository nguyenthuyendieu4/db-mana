import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../common/database.service';
import { Backup } from './backups.types';

@Injectable()
export class BackupsService {
  constructor(private readonly db: DatabaseService) {}

  list(instanceId?: string): Backup[] {
    if (instanceId) {
      return this.db.query<Backup>(
        'SELECT * FROM backups WHERE instanceId = ? ORDER BY createdAt DESC',
        [instanceId],
      );
    }

    return this.db.query<Backup>('SELECT * FROM backups ORDER BY createdAt DESC');
  }

  create(
    instanceId: string,
    type: Backup['type'] = 'full',
    source: Backup['source'] = 'manual',
  ): Backup {
    const backup: Backup = {
      id: randomUUID(),
      instanceId,
      type,
      source,
      createdAt: new Date().toISOString(),
    };

    this.db.run(
      'INSERT INTO backups (id, instanceId, type, source, createdAt) VALUES (?, ?, ?, ?, ?)',
      [backup.id, backup.instanceId, backup.type, backup.source, backup.createdAt],
    );

    return backup;
  }
}
