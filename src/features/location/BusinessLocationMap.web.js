import React from 'react';
import Constants from 'expo-constants';
import { Image, Text, View } from 'react-native';
import { colors as C } from '../../shared/theme/colors.js';

// Lee la misma clave inyectada por Expo tanto en desarrollo como en el bundle web.
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || Constants.expoConfig?.extra?.googleMapsApiKey || '';

export default function BusinessLocationMap({ latitude, longitude, address, name, desktop }) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  const location = hasCoordinates ? `${lat},${lng}` : address;
  const encodedLocation = location ? encodeURIComponent(location) : '';
  const imageUrl = GOOGLE_MAPS_API_KEY && encodedLocation
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${encodedLocation}&zoom=15&size=1200x420&scale=2&markers=color:red%7C${encodedLocation}&key=${GOOGLE_MAPS_API_KEY}`
    : '';
  const [imageFailed, setImageFailed] = React.useState(false);

  if (!imageUrl || imageFailed) {
    return <View style={{ height: desktop ? 180 : 140, borderRadius: 14, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <Text style={{ color: C.navy, fontSize: 12, fontWeight: '700', textAlign: 'center' }}>{address ? `Ubicación de ${name}. Si el mapa no aparece, revisa la clave y Maps Static API en Google Cloud.` : 'Esta sucursal todavía no tiene una dirección o ubicación guardada.'}</Text>
    </View>;
  }

  return <Image
    source={{ uri: imageUrl }}
    resizeMode="cover"
    accessibilityLabel={`Mapa de ${name}`}
    onError={() => setImageFailed(true)}
    style={{ width: '100%', height: desktop ? 260 : 220, borderRadius: 14, backgroundColor: C.pale }}
  />;
}
