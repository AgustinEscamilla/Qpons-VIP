import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { City } from './city.entity.js';
import { Store } from './store.entity.js';
import { Category } from './category.entity.js';
import { Subcategory } from './subcategory.entity.js';
import { ServiceHour } from './service-hour.entity.js';
import { User } from './user.entity.js';

// Perfil comercial de una empresa; agrupa sus sucursales y preferencias publicas.
@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ nullable: true })
  companyId?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ nullable: true })
  facebook?: string;

  @Column({ nullable: true })
  instagram?: string;

  @Column({ nullable: true })
  tiktok?: string;

  @Column({ type: 'text', nullable: true })
  keywords?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 20, default: 'approved' })
  approvalStatus!: 'pending' | 'approved' | 'rejected';

  @Column({ type: 'jsonb', nullable: true })
  publicProfileLayout?: {
    theme: string;
    blocks: Array<{ id: string; visible: boolean }>;
    content?: { text: string; imageUrl: string; imageAlt: string; videoUrl: string; videoTitle: string; highlights: string };
    sales?: { title: string; description: string; buttonLabel: string; featuredCouponId: number | null };
  };

  @ManyToMany(() => City, (city) => city.company_ids)
  cityIds!: Relation<City[]>;

  @OneToMany(() => Store, (store) => store.companyId)
  storesId!: Relation<Store[]>;

  @ManyToMany(() => Category, (category) => category.companies)
  categories!: Relation<Category[]>;

  @ManyToMany(() => Subcategory, (subcategory) => subcategory.companies)
  subcategories!: Relation<Subcategory[]>;

  @OneToMany(() => ServiceHour, (serviceHour) => serviceHour.companyId)
  service_hours!: Relation<ServiceHour[]>;

  @OneToMany(() => User, (user) => user.companyId)
  users!: Relation<User[]>;
}
