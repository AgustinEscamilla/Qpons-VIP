import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors as C } from '../theme/colors.js';
import { LocationPicker } from '../../features/location/LocationPicker.js';

const links = [
  ['Inicio', 'Inicio'],
  ['Explorar Cupones', 'Cupones'],
  ['Favoritos', 'Favoritos'],
  ['Mis Pases', 'Perfil'],
  ['Beneficios VIP', 'Perfil'],
];

// Navegación horizontal exclusiva para las pantallas grandes de la web.
export function DesktopHeader({ screen, onNavigate, location, cities = [], onLocationChange, palette }) {
  const theme = palette || { surface: C.white, ink: C.navy, muted: C.muted, accent: C.pink, button: C.navy, buttonText: C.white, border: '#E9EDF5', soft: C.pale };
  return <View style={{ position: 'relative', zIndex: 1, elevation: 1, backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border }}>
    <View style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 1440, minHeight: 72, alignSelf: 'center', paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
      <Pressable onPress={() => onNavigate('Inicio')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: theme.button, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: theme.buttonText, fontWeight: '900' }}>Q</Text></View>
        <Text style={{ color: theme.ink, fontSize: 14, fontWeight: '900' }}>QPONS <Text style={{ color: theme.accent }}>VIP</Text></Text>
      </Pressable>
      {/* Center the location selector against the full navbar, independent of the side items. */}
      <View pointerEvents="box-none" style={{ position: 'absolute', left: '50%', marginLeft: -100, width: 200, top: '50%', marginTop: -21, alignItems: 'center', zIndex: 2 }}>
        <LocationPicker location={location} cities={cities} onChange={onLocationChange} desktop palette={palette} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        {links.map(([label, target], index) => {
          const active = target === 'Inicio' ? screen === 'Inicio' : target === 'Favoritos' ? screen === 'Favoritos' : target === 'Perfil' ? screen === 'Perfil' : screen === target || screen === 'Negocio' || screen === 'DetalleNegocio' || screen === 'Cupón QR' || screen === 'Buscar';
          return <Pressable key={label} onPress={() => onNavigate(target)} style={{ backgroundColor: active ? theme.button : 'transparent', borderRadius: 18, paddingHorizontal: active ? 13 : 0, paddingVertical: 8 }}><Text style={{ color: active ? theme.buttonText : theme.ink, fontSize: 12, fontWeight: active ? '700' : '500' }}>{label}</Text></Pressable>;
        })}
      </View>
      <Pressable onPress={() => onNavigate('Perfil')} accessibilityRole="button" accessibilityLabel="Abrir perfil" style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.button, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: theme.buttonText, fontSize: 12, fontWeight: '800' }}>VIP</Text></Pressable>
    </View>
  </View>;
}
