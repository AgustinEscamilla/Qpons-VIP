import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Configuracion global del cliente movil, como nombre de app y versiones minimas.
@Entity('store_configs')
export class StoreConfig {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  app?: string;

  @Column({ name: 'version_number', type: 'jsonb', nullable: true })
  version_number?: unknown;
}

// Usuario de la aplicación. El rol controla qué partes del sistema puede utilizar.
