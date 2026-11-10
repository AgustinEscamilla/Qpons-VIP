import { Controller, Get, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class DatabaseHealthController {
  private readonly logger = new Logger(DatabaseHealthController.name);

  constructor(private readonly dataSource: DataSource) {}

  @Get('database')
  async database() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', database: 'up', engine: 'postgresql' };
    } catch (error) {
      // Guarda la causa en los logs del servidor sin exponerla al cliente.
      this.logger.error(
        'Falló la consulta de salud de PostgreSQL.',
        error instanceof Error ? error.stack : undefined,
      );
      return { status: 'degraded', database: 'down', engine: 'postgresql' };
    }
  }
}
