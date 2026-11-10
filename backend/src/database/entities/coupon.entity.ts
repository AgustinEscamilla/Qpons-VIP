import { randomUUID } from 'node:crypto';
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Store } from './store.entity.js';

// Promocion visible en el catalogo, vinculada a la sucursal que la ofrece.
@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'documentId', unique: true })
  documentId!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  code?: string;

  @Column({ type: 'timestamptz', nullable: true })
  expiration?: Date;

  @Column({ type: 'text', nullable: true })
  terms?: string;

  @Column({ name: 'image_1', nullable: true })
  image_1?: string;

  @Column({ name: 'image_2', nullable: true })
  image_2?: string;

  @Column({ name: 'image_3', nullable: true })
  image_3?: string;

  @Column({ name: 'image_4', nullable: true })
  image_4?: string;

  @Column({ name: 'image_5', nullable: true })
  image_5?: string;

  @Column({ name: 'tiktok_video', nullable: true })
  tiktok_video?: string;

  @Column({ name: 'youtube_url_video', nullable: true })
  youtube_url_video?: string;

  @Column({ name: 'facebook_url_video', nullable: true })
  facebook_url_video?: string;

  @ManyToOne(() => Store, (store) => store.coupons, { nullable: true })
  @JoinColumn({ name: 'storeId' })
  storeId?: Relation<Store>;

  @BeforeInsert()
  generateDocumentId() {
    if (!this.documentId) {
      this.documentId = randomUUID();
    }
  }
}
