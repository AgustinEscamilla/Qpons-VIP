import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { resolve } from 'node:path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : process.env.NODE_ENV === 'production' ? false : true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.setGlobalPrefix('api');
  // Sirve públicamente las imágenes de cupones con nombres aleatorios no predecibles.
  app.useStaticAssets(resolve(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  await app.listen(Number(process.env.PORT ?? 3000), '0.0.0.0');
}
await bootstrap();
