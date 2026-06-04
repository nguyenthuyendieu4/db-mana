import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../common/database.service';
import { BackupsService } from '../backups/backups.service';
import {
  ComposePreview,
  CreateInstanceDto,
  DatabaseEngine,
  Instance,
  InstanceActionDto,
  InstanceStatus,
} from './instances.types';

@Injectable()
export class InstancesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly backupsService: BackupsService,
  ) {}

  list(): Instance[] {
    return this.db.query<Instance>(
      'SELECT * FROM instances ORDER BY createdAt DESC',
    );
  }

  create(dto: CreateInstanceDto): Instance {
    const exists = this.db.get<{ id: string }>(
      'SELECT id FROM instances WHERE name = ?',
      [dto.name],
    );
    if (exists) {
      throw new BadRequestException('Instance name already exists');
    }

    const now = new Date().toISOString();
    const id = randomUUID();

    this.db.run(
      `INSERT INTO instances (
        id, name, engine, version, status, hostPort, containerPort,
        cpuLimit, ramLimit, storageLimit, connectionLimit,
        rootUser, password, databaseName, timezone, charset, collation,
        bindIp, whitelistIp, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        dto.name,
        dto.engine,
        dto.version,
        'stopped',
        dto.hostPort,
        dto.containerPort,
        dto.cpuLimit,
        dto.ramLimit,
        dto.storageLimit,
        dto.connectionLimit,
        dto.rootUser,
        dto.password,
        dto.databaseName,
        dto.timezone,
        dto.charset,
        dto.collation,
        dto.bindIp,
        dto.whitelistIp,
        now,
      ],
    );

    return this.findById(id);
  }

  delete(id: string): void {
    const instance = this.findById(id);
    this.db.run('DELETE FROM backups WHERE instanceId = ?', [instance.id]);
    this.db.run('DELETE FROM instances WHERE id = ?', [id]);
  }

  act(id: string, dto: InstanceActionDto): Instance {
    const instance = this.findById(id);

    switch (dto.action) {
      case 'start':
        this.updateStatus(instance.id, 'running');
        break;
      case 'stop':
        this.updateStatus(instance.id, 'stopped');
        break;
      case 'restart':
        this.updateStatus(instance.id, 'running');
        break;
      case 'backup':
        this.backupsService.create(instance.id, 'full', 'manual');
        break;
      case 'restore':
        this.updateStatus(instance.id, 'warning');
        this.backupsService.create(instance.id, 'full', 'restore');
        break;
      case 'clone':
        this.createClone(instance);
        break;
      case 'upgrade':
        if (!dto.version) {
          throw new BadRequestException(
            'Version is required for upgrade action',
          );
        }
        this.db.run('UPDATE instances SET version = ? WHERE id = ?', [
          dto.version,
          instance.id,
        ]);
        this.updateStatus(instance.id, 'warning');
        break;
      default:
        throw new BadRequestException('Unsupported action');
    }

    return this.findById(id);
  }

  getComposePreview(id: string): ComposePreview {
    const instance = this.findById(id);
    const imageName =
      instance.engine === 'postgresql' ? 'postgres' : instance.engine;
    const serviceName = instance.name;
    const dataPath = `/opt/dbstack/${instance.engine}/${instance.name}`;

    let environment = `      MYSQL_ROOT_PASSWORD: ${instance.password}\n`;
    if (instance.engine === 'mariadb') {
      environment = `      MARIADB_ROOT_PASSWORD: ${instance.password}\n      MARIADB_DATABASE: ${instance.databaseName}\n`;
    }
    if (instance.engine === 'postgresql') {
      environment = `      POSTGRES_USER: ${instance.rootUser}\n      POSTGRES_PASSWORD: ${instance.password}\n      POSTGRES_DB: ${instance.databaseName}\n`;
    }

    const yaml = `services:\n  ${serviceName}:\n    image: ${imageName}:${instance.version}\n    container_name: ${serviceName}\n    restart: always\n\n    environment:\n${environment}    ports:\n      - "${instance.hostPort}:${instance.containerPort}"\n\n    volumes:\n      - ${dataPath}:${this.getContainerDataPath(instance.engine)}\n\n    networks:\n      - ${serviceName}_net\n\nnetworks:\n  ${serviceName}_net:\n    driver: bridge\n`;

    return {
      serviceName,
      engine: instance.engine,
      version: instance.version,
      yaml,
    };
  }

  findById(id: string): Instance {
    const instance = this.db.get<Instance>(
      'SELECT * FROM instances WHERE id = ?',
      [id],
    );
    if (!instance) {
      throw new NotFoundException('Instance not found');
    }
    return instance;
  }

  private updateStatus(id: string, status: InstanceStatus): void {
    this.db.run('UPDATE instances SET status = ? WHERE id = ?', [status, id]);
  }

  private createClone(instance: Instance): void {
    const cloneName = `${instance.name}_clone_${Date.now().toString().slice(-5)}`;
    this.create({
      ...instance,
      name: cloneName,
      hostPort: instance.hostPort + 100,
    });
  }

  private getContainerDataPath(engine: DatabaseEngine): string {
    if (engine === 'postgresql') {
      return '/var/lib/postgresql/data';
    }
    return '/var/lib/mysql';
  }
}
