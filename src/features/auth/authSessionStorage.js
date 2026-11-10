import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../../services/api/auth.service';

const AUTH_SESSION_KEY = 'qpons.vip.auth-session.v1';
const isWeb = Platform.OS === 'web';

// Usa almacenamiento persistente web y bóveda cifrada en las aplicaciones nativas.
async function readStoredValue() {
  return isWeb ? AsyncStorage.getItem(AUTH_SESSION_KEY) : SecureStore.getItemAsync(AUTH_SESSION_KEY);
}

async function writeStoredValue(value) {
  if (isWeb) return AsyncStorage.setItem(AUTH_SESSION_KEY, value);
  return SecureStore.setItemAsync(AUTH_SESSION_KEY, value);
}

async function removeStoredValue() {
  if (isWeb) return AsyncStorage.removeItem(AUTH_SESSION_KEY);
  return SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
}

// Guarda una sesión autenticada para que navegar o recargar no vuelva a pedir acceso.
export async function saveAuthSession(session, accountType) {
  if (!session?.accessToken || !session?.user) return;
  await writeStoredValue(JSON.stringify({ session, accountType }));
}

// Restaura el usuario desde el servidor y conserva la sesión si la API está temporalmente fuera de línea.
export async function restoreAuthSession() {
  const savedValue = await readStoredValue();
  if (!savedValue) return null;

  let savedSession;
  try {
    savedSession = JSON.parse(savedValue);
  } catch {
    await clearAuthSession();
    return null;
  }

  const { session, accountType } = savedSession || {};
  if (!session?.accessToken || !session?.user) {
    await clearAuthSession();
    return null;
  }

  try {
    const user = await authApi.me(session.accessToken);
    const refreshedSession = { ...session, user };
    await saveAuthSession(refreshedSession, accountType);
    return { session: refreshedSession, accountType: accountType || (user.role === 'business' ? 'business' : 'customer') };
  } catch (error) {
    // Un token vencido o revocado no debe dejar la interfaz en estado de sesión iniciada.
    if (/\b(401|403)\b/.test(error.message || '')) {
      await clearAuthSession();
      return null;
    }
    return { session, accountType: accountType || (session.user.role === 'business' ? 'business' : 'customer') };
  }
}

// Borra las credenciales al cerrar sesión o si el servidor invalida el token.
export async function clearAuthSession() {
  await removeStoredValue();
}
