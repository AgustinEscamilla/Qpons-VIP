import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors as C } from '../../shared/theme/colors.js';
import { createCityLocation, getCurrentCustomerLocation, getDefaultCustomerLocation } from './customerLocation.js';

export function LocateMeButton({ onLocated, label = 'Usar mi ubicación', secondary = false, style, palette }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const locate = async () => {
    setLoading(true);
    setError('');
    try {
      const location = await getCurrentCustomerLocation();
      await onLocated?.(location);
    } catch (locationError) {
      setError(locationError.message || 'No se pudo obtener tu ubicación.');
    } finally {
      setLoading(false);
    }
  };

  return <View style={style}>
    <Pressable onPress={locate} disabled={loading} accessibilityRole="button" style={{ minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: secondary ? (palette?.soft || C.pale) : (palette?.button || C.navy), opacity: loading ? 0.65 : 1 }}>
      <Text style={{ color: secondary ? (palette?.ink || C.navy) : (palette?.buttonText || C.white), fontSize: 11, fontWeight: '700' }}>{loading ? 'Buscando ubicación…' : `⌖  ${label}`}</Text>
    </Pressable>
    {error ? <Text accessibilityRole="alert" style={{ color: C.pink, fontSize: 10, marginTop: 5 }}>{error}</Text> : null}
  </View>;
}

export function LocationPicker({ location, cities = [], onChange, desktop = false, palette }) {
  const [open, setOpen] = React.useState(false);
  const displayedLocation = location || getDefaultCustomerLocation(cities);
  const label = displayedLocation?.source === 'gps' ? 'Mi ubicación' : displayedLocation?.label || 'Elegir ubicación';
  const usesCity = displayedLocation?.source === 'city' || displayedLocation?.source === 'default';

  const selectLocation = (nextLocation) => {
    onChange?.(nextLocation);
    setOpen(false);
  };

  // Keep the location selector compact and aligned below the page heading on both layouts.
  return <View style={{ position: 'relative', zIndex: open ? 20 : 1, alignSelf: 'flex-start', marginBottom: desktop ? 0 : 14 }}>
    <Pressable onPress={() => setOpen((current) => !current)} accessibilityRole="button" accessibilityState={{ expanded: open }} style={{ minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 24, paddingHorizontal: 15, paddingVertical: 10, backgroundColor: usesCity ? (palette?.soft || C.pale) : (palette?.surface || C.white), borderWidth: 1, borderColor: palette?.border || '#EDF0F6' }}>
      <Text style={{ color: palette?.ink || C.navy, fontSize: 12, fontWeight: '600' }}>⌖  {label}  {open ? '⌃' : '⌄'}</Text>
    </Pressable>
    {open ? <View style={{ position: desktop ? 'absolute' : 'relative', top: desktop ? 49 : 7, left: desktop ? 0 : undefined, width: desktop ? 285 : '100%', padding: 13, borderRadius: 18, backgroundColor: palette?.surface || C.white, borderWidth: 1, borderColor: palette?.border || '#E8ECF4', shadowColor: palette?.ink || C.navy, shadowOpacity: 0.12, shadowRadius: 12, elevation: 9 }}>
      <LocateMeButton label="Usar mi ubicación actual" onLocated={selectLocation} palette={palette} />
      <Text style={{ color: palette?.muted || C.muted, fontSize: 10, fontWeight: '700', marginTop: 13, marginBottom: 7 }}>O ELIGE UNA CIUDAD</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {cities.map((city) => <Pressable key={city.id} onPress={() => selectLocation(createCityLocation(city))} accessibilityRole="button" style={{ borderRadius: 16, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: String(displayedLocation?.cityId) === String(city.id) ? (palette?.button || C.navy) : (palette?.soft || C.pale) }}>
          <Text style={{ color: String(displayedLocation?.cityId) === String(city.id) ? (palette?.buttonText || C.white) : (palette?.ink || C.navy), fontSize: 10, fontWeight: '600' }}>{city.name}</Text>
        </Pressable>)}
      </View>
    </View> : null}
  </View>;
}
