export type DatabaseEngine = 'mysql' | 'mariadb' | 'postgresql';
export type InstanceStatus = 'running' | 'stopped' | 'warning';

export interface CreateInstanceDto {
  name: string;
  engine: DatabaseEngine;
  version: string;
  cpuLimit: number;
  ramLimit: number;
  storageLimit: number;
  connectionLimit: number;
  rootUser: string;
  password: string;
  databaseName: string;
  timezone: string;
  charset: string;
  collation: string;
  containerPort: number;
  hostPort: number;
  bindIp: string;
  whitelistIp: string;
}

export interface Instance extends CreateInstanceDto {
  id: string;
  status: InstanceStatus;
  createdAt: string;
}

export type InstanceAction =
  | 'start'
  | 'stop'
  | 'restart'
  | 'backup'
  | 'restore'
  | 'clone'
  | 'upgrade';

export interface InstanceActionDto {
  action: InstanceAction;
  version?: string;
}

export interface ComposePreview {
  serviceName: string;
  engine: DatabaseEngine;
  version: string;
  yaml: string;
}
