import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Company } from './company.entity.js';
import { Store } from './store.entity.js';

// Guarda ciudades del catalogo y sus asociaciones con empresas y sucursales.
@Entity('cities')
export class City {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ nullable: true })
  code?: string;

  @Column({ nullable: true })
  latitude?: string;

  @Column({ nullable: true })
  longitude?: string;

  @Column({ nullable: true })
  phone?: string;

  @ManyToMany(() => Company, (company) => company.cityIds)
  @JoinTable({
    name: 'company_cities',
    joinColumn: { name: 'cityId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'companyId', referencedColumnName: 'id' },
  })
  company_ids!: Relation<Company[]>;

  @ManyToMany(() => Store, (store) => store.cityId)
  @JoinTable({
    name: 'city_stores',
    joinColumn: { name: 'cityId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'storeId', referencedColumnName: 'id' },
  })
  stores!: Relation<Store[]>;
}
