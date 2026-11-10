import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseEntities } from '../entities/index.js';

// Encapsula la conexión Postgres y concentra su configuración en variables de entorno.
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const connectionString = config.get<string>('DATABASE_URL');
        const isProduction = config.get<string>('NODE_ENV') === 'production';

        return {
          type: 'postgres' as const,
          // Evita que una conexión caída deje la función serverless esperando varios minutos.
          connectTimeoutMS: 10_000,
          retryAttempts: 2,
          retryDelay: 1_000,
          ...(connectionString
            ? { url: connectionString }
            : {
                host: config.get<string>('DB_HOST', '127.0.0.1'),
                port: config.get<number>('DB_PORT', 5432),
                username: config.get<string>('DB_USERNAME', 'postgres'),
                password: config.get<string>('DB_PASSWORD'),
                database: config.get<string>('DB_NAME', 'qpons'),
              }),
          ssl: config.get<string>('DB_SSL') === 'true' ? true : undefined,
          entities: databaseEntities,
          // En producción se requiere activar el sync solo al inicializar una base vacía.
          synchronize: config.get('DB_SYNCHRONIZE', isProduction ? 'false' : 'true') === 'true',
        };
      },
    }),
  ],
})
export class DatabaseModule {}
