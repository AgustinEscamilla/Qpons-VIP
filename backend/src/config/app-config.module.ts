import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Carga .env una sola vez y comparte ConfigService con todos los modulos del backend.
@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  exports: [ConfigModule],
})
export class AppConfigModule {}
