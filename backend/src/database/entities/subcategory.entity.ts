import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Category } from './category.entity.js';
import { Company } from './company.entity.js';

// Refina una categoria y permite etiquetar empresas con actividades mas concretas.
@Entity('subcategories')
export class Subcategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ default: true })
  active!: boolean;

  @ManyToOne(() => Category, (category) => category.subcategories, { nullable: true })
  @JoinColumn({ name: 'categoryId' })
  categoryId?: Relation<Category>;

  @ManyToMany(() => Company, (company) => company.subcategories)
  @JoinTable({
    name: 'company_subcategories',
    joinColumn: { name: 'subcategoryId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'companyId', referencedColumnName: 'id' },
  })
  companies!: Relation<Company[]>;
}
