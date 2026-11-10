import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class DatabaseHealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('database')
  async database() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', database: 'up', engine: 'postgresql' };
    } catch {
      return { status: 'degraded', database: 'down', engine: 'postgresql' };
    }
  }
}
