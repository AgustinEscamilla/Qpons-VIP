import { UserRole } from '../database/entities/index.js';

export interface RegisterInput {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: UserRole;
  businessDescription?: string;
  businessKeywords?: string;
}

export interface VerifyRegistrationInput {
  email?: string;
  code?: string;
}

export interface ResendRegistrationCodeInput {
  email?: string;
}

export interface LoginInput {
  email?: string;
  password?: string;
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  profileImageUrl?: string;
  latitude?: string;
  longitude?: string;
  role: UserRole;
  companyId?: number;
  businessApprovalStatus?: 'pending' | 'approved' | 'rejected';
}

export interface JwtPayload {
  sub: number;
  role: UserRole;
}
