import * as Location from 'expo-location';

function getAddressLabel(place) {
  const street = [place.streetNumber, place.street].filter(Boolean).join(' ');
  return [street, place.city || place.subregion, place.region, place.postalCode]
    .filter(Boolean)
    .join(', ');
}

export async function getCurrentCustomerLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('Activa el permiso de ubicación para encontrar negocios cercanos.');
  }

  let position;
  try {
    position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  } catch {
    throw new Error('No se pudo obtener tu ubicación. Revisa que el GPS esté activado.');
  }

  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  let address = '';
  let place = null;
  if (Location.reverseGeocodeAsync && typeof document === 'undefined') {
    try {
      [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (place) address = getAddressLabel(place);
    } catch {
      // La coordenada sigue sirviendo aunque el proveedor no devuelva una dirección.
    }
  }

  const cityLabel = [place?.city || place?.subregion, place?.region].filter(Boolean).join(', ');
  return {
    latitude,
    longitude,
    address,
    label: cityLabel || 'Mi ubicación',
    cityId: null,
    source: 'gps',
  };
}

export function createCityLocation(city) {
  return {
    latitude: Number(city.latitude),
    longitude: Number(city.longitude),
    address: '',
    label: city.name,
    cityId: city.id,
    source: 'city',
  };
}

export function getDefaultCustomerLocation(cities = []) {
  const defaultCity = cities.find((city) => city.name?.toLocaleLowerCase('es-MX').includes('mcallen'));
  if (!defaultCity) return null;
  return { ...createCityLocation(defaultCity), source: 'default' };
}

export function customerLocationFromUser(user) {
  const latitude = Number(user?.latitude);
  const longitude = Number(user?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    latitude,
    longitude,
    address: user.address || '',
    label: user.address?.split(',').slice(-2).join(',').trim() || 'Mi ubicación guardada',
    cityId: null,
    source: 'profile',
  };
}

export function distanceKm(from, to) {
  const latitude = Number(to?.latitude);
  const longitude = Number(to?.longitude);
  const originLatitude = Number(from?.latitude);
  const originLongitude = Number(from?.longitude);
  if (![latitude, longitude, originLatitude, originLongitude].every(Number.isFinite)) return null;

  const radians = (degrees) => (degrees * Math.PI) / 180;
  const deltaLatitude = radians(latitude - originLatitude);
  const deltaLongitude = radians(longitude - originLongitude);
  const arc = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(radians(originLatitude)) * Math.cos(radians(latitude)) * Math.sin(deltaLongitude / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

export function sortStoresByDistance(stores, location) {
  if (!location) return stores;
  return [...stores].sort((first, second) => {
    const firstDistance = distanceKm(location, first);
    const secondDistance = distanceKm(location, second);
    if (firstDistance === null) return secondDistance === null ? 0 : 1;
    if (secondDistance === null) return -1;
    return firstDistance - secondDistance;
  });
}
