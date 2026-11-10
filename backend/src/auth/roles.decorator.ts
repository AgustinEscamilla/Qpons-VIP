import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../database/entities/index.js';

export const ROLES_KEY = 'qpons_roles';

// Declara qué roles pueden utilizar una ruta protegida.
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
