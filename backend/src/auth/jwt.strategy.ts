import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service.js';
import { JwtPayload } from './auth.types.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'change-this-development-secret'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.authService.findById(payload.sub);

    if (!user || !user.active) {
      throw new UnauthorizedException('La sesión ya no es válida');
    }

    return this.authService.toPublicUser(user);
  }
}
