import React from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Label } from '../../shared/components/UI.js';
import { CustomerProfileEditor, MostSavedBusinessCard } from './CustomerProfileEditor.js';
import { colors as C } from '../../shared/theme/colors.js';

export function DesktopProfile({ session, coupons = [], stores = [], favoriteCouponIds = [], onSessionChange, onLocationChange, onExplore, onLogout }) {
  const metricCards = [
    ['CUPONES EN EXPLORAR', String(coupons.length), 'Promociones publicadas'],
    ['NEGOCIOS AFILIADOS', String(stores.length), 'En el directorio actual'],
    ['CUPONES GUARDADOS', String(favoriteCouponIds.length), 'En tus favoritos'],
    ['MEMBRESIA', 'QPONS VIP', 'Cuenta de miembro'],
  ];

  return <View style={{ paddingTop: 28 }}>
    <CustomerProfileEditor session={session} onSessionChange={onSessionChange} onLocationChange={onLocationChange} onLogout={onLogout} desktop />
    <View style={{ flexDirection: 'row', gap: 14, marginBottom: 22 }}>{metricCards.map(([title, value, hint]) => <Card key={title} style={{ flex: 1, padding: 18, marginBottom: 0 }}><Text style={{ color: C.muted, fontSize: 10, fontWeight: '700' }}>{title}</Text><Text style={{ color: C.navy, fontSize: 22, fontWeight: '900', marginTop: 12 }}>{value}</Text><Text style={{ color: C.muted, fontSize: 10, marginTop: 5 }}>{hint}</Text></Card>)}</View>
    <View style={{ flexDirection: 'row', gap: 22, alignItems: 'flex-start' }}>
      <View style={{ flex: 1.15, gap: 16 }}>
        <Card style={{ backgroundColor: C.navy, minHeight: 220, padding: 26, borderRadius: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: C.white, fontSize: 19, fontWeight: '900' }}>QPONS <Text style={{ color: '#FF4D7C' }}>VIP</Text></Text><Text style={{ color: '#91E7C5', fontSize: 11, fontWeight: '700' }}>● Cuenta activa</Text></View>
          <Text style={{ color: '#CBD4E5', fontSize: 10, marginTop: 5 }}>PASE DE SOCIO DIGITAL</Text>
          <View style={{ flex: 1, justifyContent: 'flex-end' }}><Text style={{ color: '#AAB4C8', fontSize: 10 }}>TITULAR</Text><Text style={{ color: C.white, fontSize: 15, fontWeight: '700', marginTop: 4 }}>{session?.user?.name || session?.user?.email || 'Miembro QPONS'}</Text></View>
        </Card>
        <MostSavedBusinessCard coupons={coupons} stores={stores} favoriteCouponIds={favoriteCouponIds} />
      </View>
      <View style={{ flex: 0.85, gap: 16 }}>
        <Card style={{ backgroundColor: '#087A56', padding: 22, borderRadius: 24 }}><Text style={{ color: C.white, fontSize: 16, fontWeight: '800' }}>Explora beneficios VIP</Text><Text style={{ color: '#E0FFF3', fontSize: 12, lineHeight: 18, marginTop: 8 }}>Descubre promociones de negocios afiliados y guarda tus favoritas.</Text><Button secondary onPress={onExplore} style={{ marginTop: 16 }}>Explorar cupones</Button></Card>
        <Card style={{ padding: 20 }}><Label style={{ fontSize: 16 }}>Historial de canjes</Label><Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 8 }}>Tu actividad aparecerá aquí cuando los negocios registren las redenciones.</Text></Card>
      </View>
    </View>
  </View>;
}
