import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Valida el token Bearer antes de permitir entrar a una ruta protegida.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
