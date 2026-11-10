import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Subcategory } from './subcategory.entity.js';
import { Company } from './company.entity.js';

// Clasifica empresas para que el catalogo pueda agruparlas y filtrarlas.
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ nullable: true })
  image?: string;

  @Column({ type: 'jsonb', nullable: true })
  images?: unknown;

  @Column({ default: 0 })
  order!: number;

  @Column({ default: true })
  active!: boolean;

  @OneToMany(() => Subcategory, (subcategory) => subcategory.categoryId)
  subcategories!: Relation<Subcategory[]>;

  @ManyToMany(() => Company, (company) => company.categories)
  @JoinTable({
    name: 'category_companies',
    joinColumn: { name: 'categoryId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'companyId', referencedColumnName: 'id' },
  })
  companies!: Relation<Company[]>;
}
