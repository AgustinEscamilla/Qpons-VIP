import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Company } from './company.entity.js';
import { Store } from './store.entity.js';

// Intervalo de apertura asociado a una empresa o a una sucursal concreta.
@Entity('service_hours')
export class ServiceHour {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  dayOfWeek!: string;

  @Column({ type: 'time', nullable: true })
  openingTime?: string;

  @Column({ type: 'time', nullable: true })
  closingTime?: string;

  @ManyToOne(() => Company, (company) => company.service_hours, { nullable: true })
  @JoinColumn({ name: 'companyId' })
  companyId?: Relation<Company>;

  @ManyToOne(() => Store, (store) => store.service_hours, { nullable: true })
  @JoinColumn({ name: 'storeId' })
  storeId?: Relation<Store>;
}
