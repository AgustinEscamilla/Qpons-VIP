import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  Alert,
  Category,
  City,
  Company,
  Coupon,
  ServiceHour,
  Store,
  StoreConfig,
  Subcategory,
} from '../database/entities/index.js';

@Injectable()
export class CatalogService {
  constructor(private readonly dataSource: DataSource) {}

  categories() {
    return this.dataSource.getRepository(Category).find({
      relations: { subcategories: true, companies: true },
    });
  }

  subcategories() {
    return this.dataSource.getRepository(Subcategory).find({
      relations: { categoryId: true, companies: true },
    });
  }

  cities() {
    return this.dataSource.getRepository(City).find({
      relations: { company_ids: true, stores: true },
    });
  }

  companies() {
    return this.dataSource.getRepository(Company).find({
      where: { approvalStatus: 'approved' },
      relations: {
        cityIds: true,
        storesId: true,
        categories: true,
        subcategories: true,
        service_hours: true,
      },
    });
  }

  stores() {
    return this.dataSource.getRepository(Store).createQueryBuilder('store')
      .leftJoinAndSelect('store.cityId', 'city')
      .leftJoinAndSelect('store.companyId', 'company')
      .leftJoinAndSelect('store.service_hours', 'serviceHour')
      .where('(company.id IS NULL OR company.approvalStatus = :status)', { status: 'approved' })
      .getMany();
  }

  coupons() {
    return this.dataSource.getRepository(Coupon).createQueryBuilder('coupon')
      .leftJoinAndSelect('coupon.storeId', 'store')
      .leftJoinAndSelect('store.cityId', 'city')
      .leftJoinAndSelect('store.companyId', 'company')
      .where('(store.id IS NULL OR company.id IS NULL OR company.approvalStatus = :status)', { status: 'approved' })
      .andWhere('(coupon.expiration IS NULL OR coupon.expiration::date >= CURRENT_DATE)')
      .orderBy('coupon.id', 'DESC')
      .getMany();
  }

  alerts() {
    return this.dataSource.getRepository(Alert).find({
      where: { active: true },
      order: { id: 'DESC' },
    });
  }

  storeConfig() {
    return this.dataSource.getRepository(StoreConfig).find({ take: 1 });
  }

  serviceHours() {
    return this.dataSource.getRepository(ServiceHour).find({
      relations: { companyId: true, storeId: true },
    });
  }
}
