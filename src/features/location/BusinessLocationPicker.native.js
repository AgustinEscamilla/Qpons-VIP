import React from 'react';
import { Platform, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { colors as C } from '../../shared/theme/colors.js';

const MCCALLEN = { latitude: 26.2034, longitude: -98.2300 };

export default function BusinessLocationPicker({ latitude, longitude, initialLatitude, initialLongitude, address, name, onChange, desktop }) {
  const mapRef = React.useRef(null);
  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasPin = latitude !== '' && latitude !== null && latitude !== undefined
    && longitude !== '' && longitude !== null && longitude !== undefined
    && Number.isFinite(lat) && Number.isFinite(lng);
  const center = hasPin ? { latitude: lat, longitude: lng } : {
    latitude: Number.isFinite(Number(initialLatitude)) ? Number(initialLatitude) : MCCALLEN.latitude,
    longitude: Number.isFinite(Number(initialLongitude)) ? Number(initialLongitude) : MCCALLEN.longitude,
  };

  const choosePoint = async (coordinate) => {
    let resolvedAddress = address || '';
    try {
      const [place] = await Location.reverseGeocodeAsync(coordinate);
      if (place) resolvedAddress = [place.streetNumber, place.street, place.city || place.subregion, place.region, place.postalCode].filter(Boolean).join(', ');
    } catch { /* Las coordenadas siguen siendo válidas aunque no haya dirección legible. */ }
    onChange?.({ ...coordinate, address: resolvedAddress });
    mapRef.current?.animateToRegion({ ...coordinate, latitudeDelta: 0.012, longitudeDelta: 0.012 }, 250);
  };

  React.useEffect(() => {
    if (hasPin || !mapRef.current) return;
    mapRef.current.animateToRegion({ latitude: center.latitude, longitude: center.longitude, latitudeDelta: 0.035, longitudeDelta: 0.035 }, 250);
  }, [hasPin, center.latitude, center.longitude]);

  return <View>
    <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginBottom: 8 }}>Toca el mapa o arrastra el marcador para fijar el punto exacto de la sucursal.</Text>
    <MapView
      ref={mapRef}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      initialRegion={{ ...center, latitudeDelta: 0.035, longitudeDelta: 0.035 }}
      onPress={(event) => choosePoint(event.nativeEvent.coordinate)}
      style={{ width: '100%', height: desktop ? 280 : 230, borderRadius: 16 }}
      accessibilityLabel={`Selecciona la ubicación de ${name || 'la sucursal'}`}
    >
      {hasPin ? <Marker coordinate={{ latitude: lat, longitude: lng }} title={name || 'Sucursal'} description={address} draggable onDragEnd={(event) => choosePoint(event.nativeEvent.coordinate)} /> : null}
    </MapView>
    {hasPin ? <Text style={{ color: C.green, fontSize: 10, fontWeight: '700', marginTop: 7 }}>Punto seleccionado: {lat.toFixed(6)}, {lng.toFixed(6)}</Text> : <Text style={{ color: C.muted, fontSize: 10, marginTop: 7 }}>Aún no eliges un punto.</Text>}
  </View>;
}
