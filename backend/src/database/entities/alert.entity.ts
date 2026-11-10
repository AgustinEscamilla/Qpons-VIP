import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Aviso general que el equipo puede publicar para los clientes de la app.
@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: 'jsonb', nullable: true })
  text?: unknown;

  @Column({ default: true })
  active!: boolean;

  @Column({ name: 'img_banner', nullable: true })
  img_banner?: string;
}
