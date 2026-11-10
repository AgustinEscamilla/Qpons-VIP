import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { City } from './city.entity.js';
import { Company } from './company.entity.js';
import { Coupon } from './coupon.entity.js';
import { ServiceHour } from './service-hour.entity.js';

// Ubicacion fisica de una empresa, incluidas coordenadas, promociones y horarios.
@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ nullable: true })
  facebook?: string;

  @Column({ nullable: true })
  instagram?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'varchar', nullable: true })
  latitude?: string | null;

  @Column({ type: 'varchar', nullable: true })
  longitude?: string | null;

  @ManyToMany(() => City, (city) => city.stores)
  cityId!: Relation<City[]>;

  @ManyToOne(() => Company, (company) => company.storesId, { nullable: true })
  @JoinColumn({ name: 'companyId' })
  companyId?: Relation<Company>;

  @OneToMany(() => Coupon, (coupon) => coupon.storeId)
  coupons!: Relation<Coupon[]>;

  @OneToMany(() => ServiceHour, (serviceHour) => serviceHour.storeId)
  service_hours!: Relation<ServiceHour[]>;
}
