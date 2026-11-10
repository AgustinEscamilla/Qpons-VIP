import React from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Header, Label } from '../../shared/components/UI.js';
import { CustomerProfileEditor, MostSavedBusinessCard } from './CustomerProfileEditor.js';
import { colors as C } from '../../shared/theme/colors.js';

export function CustomerProfileScreen({ session, coupons = [], stores = [], favoriteCouponIds = [], onSessionChange, onLocationChange, onExplore, onLogout }) {
  return <View>
    <Header title="Mi perfil VIP" back={onExplore} />
    <CustomerProfileEditor session={session} onSessionChange={onSessionChange} onLocationChange={onLocationChange} />
    <Card style={{ padding: 16 }}>
      <Text style={{ color: C.pink, fontSize: 10, fontWeight: '800' }}>QPONS VIP</Text>
      <Label style={{ fontSize: 17, marginTop: 4 }}>Beneficios para descubrir</Label>
      <Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 6 }}>
        Hay {coupons.length} {coupons.length === 1 ? 'cupón publicado' : 'cupones publicados'} en las tiendas afiliadas.
      </Text>
      <Button onPress={onExplore} style={{ marginTop: 12 }}>Explorar cupones</Button>
    </Card>
    <MostSavedBusinessCard coupons={coupons} stores={stores} favoriteCouponIds={favoriteCouponIds} />
    <Button secondary onPress={onLogout}>Cerrar sesión</Button>
  </View>;
}
