import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Company } from './company.entity.js';

export enum UserRole {
  CUSTOMER = 'customer',
  BUSINESS = 'business',
  ADMIN = 'admin',
}

// Cuenta de usuario y datos de autenticaci?n y ubicaci?n del cliente.
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  // Número de contacto capturado al crear una cuenta.
  @Column({ type: 'varchar', nullable: true })
  phone?: string | null;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  address?: string | null;

  @Column({ type: 'varchar', nullable: true, length: 512 })
  profileImageUrl?: string | null;

  @Column({ type: 'varchar', nullable: true, length: 40 })
  latitude?: string | null;

  @Column({ type: 'varchar', nullable: true, length: 40 })
  longitude?: string | null;

  @Column()
  passwordHash!: string;

  @Column({ type: 'varchar', length: 20, default: UserRole.CUSTOMER })
  role!: UserRole;

  @Column({ default: true })
  active!: boolean;

  @Column({ default: true })
  emailVerified!: boolean;

  @Column({ type: 'varchar', length: 60, nullable: true })
  registrationOtpHash?: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  registrationOtpExpiresAt?: Date | null;

  @Column({ type: 'int', default: 0 })
  registrationOtpAttempts!: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  registrationOtpResendAt?: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  pendingBusinessProfile?: { name: string; description: string; phone: string; keywords: string } | null;

  @ManyToOne(() => Company, (company) => company.users, { nullable: true })
  @JoinColumn({ name: 'companyId' })
  companyId?: Relation<Company>;
}
