// Exporta las entidades del esquema y la lista que registra TypeORM.
export { Category } from './category.entity.js';
export { Subcategory } from './subcategory.entity.js';
export { City } from './city.entity.js';
export { Company } from './company.entity.js';
export { Store } from './store.entity.js';
export { ServiceHour } from './service-hour.entity.js';
export { Coupon } from './coupon.entity.js';
export { Alert } from './alert.entity.js';
export { StoreConfig } from './store-config.entity.js';
export { User, UserRole } from './user.entity.js';

import { Category } from './category.entity.js';
import { Subcategory } from './subcategory.entity.js';
import { City } from './city.entity.js';
import { Company } from './company.entity.js';
import { Store } from './store.entity.js';
import { ServiceHour } from './service-hour.entity.js';
import { Coupon } from './coupon.entity.js';
import { Alert } from './alert.entity.js';
import { StoreConfig } from './store-config.entity.js';
import { User } from './user.entity.js';

export const databaseEntities = [Category, Subcategory, City, Company, Store, ServiceHour, Coupon, Alert, StoreConfig, User];
