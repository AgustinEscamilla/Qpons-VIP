import { apiGet, apiPatch, apiPost, apiUpload } from './client.js';

// Consultas privadas del negocio; siempre requieren el token JWT de la sesión.
export const businessApi = {
  overview: (token) => apiGet('/business/overview', token),
  createCompany: (payload, token) => apiPost('/business/company', payload, token),
  updateCompany: (payload, token) => apiPatch('/business/company', payload, token),
  pendingCompanies: (token) => apiGet('/business/companies/pending', token),
  updateCompanyApproval: (companyId, status, token) => apiPatch(`/business/companies/${companyId}/approval`, { status }, token),
  savePublicProfileLayout: (payload, token) => apiPatch('/business/company/public-profile-layout', payload, token),
  createStore: (payload, token) => apiPost('/business/stores', payload, token),
  updateStore: (storeId, payload, token) => apiPatch(`/business/stores/${storeId}`, payload, token),
  createServiceHour: (payload, token) => apiPost('/business/service-hours', payload, token),
  saveWeeklySchedule: (payload, token) => apiPost('/business/service-hours/weekly', payload, token),
  createCoupon: (payload, token) => apiPost('/business/coupons', payload, token),
  updateCoupon: (couponId, payload, token) => apiPatch(`/business/coupons/${couponId}`, payload, token),
  uploadCouponImage: (asset, token) => {
    const formData = new FormData();
    if (asset.file) {
      formData.append('image', asset.file);
    } else {
      formData.append('image', {
        uri: asset.uri,
        name: asset.fileName || `cupon-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });
    }
    return apiUpload('/business/coupons/image', formData, token);
  },
};
