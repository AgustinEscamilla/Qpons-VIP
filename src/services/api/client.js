// Cliente HTTP centralizado para que las pantallas no repitan lógica de fetch.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export async function apiGet(path, token) {
  const response = await fetch(`${API_BASE_URL}${path}`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);

  if (!response.ok) {
    throw new Error(`La API respondió con ${response.status}`);
  }

  return response.json();
}

export async function apiPost(path, payload, token) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new Error(message || `La API respondió con ${response.status}`);
  }

  return body;
}

// Actualiza recursos autenticados sin duplicar el manejo de errores HTTP.
export async function apiPatch(path, payload, token) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new Error(message || `La API respondió con ${response.status}`);
  }
  return body;
}

// Sube archivos multipart sin fijar Content-Type para que el runtime añada su boundary.
export async function apiUpload(path, formData, token) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor para subir la imagen.');
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new Error(message || `La API respondió con ${response.status}`);
  }
  return body;
}

// Convierte la ruta de PostgreSQL a una URL que el dispositivo pueda abrir.
export function getMediaUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const serverOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${serverOrigin}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
