import { BadRequestException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { afterEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { DataSource, Repository } from 'typeorm';
import { Company, User, UserRole } from '../database/entities/index.js';
import { AuthService } from './auth.service.js';

function makeService(options: { configValues?: Record<string, string> } = {}) {
  const savedUsers: Partial<User>[] = [];
  const users = {
    findOne: vi.fn().mockResolvedValue(null),
    create: vi.fn((value) => value),
    save: vi.fn(async (value) => { savedUsers.push(value); return value; }),
    delete: vi.fn().mockResolvedValue(undefined),
  };
  const jwt = { signAsync: vi.fn().mockResolvedValue('test-access-token') };
  const values = options.configValues || { OTP_DEV_MODE: 'true', NODE_ENV: 'development' };
  const config = { get: vi.fn((key: string) => values[key]) };
  const dataSource = { transaction: vi.fn() };
  const service = new AuthService(
    users as unknown as Repository<User>,
    jwt as unknown as JwtService,
    config as unknown as ConfigService,
    dataSource as unknown as DataSource,
  );
  return { service, users, jwt, config, dataSource, savedUsers };
}

afterEach(() => vi.unstubAllGlobals());

describe('AuthService registration and verification', () => {
  it('normalizes email, hashes the password and returns a six-digit development OTP', async () => {
    const { service, users, savedUsers } = makeService();
    const result = await service.register({
      name: ' Ana Cliente ',
      email: ' ANA@EXAMPLE.COM ',
      phone: '+1 (956) 555-0142',
      password: 'SafePass!2026',
    });

    expect(result).toMatchObject({ verificationRequired: true, email: 'ana@example.com' });
    expect(result.developmentCode).toMatch(/^\d{6}$/);
    expect(users.findOne).toHaveBeenCalledWith({ where: { email: 'ana@example.com' } });
    expect(savedUsers[0]).toMatchObject({ name: 'Ana Cliente', email: 'ana@example.com', active: false, emailVerified: false });
    expect(savedUsers[0]?.passwordHash).not.toBe('SafePass!2026');
    expect(await bcrypt.compare('SafePass!2026', savedUsers[0]!.passwordHash!)).toBe(true);
  });

  it('rejects weak passwords before writing an account', async () => {
    const { service, users } = makeService();
    await expect(service.register({
      name: 'Ana', email: 'ana@example.com', phone: '+19565550142', password: 'weakpass',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(users.save).not.toHaveBeenCalled();
  });

  it('activates a verified business and creates its company as pending approval in the same transaction', async () => {
    const code = '042817';
    const pendingUser = {
      id: 17,
      email: 'owner@example.com',
      role: UserRole.BUSINESS,
      emailVerified: false,
      active: false,
      registrationOtpHash: await bcrypt.hash(code, 4),
      registrationOtpExpiresAt: new Date(Date.now() + 60_000),
      registrationOtpAttempts: 0,
      pendingBusinessProfile: { name: 'Café Norte', description: 'Café y pan artesanal', phone: '+19565550142', keywords: 'café, pan' },
    } as User;
    const transactionalUsers = {
      createQueryBuilder: vi.fn(() => {
        const builder = {
          where: vi.fn(() => builder),
          setLock: vi.fn(() => builder),
          getOne: vi.fn().mockResolvedValue(pendingUser),
        };
        return builder;
      }),
      save: vi.fn(async (value) => value),
    };
    const companyRepository = {
      create: vi.fn((value) => value),
      save: vi.fn(async (value) => ({ id: 31, ...value })),
    };
    const manager = {
      getRepository: vi.fn((entity) => entity === User ? transactionalUsers : entity === Company ? companyRepository : undefined),
    };
    const { service, users, jwt, dataSource } = makeService();
    vi.mocked(dataSource.transaction).mockImplementation(async (operation: any) => operation(manager));
    users.findOne.mockResolvedValue({
      id: pendingUser.id,
      name: 'Business Owner',
      email: pendingUser.email,
      role: pendingUser.role,
      emailVerified: true,
      active: true,
      registrationOtpHash: null,
      companyId: { id: 31, approvalStatus: 'pending' },
    } as User);

    const session = await service.verifyRegistration({ email: ' OWNER@example.com ', code });

    expect(session.user).toMatchObject({ role: UserRole.BUSINESS, companyId: 31, businessApprovalStatus: 'pending' });
    expect(companyRepository.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Café Norte', approvalStatus: 'pending' }));
    expect(pendingUser.emailVerified).toBe(true);
    expect(pendingUser.active).toBe(true);
    expect(pendingUser.pendingBusinessProfile).toBeNull();
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 17, role: UserRole.BUSINESS });
  });

  it('counts an invalid OTP attempt and does not create a session', async () => {
    const pendingUser = {
      id: 4,
      email: 'ana@example.com',
      emailVerified: false,
      registrationOtpHash: await bcrypt.hash('123456', 4),
      registrationOtpExpiresAt: new Date(Date.now() + 60_000),
      registrationOtpAttempts: 0,
    } as User;
    const transactionalUsers = {
      createQueryBuilder: vi.fn(() => {
        const builder = {
          where: vi.fn(() => builder),
          setLock: vi.fn(() => builder),
          getOne: vi.fn().mockResolvedValue(pendingUser),
        };
        return builder;
      }),
      save: vi.fn(async (value) => value),
    };
    const { service, dataSource, jwt } = makeService();
    const manager = { getRepository: vi.fn(() => transactionalUsers) };
    vi.mocked(dataSource.transaction).mockImplementation(async (operation: any) => operation(manager));

    await expect(service.verifyRegistration({ email: pendingUser.email, code: '654321' }))
      .rejects.toBeInstanceOf(UnauthorizedException);
    expect(pendingUser.registrationOtpAttempts).toBe(1);
    expect(transactionalUsers.save).toHaveBeenCalledOnce();
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('restores the attempt counter when resending an OTP fails', async () => {
    const user = {
      id: 9,
      email: 'ana@example.com',
      active: false,
      emailVerified: false,
      registrationOtpHash: 'previous-hash',
      registrationOtpExpiresAt: new Date(Date.now() + 300_000),
      registrationOtpResendAt: new Date(Date.now() - 1000),
      registrationOtpAttempts: 3,
    } as User;
    const { service, users } = makeService({ configValues: { RESEND_API_KEY: 'test-key', OTP_FROM_EMAIL: 'test@example.com' } });
    users.findOne.mockResolvedValue(user);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    await expect(service.resendRegistrationCode({ email: user.email }))
      .rejects.toBeInstanceOf(ServiceUnavailableException);

    expect(user.registrationOtpHash).toBe('previous-hash');
    expect(user.registrationOtpAttempts).toBe(3);
    expect(user.registrationOtpExpiresAt?.getTime()).toBeGreaterThan(Date.now());
  });
});
