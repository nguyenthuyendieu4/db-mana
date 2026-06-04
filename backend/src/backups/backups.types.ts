export interface Backup {
  id: string;
  instanceId: string;
  type: 'full' | 'physical';
  source: 'manual' | 'restore';
  createdAt: string;
}
