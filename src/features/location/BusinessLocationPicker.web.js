import React from 'react';
import Constants from 'expo-constants';
import { Text, View } from 'react-native';
import { colors as C } from '../../shared/theme/colors.js';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || Constants.expoConfig?.extra?.googleMapsApiKey || '';
const MCCALLEN = { lat: 26.2034, lng: -98.2300 };
let mapsPromise;
const authFailureListeners = new Set();

// Google calls this global callback when it rejects the browser API key.
function reportGoogleMapsAuthFailure() {
  authFailureListeners.forEach((listener) => listener());
}

function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (mapsPromise) return mapsPromise;
  // Google reports key, billing, and API permission errors through this callback.
  window.gm_authFailure = reportGoogleMapsAuthFailure;
  mapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-qpons-google-maps]');
    const script = existing || document.createElement('script');
    script.dataset.qponsGoogleMaps = 'true';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => window.google?.maps ? resolve(window.google.maps) : reject(new Error('Google Maps no estuvo disponible.'));
    script.onerror = () => reject(new Error('No se pudo cargar Google Maps. Revisa que Maps JavaScript API esté habilitada para esta clave.'));
    if (!existing) document.head.appendChild(script);
  });
  return mapsPromise;
}

export default function BusinessLocationPicker({ latitude, longitude, initialLatitude, initialLongitude, address, name, onChange, desktop }) {
  const mapElement = React.useRef(null);
  const mapRef = React.useRef(null);
  const markerRef = React.useRef(null);
  const onChangeRef = React.useRef(onChange);
  const initialPropsRef = React.useRef({ latitude, longitude, initialLatitude, initialLongitude, address, name });
  const [mapError, setMapError] = React.useState(GOOGLE_MAPS_API_KEY ? '' : 'Falta EXPO_PUBLIC_GOOGLE_MAPS_API_KEY para cargar el mapa.');
  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasPin = latitude !== '' && latitude !== null && latitude !== undefined
    && longitude !== '' && longitude !== null && longitude !== undefined
    && Number.isFinite(lat) && Number.isFinite(lng);

  React.useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  React.useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return undefined;
    let active = true;
    let clickListener;
    let dragListener;
    const showAuthError = () => {
      if (active) setMapError('Google rechazó la clave del mapa. Revisa en Google Cloud la facturación, Maps JavaScript API y las restricciones para localhost.');
    };
    authFailureListeners.add(showAuthError);
    loadGoogleMaps().then((maps) => {
      if (!active || !mapElement.current) return;
      const initialProps = initialPropsRef.current;
      const currentLatitude = Number(initialProps.latitude);
      const currentLongitude = Number(initialProps.longitude);
      const center = Number.isFinite(currentLatitude) && Number.isFinite(currentLongitude)
        ? { lat: currentLatitude, lng: currentLongitude }
        : {
            lat: Number.isFinite(Number(initialProps.initialLatitude)) ? Number(initialProps.initialLatitude) : MCCALLEN.lat,
            lng: Number.isFinite(Number(initialProps.initialLongitude)) ? Number(initialProps.initialLongitude) : MCCALLEN.lng,
          };
      const map = new maps.Map(mapElement.current, { center, zoom: 14, mapTypeControl: true, streetViewControl: false, fullscreenControl: true });
      const marker = new maps.Marker({ map, position: Number.isFinite(currentLatitude) && Number.isFinite(currentLongitude) ? center : null, draggable: true, title: initialProps.name || 'Location of store' });
      const geocoder = new maps.Geocoder();
      const updatePoint = (point) => {
        if (!point) return;
        const selected = { latitude: point.lat(), longitude: point.lng() };
        marker.setPosition(point);
        geocoder.geocode({ location: point }, (results, status) => {
          const resolvedAddress = status === 'OK' && results?.[0]?.formatted_address ? results[0].formatted_address : initialPropsRef.current.address || '';
          onChangeRef.current?.({ ...selected, address: resolvedAddress });
        });
      };
      clickListener = map.addListener('click', (event) => updatePoint(event.latLng));
      dragListener = marker.addListener('dragend', (event) => updatePoint(event.latLng));
      mapRef.current = map;
      markerRef.current = marker;
    }).catch((error) => { if (active) setMapError(error.message || 'No se pudo abrir Google Maps.'); });
    return () => {
      active = false;
      authFailureListeners.delete(showAuthError);
      clickListener?.remove();
      dragListener?.remove();
    };
  }, []);

  React.useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (hasPin) {
      const point = { lat, lng };
      mapRef.current.setCenter(point);
      markerRef.current.setPosition(point);
      return;
    }
    markerRef.current.setPosition(null);
    const cityCenter = {
      lat: Number.isFinite(Number(initialLatitude)) ? Number(initialLatitude) : MCCALLEN.lat,
      lng: Number.isFinite(Number(initialLongitude)) ? Number(initialLongitude) : MCCALLEN.lng,
    };
    mapRef.current.setCenter(cityCenter);
  }, [lat, lng, hasPin, initialLatitude, initialLongitude]);

  return <View>
    <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginBottom: 8 }}>Haz clic en el mapa o arrastra el marcador para fijar el punto exacto de la sucursal.</Text>
    <div ref={mapElement} role="application" aria-label={`Selecciona la ubicación de ${name || 'la sucursal'}`} style={{ width: '100%', height: desktop ? 300 : 250, borderRadius: 16, overflow: 'hidden', background: '#EAF0FF' }} />
    {mapError ? <Text accessibilityRole="alert" style={{ color: C.pink, fontSize: 10, lineHeight: 15, marginTop: 7 }}>{mapError}</Text> : null}
    {hasPin ? <Text style={{ color: C.green, fontSize: 10, fontWeight: '700', marginTop: 7 }}>Punto seleccionado: {lat.toFixed(6)}, {lng.toFixed(6)}</Text> : <Text style={{ color: C.muted, fontSize: 10, marginTop: 7 }}>Aún no eliges un punto.</Text>}
  </View>;
}
