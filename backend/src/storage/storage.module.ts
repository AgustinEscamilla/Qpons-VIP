import { Global, Module } from '@nestjs/common';
import { MediaStorageService } from './media-storage.service.js';

/** Comparte el servicio de archivos entre autenticación y administración de negocios. */
@Global()
@Module({
  providers: [MediaStorageService],
  exports: [MediaStorageService],
})
export class StorageModule {}
