import { Test } from '@nestjs/testing';
import { BackupsService } from '../backups/backups.service';
import { DatabaseService } from '../common/database.service';
import { InstancesService } from './instances.service';

describe('InstancesService', () => {
  let service: InstancesService;
  let db: DatabaseService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [DatabaseService, BackupsService, InstancesService],
    }).compile();

    service = moduleRef.get(InstancesService);
    db = moduleRef.get(DatabaseService);
    db.run('DELETE FROM backups');
    db.run('DELETE FROM instances');
  });

  afterEach(() => {
    db.run('DELETE FROM backups');
    db.run('DELETE FROM instances');
    db.onModuleDestroy();
  });

  it('creates instance and returns docker compose preview', () => {
    const instance = service.create({
      name: 'mysql_001',
      engine: 'mysql',
      version: '8.4',
      cpuLimit: 1,
      ramLimit: 1024,
      storageLimit: 20480,
      connectionLimit: 100,
      rootUser: 'root',
      password: 'password',
      databaseName: 'app_db',
      timezone: 'UTC',
      charset: 'utf8mb4',
      collation: 'utf8mb4_unicode_ci',
      containerPort: 3306,
      hostPort: 3306,
      bindIp: '0.0.0.0',
      whitelistIp: '0.0.0.0/0',
    });

    expect(instance.status).toBe('stopped');

    const preview = service.getComposePreview(instance.id);
    expect(preview.yaml).toContain('image: mysql:8.4');
    expect(preview.yaml).toContain('MYSQL_ROOT_PASSWORD: password');
    expect(preview.yaml).toContain(
      '/opt/dbstack/mysql/mysql_001:/var/lib/mysql',
    );
  });

  it('updates status and records backup action', () => {
    const instance = service.create({
      name: 'pg_001',
      engine: 'postgresql',
      version: '16',
      cpuLimit: 1,
      ramLimit: 1024,
      storageLimit: 20480,
      connectionLimit: 120,
      rootUser: 'postgres',
      password: 'secret',
      databaseName: 'analytics',
      timezone: 'UTC',
      charset: 'utf8',
      collation: 'en_US.utf8',
      containerPort: 5432,
      hostPort: 5432,
      bindIp: '127.0.0.1',
      whitelistIp: '10.0.0.0/24',
    });

    service.act(instance.id, { action: 'start' });
    service.act(instance.id, { action: 'backup' });

    const updated = service.findById(instance.id);
    expect(updated.status).toBe('running');

    const backups = db.query<{ id: string }>(
      'SELECT id FROM backups WHERE instanceId = ?',
      [instance.id],
    );
    expect(backups).toHaveLength(1);
  });
});
