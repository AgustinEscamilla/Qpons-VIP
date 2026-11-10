// Funciones de acceso al catálogo que corresponden a las tablas de PostgreSQL.
import { apiGet } from './client.js';

export const catalogApi = {
  health: () => apiGet('/health/database'),
  categories: () => apiGet('/categories'),
  subcategories: () => apiGet('/subcategories'),
  cities: () => apiGet('/cities'),
  companies: () => apiGet('/companies'),
  stores: () => apiGet('/stores'),
  serviceHours: () => apiGet('/service-hours'),
  coupons: () => apiGet('/coupons'),
  alerts: () => apiGet('/alerts'),
  storeConfig: () => apiGet('/store-config'),
};
