import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AppConfigModule } from './config/app-config.module.js';
import { DatabaseHealthController } from './database/database-health.controller.js';
import { DatabaseModule } from './database/connection/database.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BusinessModule } from './business/business.module.js';
import { StorageModule } from './storage/storage.module.js';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    CatalogModule,
    AuthModule,
    BusinessModule,
    StorageModule,
  ],
  controllers: [AppController, DatabaseHealthController],
  providers: [AppService],
})
export class AppModule {}
