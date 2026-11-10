import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { Company, User, UserRole } from '../database/entities/index.js';
import type {
  AuthenticatedUser,
  LoginInput,
  RegisterInput,
  ResendRegistrationCodeInput,
  UpdateProfileInput,
  VerifyRegistrationInput,
} from './auth.types.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async register(input: RegisterInput) {
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    const phone = typeof input.phone === 'string' ? input.phone.trim() : '';
    const password = typeof input.password === 'string' ? input.password : '';
    if (name.length < 2 || !email || !phone || !password) throw new BadRequestException('Nombre, correo, telefono y contrasena son obligatorios');
    if (password.length < 8 || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      throw new BadRequestException('La contrasena requiere 8 caracteres, un numero y un simbolo');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new BadRequestException('Escribe un correo valido');
    const phoneDigits = phone.replace(/\D/g, '');
    if (!/^\+?[\d\s().-]+$/.test(phone) || phoneDigits.length < 10 || phoneDigits.length > 15) {
      throw new BadRequestException('Escribe un telefono valido con codigo de pais si aplica');
    }

    const role = input.role === UserRole.BUSINESS ? UserRole.BUSINESS : UserRole.CUSTOMER;
    const businessDescription = typeof input.businessDescription === 'string' ? input.businessDescription.trim() : '';
    const businessKeywords = typeof input.businessKeywords === 'string' ? input.businessKeywords.trim() : '';
    if (role === UserRole.BUSINESS) {
      if (businessDescription.length < 10 || businessDescription.length > 2000) throw new BadRequestException('La descripcion del negocio debe tener entre 10 y 2000 caracteres');
      if (businessKeywords.length < 2 || businessKeywords.length > 500) throw new BadRequestException('Agrega palabras clave del negocio (maximo 500 caracteres)');
    }
    if (await this.users.findOne({ where: { email } })) throw new ConflictException('El correo ya esta registrado');

    const code = this.createVerificationCode();
    const now = new Date();
    const user = this.users.create({
      name,
      email,
      phone,
      passwordHash: await bcrypt.hash(password, 12),
      role,
      active: false,
      emailVerified: false,
      registrationOtpHash: await bcrypt.hash(code, 10),
      registrationOtpExpiresAt: new Date(now.getTime() + 10 * 60 * 1000),
      registrationOtpAttempts: 0,
      registrationOtpResendAt: new Date(now.getTime() + 60 * 1000),
      ...(role === UserRole.BUSINESS ? { pendingBusinessProfile: { name, description: businessDescription, phone, keywords: businessKeywords } } : {}),
    });
    const savedUser = await this.users.save(user);
    try {
      const delivery = await this.deliverRegistrationCode(email, code);
      return { verificationRequired: true, email, ...(delivery.developmentCode ? { developmentCode: delivery.developmentCode } : {}) };
    } catch (error) {
      await this.users.delete(savedUser.id);
      throw error;
    }
  }

  async verifyRegistration(input: VerifyRegistrationInput) {
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    const code = typeof input.code === 'string' ? input.code.trim() : '';
    if (!email || !/^\d{6}$/.test(code)) throw new BadRequestException('Escribe el correo y el codigo de 6 digitos');
    const result = await this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const companyRepository = manager.getRepository(Company);
      const pendingUser = await userRepository.createQueryBuilder('user')
        .where('user.email = :email', { email })
        .setLock('pessimistic_write')
        .getOne();
      if (!pendingUser || pendingUser.emailVerified || !pendingUser.registrationOtpHash) {
        return { error: 'pending' as const };
      }
      if (!pendingUser.registrationOtpExpiresAt || pendingUser.registrationOtpExpiresAt.getTime() <= Date.now()) {
        return { error: 'expired' as const };
      }
      if (pendingUser.registrationOtpAttempts >= 5) {
        pendingUser.registrationOtpHash = null;
        await userRepository.save(pendingUser);
        return { error: 'locked' as const };
      }
      if (!(await bcrypt.compare(code, pendingUser.registrationOtpHash))) {
        pendingUser.registrationOtpAttempts += 1;
        if (pendingUser.registrationOtpAttempts >= 5) pendingUser.registrationOtpHash = null;
        await userRepository.save(pendingUser);
        return { error: 'invalid' as const };
      }
      pendingUser.emailVerified = true;
      pendingUser.active = true;
      pendingUser.registrationOtpHash = null;
      pendingUser.registrationOtpExpiresAt = null;
      pendingUser.registrationOtpResendAt = null;
      if (pendingUser.role === UserRole.BUSINESS) {
        const profile = pendingUser.pendingBusinessProfile;
        if (!profile) throw new BadRequestException('Faltan los datos del negocio; inicia de nuevo el registro');
        const company = await companyRepository.save(companyRepository.create({ ...profile, approvalStatus: 'pending' }));
        pendingUser.companyId = company;
        pendingUser.pendingBusinessProfile = null;
      }
      await userRepository.save(pendingUser);
      return { id: pendingUser.id };
    });
    if ('error' in result) {
      if (result.error === 'locked') throw new HttpException('Se agotaron los intentos. Solicita un codigo nuevo.', 429);
      if (result.error === 'expired') throw new UnauthorizedException('El codigo vencio. Solicita uno nuevo.');
      if (result.error === 'invalid') throw new UnauthorizedException('El codigo no es correcto');
      throw new UnauthorizedException('No hay un registro pendiente con ese correo');
    }
    const verifiedUser = await this.users.findOne({ where: { id: result.id }, relations: { companyId: true } });
    if (!verifiedUser) throw new UnauthorizedException('No encontramos la cuenta verificada');
    return this.createSession(verifiedUser);
  }

  async resendRegistrationCode(input: ResendRegistrationCodeInput) {
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new BadRequestException('Escribe un correo valido');
    const user = await this.users.findOne({ where: { email } });
    const genericResponse = { message: 'Si existe un registro pendiente, enviaremos un codigo al correo indicado.', email };
    if (!user || user.emailVerified || user.active) return genericResponse;
    if (user.registrationOtpResendAt && user.registrationOtpResendAt.getTime() > Date.now()) throw new HttpException('Espera un minuto antes de solicitar otro codigo', 429);

    const code = this.createVerificationCode();
    const previous = {
      hash: user.registrationOtpHash,
      expiresAt: user.registrationOtpExpiresAt,
      resendAt: user.registrationOtpResendAt,
      attempts: user.registrationOtpAttempts,
    };
    const now = new Date();
    user.registrationOtpHash = await bcrypt.hash(code, 10);
    user.registrationOtpExpiresAt = new Date(now.getTime() + 10 * 60 * 1000);
    user.registrationOtpResendAt = new Date(now.getTime() + 60 * 1000);
    user.registrationOtpAttempts = 0;
    await this.users.save(user);
    try {
      const delivery = await this.deliverRegistrationCode(email, code);
      return { ...genericResponse, ...(delivery.developmentCode ? { developmentCode: delivery.developmentCode } : {}) };
    } catch (error) {
      user.registrationOtpHash = previous.hash;
      user.registrationOtpExpiresAt = previous.expiresAt;
      user.registrationOtpResendAt = previous.resendAt;
      user.registrationOtpAttempts = previous.attempts;
      await this.users.save(user);
      throw error;
    }
  }

  async login(input: LoginInput) {
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    const password = typeof input.password === 'string' ? input.password : '';
    if (!email || !password) throw new BadRequestException('Correo y contrasena son obligatorios');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new BadRequestException('Escribe un correo valido');
    const user = await this.users.findOne({ where: { email }, relations: { companyId: true } });
    if (user && !user.emailVerified) throw new UnauthorizedException('Verifica tu correo antes de iniciar sesion');
    if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException('Correo o contrasena incorrectos');
    return this.createSession(user);
  }

  async updateProfile(authenticatedUser: AuthenticatedUser, input: UpdateProfileInput) {
    const user = await this.users.findOne({ where: { id: authenticatedUser.id }, relations: { companyId: true } });
    if (!user) throw new UnauthorizedException('No encontramos tu cuenta');

    if (input.name !== undefined) {
      const name = typeof input.name === 'string' ? input.name.trim() : '';
      if (name.length < 2 || name.length > 100) throw new BadRequestException('El nombre debe tener entre 2 y 100 caracteres');
      user.name = name;
    }
    if (input.phone !== undefined) {
      const phone = typeof input.phone === 'string' ? input.phone.trim() : '';
      const digits = phone.replace(/\D/g, '');
      if (phone && (!/^\+?[\d\s().-]+$/.test(phone) || digits.length < 10 || digits.length > 15)) {
        throw new BadRequestException('Escribe un teléfono válido con código de país si aplica');
      }
      user.phone = phone || null;
    }
    if (input.address !== undefined) {
      const address = typeof input.address === 'string' ? input.address.trim() : '';
      if (address.length > 255) throw new BadRequestException('La dirección no puede superar 255 caracteres');
      user.address = address || null;
    }
    if (input.latitude !== undefined || input.longitude !== undefined) {
      const latitude = input.latitude === null || input.latitude === undefined ? null : Number(input.latitude);
      const longitude = input.longitude === null || input.longitude === undefined ? null : Number(input.longitude);
      if (latitude === null && longitude === null) {
        user.latitude = null;
        user.longitude = null;
      } else {
        if (latitude === null || longitude === null || !Number.isFinite(latitude) || !Number.isFinite(longitude)
          || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          throw new BadRequestException('La ubicación enviada no es válida');
        }
        user.latitude = String(latitude);
        user.longitude = String(longitude);
      }
    }

    return this.toPublicUser(await this.users.save(user));
  }

  async updateProfilePhoto(authenticatedUser: AuthenticatedUser, imageUrl: string) {
    if (!this.isSupportedProfileImageUrl(imageUrl)) throw new BadRequestException('La dirección de la foto no es válida');
    const user = await this.users.findOne({ where: { id: authenticatedUser.id }, relations: { companyId: true } });
    if (!user) throw new UnauthorizedException('No encontramos tu cuenta');
    user.profileImageUrl = imageUrl;
    return { user: this.toPublicUser(await this.users.save(user)) };
  }

  /** Restringe las fotos de perfil al almacenamiento propio de desarrollo o Cloudinary HTTPS. */
  private isSupportedProfileImageUrl(imageUrl: string) {
    if (/^\/uploads\/profiles\/\d+\/[a-f0-9-]+\.(jpg|jpeg|png|webp|heic|heif|avif)$/i.test(imageUrl)) return true;
    try {
      const url = new URL(imageUrl);
      return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com';
    } catch {
      return false;
    }
  }

  async findById(id: number) {
    return this.users.findOne({ where: { id }, relations: { companyId: true } });
  }

  toPublicUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      ...(user.phone ? { phone: user.phone } : {}),
      ...(user.address ? { address: user.address } : {}),
      ...(user.profileImageUrl ? { profileImageUrl: user.profileImageUrl } : {}),
      ...(user.latitude ? { latitude: user.latitude } : {}),
      ...(user.longitude ? { longitude: user.longitude } : {}),
      role: user.role,
      ...(user.companyId?.id ? { companyId: user.companyId.id } : {}),
      ...(user.companyId?.approvalStatus ? { businessApprovalStatus: user.companyId.approvalStatus } : {}),
    };
  }

  private async createSession(user: User) {
    const publicUser = this.toPublicUser(user);
    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { accessToken, user: publicUser };
  }

  private createVerificationCode() {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private async deliverRegistrationCode(email: string, code: string): Promise<{ developmentCode?: string }> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>('OTP_FROM_EMAIL');
    // El modo de prueba en producción solo revela códigos para correos autorizados explícitamente.
    const testModeEnabled = this.config.get<string>('OTP_TEST_MODE') === 'true';
    const testEmails = (this.config.get<string>('OTP_TEST_EMAILS') || '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    if (testModeEnabled && testEmails.includes(email.toLowerCase())) {
      return { developmentCode: code };
    }
    if (!apiKey) {
      const localOtpEnabled = this.config.get<string>('OTP_DEV_MODE') === 'true'
        && this.config.get<string>('NODE_ENV') !== 'production';
      if (localOtpEnabled) return { developmentCode: code };
      throw new ServiceUnavailableException('El envio de correo no esta configurado; habilita el modo de prueba para un correo autorizado o configura Resend');
    }
    if (!from) throw new ServiceUnavailableException('Configura OTP_FROM_EMAIL para enviar codigos');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Tu codigo de verificacion de QPONS VIP',
        text: `Tu codigo de verificacion es ${code}. Vence en 10 minutos. Si no solicitaste esta cuenta, ignora este correo.`,
      }),
    });
    if (!response.ok) throw new ServiceUnavailableException('No se pudo enviar el correo de verificacion; intenta mas tarde');
    return {};
  }
}
