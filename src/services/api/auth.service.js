import { Platform } from 'react-native';
import { apiGet, apiPatch, apiPost, apiUpload } from './client.js';

// Servicios de autenticación para que la navegación dependa del rol real.
export const authApi = {
  login: (email, password) => apiPost('/auth/login', { email, password }),
  register: (payload) => apiPost('/auth/register', payload),
  verifyRegistration: (email, code) => apiPost('/auth/verify-registration', { email, code }),
  resendRegistrationCode: (email) => apiPost('/auth/resend-registration-code', { email }),
  me: (token) => apiGet('/auth/me', token),
  updateProfile: (token, payload) => apiPatch('/auth/profile', payload, token),
  uploadProfilePhoto: async (token, asset) => {
    const formData = new FormData();
    const fileName = asset.fileName || asset.uri?.split('/').pop() || 'profile.jpg';
    if (Platform.OS === 'web') {
      const file = asset.file || await (await fetch(asset.uri)).blob();
      formData.append('image', file, fileName);
    } else {
      formData.append('image', {
        uri: asset.uri,
        name: fileName,
        type: asset.mimeType || 'image/jpeg',
      });
    }
    return apiUpload('/auth/profile/photo', formData, token);
  },
  businessProfile: (token) => apiGet('/business/me', token),
};
