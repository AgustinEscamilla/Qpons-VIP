import React from 'react';
import Constants from 'expo-constants';
import { Image, Platform, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors as C } from '../../shared/theme/colors.js';

// Usa la clave pública del entorno o la que Expo guardó en su configuración final.
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || Constants.expoConfig?.extra?.googleMapsApiKey || '';

function getStaticMapUrl({ latitude, longitude, address }) {
  if (!GOOGLE_MAPS_API_KEY) return '';
  const location = Number.isFinite(latitude) && Number.isFinite(longitude)
    ? `${latitude},${longitude}`
    : address;
  if (!location) return '';
  const encoded = encodeURIComponent(location);
  return `https://maps.googleapis.com/maps/api/staticmap?center=${encoded}&zoom=15&size=840x420&scale=2&markers=color:red%7C${encoded}&key=${GOOGLE_MAPS_API_KEY}`;
}

export default function BusinessLocationMap({ latitude, longitude, address, name, desktop }) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  const [imageFailed, setImageFailed] = React.useState(false);

  if (hasCoordinates) {
    return <MapView
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
      style={{ width: '100%', height: desktop ? 260 : 220, borderRadius: 14 }}
      accessibilityLabel={`Mapa de ${name}`}
      toolbarEnabled
    >
      <Marker coordinate={{ latitude: lat, longitude: lng }} title={name} description={address} />
    </MapView>;
  }

  const imageUrl = getStaticMapUrl({ latitude: lat, longitude: lng, address });
  if (imageUrl && !imageFailed) {
    return <Image
      source={{ uri: imageUrl }}
      resizeMode="cover"
      accessibilityLabel={`Mapa de ${name}`}
      onError={() => setImageFailed(true)}
      style={{ width: '100%', height: desktop ? 260 : 220, borderRadius: 14, backgroundColor: C.pale }}
    />;
  }

  return <View style={{ height: 112, borderRadius: 14, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    <Text style={{ color: C.navy, fontSize: 12, fontWeight: '700', textAlign: 'center' }}>{address ? 'No se pudo cargar el mapa. Puedes abrir la ruta en Google Maps.' : 'Esta sucursal todavía no tiene una dirección o ubicación guardada.'}</Text>
  </View>;
}
