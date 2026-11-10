import React from 'react';
import { Text, View } from 'react-native';
import { colors as C } from '../theme/colors.js';

const columns = [
  ['Explorar Valle RGV', 'McAllen Downtown & Arts', 'Edinburg & University Area', 'Mission & Sharyland'],
  ['Membresía & Soporte', 'Beneficios VIP', 'Concierge Lifestyle 24/7'],
  ['Legal & Transparencia', 'Términos de membresía', 'Política de privacidad', 'Preguntas frecuentes'],
];

// Pie de página informativo para la experiencia web de escritorio.
export function DesktopFooter({ palette }) {
  const theme = palette || { surface: C.white, ink: C.navy, muted: C.muted, accent: C.pink };
  return <View style={{ width: '100%', backgroundColor: theme.surface, marginTop: 44, paddingHorizontal: 32, paddingVertical: 34 }}>
    <View style={{ width: '100%', maxWidth: 1440, alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 28 }}>
      <View style={{ flex: 1.2 }}><Text style={{ color: theme.ink, fontSize: 15, fontWeight: '900' }}>QPONS <Text style={{ color: theme.accent }}>VIP</Text></Text><Text style={{ color: theme.muted, fontSize: 11, lineHeight: 17, marginTop: 8, maxWidth: 270 }}>Recompensas y experiencias exclusivas en McAllen y el Valle del Río Grande.</Text></View>
      {columns.map(([title, ...items]) => <View key={title} style={{ flex: 1 }}>{[title, ...items].map((item, index) => <Text key={item} style={{ color: index ? theme.muted : theme.ink, fontSize: index ? 10 : 12, fontWeight: index ? '400' : '700', marginBottom: 7 }}>{item}</Text>)}</View>)}
    </View>
    <View style={{ width: '100%', maxWidth: 1440, alignSelf: 'center', marginTop: 30, flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: theme.muted, fontSize: 10 }}>© 2026 QPONS VIP Club RGV. Todos los derechos reservados.</Text><Text style={{ color: theme.ink, fontSize: 10, fontWeight: '700' }}>McAllen · Edinburg · Mission · RGV</Text></View>
  </View>;
}
