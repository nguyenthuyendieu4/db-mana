import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly db: Database.Database;

  constructor() {
    const dbPath = join(process.cwd(), 'data', 'dbstack.sqlite');
    const dbDir = dirname(dbPath);

    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.migrate();
    this.seedUsers();
  }

  query<T>(sql: string, params: unknown[] = []): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }

  get<T>(sql: string, params: unknown[] = []): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  run(sql: string, params: unknown[] = []): void {
    this.db.prepare(sql).run(...params);
  }

  onModuleDestroy(): void {
    this.db.close();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS instances (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        engine TEXT NOT NULL,
        version TEXT NOT NULL,
        status TEXT NOT NULL,
        hostPort INTEGER NOT NULL,
        containerPort INTEGER NOT NULL,
        cpuLimit REAL NOT NULL,
        ramLimit INTEGER NOT NULL,
        storageLimit INTEGER NOT NULL,
        connectionLimit INTEGER NOT NULL,
        rootUser TEXT NOT NULL,
        password TEXT NOT NULL,
        databaseName TEXT NOT NULL,
        timezone TEXT NOT NULL,
        charset TEXT NOT NULL,
        collation TEXT NOT NULL,
        bindIp TEXT NOT NULL,
        whitelistIp TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS backups (
        id TEXT PRIMARY KEY,
        instanceId TEXT NOT NULL,
        type TEXT NOT NULL,
        source TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY(instanceId) REFERENCES instances(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);
  }

  private seedUsers(): void {
    const totalUsers = this.get<{ total: number }>('SELECT COUNT(*) as total FROM users')?.total ?? 0;

    if (totalUsers > 0) {
      return;
    }

    const now = new Date().toISOString();
    this.run('INSERT INTO users (id, username, role, createdAt) VALUES (?, ?, ?, ?)', [
      'user-super-admin',
      'super-admin',
      'super-admin',
      now,
    ]);
    this.run('INSERT INTO users (id, username, role, createdAt) VALUES (?, ?, ?, ?)', [
      'user-operator',
      'operator',
      'operator',
      now,
    ]);
    this.run('INSERT INTO users (id, username, role, createdAt) VALUES (?, ?, ?, ?)', [
      'user-read-only',
      'read-only',
      'read-only',
      now,
    ]);
  }
}
