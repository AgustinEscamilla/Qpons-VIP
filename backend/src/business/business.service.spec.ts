import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { Repository, DataSource } from 'typeorm';
import { Company, User, UserRole, Store, Coupon, ServiceHour, Alert, City } from '../database/entities/index.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { BusinessService } from './business.service.js';

function makeService(featuredCouponCompanyId = 12) {
  const company: Partial<Company> = { id: 12, publicProfileLayout: undefined };
  const companies = { save: vi.fn(async (value) => value) };
  const stores = {};
  const coupons = {
    findOne: vi.fn().mockResolvedValue({ storeId: { companyId: { id: featuredCouponCompanyId } } }),
  };
  const serviceHours = {};
  const alerts = {};
  const users = { findOne: vi.fn().mockResolvedValue({ companyId: company }) };
  const cities = {};
  const dataSource = {};
  const service = new BusinessService(
    companies as unknown as Repository<Company>,
    stores as unknown as Repository<Store>,
    coupons as unknown as Repository<Coupon>,
    serviceHours as unknown as Repository<ServiceHour>,
    alerts as unknown as Repository<Alert>,
    users as unknown as Repository<User>,
    cities as unknown as Repository<City>,
    dataSource as unknown as DataSource,
  );
  return { service, company, companies, coupons };
}

const owner: AuthenticatedUser = {
  id: 5,
  name: 'Dueña',
  email: 'owner@example.com',
  role: UserRole.BUSINESS,
  companyId: 12,
};

const profileLayout = {
  theme: 'forest',
  blocks: [
    { id: 'hero', visible: true },
    { id: 'contact', visible: true },
    { id: 'location', visible: true },
    { id: 'carousel', visible: true },
    { id: 'promotions', visible: true },
    { id: 'text', visible: true },
    { id: 'image', visible: true },
    { id: 'gallery', visible: false },
    { id: 'videos', visible: false },
    { id: 'highlights', visible: true },
    { id: 'hours', visible: true },
    { id: 'branches', visible: true },
    { id: 'terms', visible: true },
  ],
  content: {
    text: 'Ven a conocer nuestro menú de temporada.',
    imageUrl: '/uploads/coupons/abc123.jpg',
    imageAlt: 'Platillo de temporada',
    videoUrl: 'https://example.com/video',
    videoTitle: 'Conoce el restaurante',
    highlights: 'Terraza\nMúsica en vivo',
  },
  sales: {
    title: '  Ofertas de la semana  ',
    description: 'Promociones disponibles en nuestras sucursales.',
    buttonLabel: 'Ver promoción',
    featuredCouponId: 33,
  },
};

describe('BusinessService public profile editor', () => {
  it('saves a valid theme, block visibility/order and sales settings for the owned company', async () => {
    const { service, company, companies, coupons } = makeService();

    await service.savePublicProfileLayout(owner, profileLayout);

    expect(company.publicProfileLayout).toMatchObject({
      theme: 'forest',
      blocks: profileLayout.blocks,
      content: profileLayout.content,
      sales: {
        title: 'Ofertas de la semana',
        description: profileLayout.sales.description,
        buttonLabel: 'Ver promoción',
        featuredCouponId: 33,
      },
    });
    expect(coupons.findOne).toHaveBeenCalledWith({
      where: { id: 33 },
      relations: { storeId: { companyId: true } },
    });
    expect(companies.save).toHaveBeenCalledWith(company);
  });

  it('rejects featuring a coupon owned by another company', async () => {
    const { service, companies } = makeService(99);

    await expect(service.savePublicProfileLayout(owner, profileLayout))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(companies.save).not.toHaveBeenCalled();
  });
});
