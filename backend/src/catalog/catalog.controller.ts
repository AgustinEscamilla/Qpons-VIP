import { Controller, Get } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('categories')
  categories() { return this.catalog.categories(); }

  @Get('subcategories')
  subcategories() { return this.catalog.subcategories(); }

  @Get('cities')
  cities() { return this.catalog.cities(); }

  @Get('companies')
  companies() { return this.catalog.companies(); }

  @Get('stores')
  stores() { return this.catalog.stores(); }

  @Get('service-hours')
  serviceHours() { return this.catalog.serviceHours(); }

  @Get('coupons')
  coupons() { return this.catalog.coupons(); }

  @Get('alerts')
  alerts() { return this.catalog.alerts(); }

  @Get('store-config')
  storeConfig() { return this.catalog.storeConfig(); }
}
