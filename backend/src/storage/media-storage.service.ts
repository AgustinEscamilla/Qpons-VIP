import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

type UploadedImage = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

/** Guarda medios en Cloudinary en producción y en uploads local durante desarrollo. */
@Injectable()
export class MediaStorageService {
  private readonly cloudinaryEnabled: boolean;
  private readonly production: boolean;

  constructor(config: ConfigService) {
    const cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME')?.trim();
    const apiKey = config.get<string>('CLOUDINARY_API_KEY')?.trim();
    const apiSecret = config.get<string>('CLOUDINARY_API_SECRET')?.trim();
    const configuredValues = [cloudName, apiKey, apiSecret].filter(Boolean).length;

    if (configuredValues > 0 && configuredValues < 3) {
      throw new Error('Configura CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET juntos.');
    }

    this.cloudinaryEnabled = configuredValues === 3;
    this.production = config.get<string>('NODE_ENV') === 'production';

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
    }
  }

  /** Devuelve una URL HTTPS permanente o una ruta local para desarrollo. */
  async saveImage(file: UploadedImage, folder: string): Promise<string> {
    if (!file?.buffer?.length) throw new BadRequestException('El archivo recibido no contiene una imagen.');

    const safeFolder = this.normalizeFolder(folder);
    if (this.cloudinaryEnabled) {
      const uploaded = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        { folder: `qpons/${safeFolder}`, resource_type: 'image' },
      );
      return uploaded.secure_url;
    }

    if (this.production) {
      throw new ServiceUnavailableException('El almacenamiento de imágenes no está configurado.');
    }

    return this.saveLocally(file, safeFolder);
  }

  private async saveLocally(file: UploadedImage, folder: string) {
    const extension = extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 8) || '.jpg';
    const filename = `${randomUUID()}${extension}`;
    const destination = join(process.cwd(), 'uploads', folder);

    await mkdir(destination, { recursive: true });
    await writeFile(join(destination, filename), file.buffer);

    return `/uploads/${folder}/${filename}`;
  }

  private normalizeFolder(folder: string) {
    const segments = folder
      .split('/')
      .map((segment) => segment.replace(/[^a-z0-9_-]/gi, ''))
      .filter(Boolean);

    if (segments.length === 0) throw new BadRequestException('La carpeta de almacenamiento no es válida.');
    return segments.join('/');
  }
}
