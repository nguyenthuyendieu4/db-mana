import { Body, Controller, Get, Post } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../common/database.service';

interface User {
  id: string;
  username: string;
  role: 'super-admin' | 'operator' | 'read-only';
  createdAt: string;
}

@Controller('api/users')
export class UsersController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  list() {
    return this.db.query<User>('SELECT * FROM users ORDER BY createdAt DESC');
  }

  @Post()
  create(@Body() body: { username: string; role: User['role'] }) {
    const user: User = {
      id: randomUUID(),
      username: body.username,
      role: body.role,
      createdAt: new Date().toISOString(),
    };

    this.db.run('INSERT INTO users (id, username, role, createdAt) VALUES (?, ?, ?, ?)', [
      user.id,
      user.username,
      user.role,
      user.createdAt,
    ]);

    return user;
  }
}
