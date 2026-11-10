import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Button, Card, Header, Label } from '../../shared/components/UI.js';
import { FavoriteButton } from '../../shared/components/FavoriteButton.js';
import { getMediaUrl } from '../../services/api/client.js';
import { getCouponQrValue } from './couponQr.js';
import { colors as C } from '../../shared/theme/colors.js';

// Lista las promociones reales del catálogo que el cliente puede abrir y presentar.
export function CustomerCouponList({ coupons, onOpen, isFavoriteCoupon, onToggleCoupon, favoritesReady = true }) {
  if (!coupons.length) {
    return <Text style={{ color: C.muted, fontSize: 11, marginVertical: 8 }}>Todavía no hay promociones publicadas en el catálogo.</Text>;
  }

  return <View>{coupons.map((coupon) => <View key={coupon.documentId || coupon.id} style={{ position: 'relative', marginBottom: 8 }}>
    <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 10, paddingRight: onToggleCoupon ? 52 : 10, gap: 10, marginBottom: 0 }}>
    {coupon.image_1 ? <Image source={{ uri: getMediaUrl(coupon.image_1) }} style={{ width: 58, height: 58, borderRadius: 12, backgroundColor: C.pale }} /> : <View style={{ width: 58, height: 58, borderRadius: 12, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.pink, fontSize: 20 }}>Q</Text></View>}
    <View style={{ flex: 1 }}>
      <Text style={{ color: C.pink, fontSize: 9, fontWeight: '800' }}>{coupon.storeId?.name || 'QPONS VIP'}</Text>
      <Label style={{ fontSize: 12, marginTop: 3 }}>{coupon.name}</Label>
      <Text style={{ color: C.muted, fontSize: 10, marginTop: 3 }}>{coupon.code ? `Código ${coupon.code}` : 'Incluye QR digital'}</Text>
    </View>
    <Pressable onPress={() => onOpen(coupon)} accessibilityRole="button" style={{ backgroundColor: C.navy, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 8 }}><Text style={{ color: C.white, fontSize: 10, fontWeight: '700' }}>Usar</Text></Pressable>
    </Card>
    {onToggleCoupon ? <FavoriteButton favorite={isFavoriteCoupon?.(coupon)} onPress={() => onToggleCoupon(coupon)} itemLabel={'el cupón ' + coupon.name} disabled={!favoritesReady} style={{ position: 'absolute', right: 8, top: 10 }} /> : null}
  </View>)}</View>;
}

// Muestra un QR funcional asociado al identificador persistente del cupón seleccionado.
export function CouponQrScreen({ coupon, onBack, isFavoriteCoupon, onToggleCoupon, favoritesReady = true }) {
  return (
    <View>
      <Header title="Tu cupón VIP" back={onBack} />
      {!coupon ? <Card><Label>No hay un cupón seleccionado</Label><Text style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Vuelve a tus cupones y elige una promoción para mostrar su QR.</Text><Button secondary onPress={onBack}>Volver a mis cupones</Button></Card> : <>
        <Text style={{ alignSelf: 'center', color: C.green, backgroundColor: '#E9F8F1', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, fontSize: 10, fontWeight: '800', marginBottom: 12 }}>Cupón seleccionado · {coupon.storeId?.name || 'QPONS VIP'}</Text>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {coupon.image_1 ? <Image source={{ uri: getMediaUrl(coupon.image_1) }} resizeMode="cover" style={{ width: '100%', height: 150, backgroundColor: C.navy }} /> : null}
          <View style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ color: C.pink, fontSize: 10, fontWeight: '800', alignSelf: 'flex-start' }}>PROMOCIÓN QPONS VIP</Text>
            <View style={{ alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 6 }}>
              <Label style={{ flex: 1, fontSize: 19 }}>{coupon.name}</Label>
              <FavoriteButton favorite={isFavoriteCoupon?.(coupon)} onPress={() => onToggleCoupon?.(coupon)} itemLabel={'el cupón ' + coupon.name} disabled={!favoritesReady} />
            </View>
            {coupon.description ? <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 6, alignSelf: 'flex-start' }}>{coupon.description}</Text> : null}
            <View style={{ marginTop: 17, backgroundColor: C.white, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#EEF0F5' }}>
              <QRCode value={getCouponQrValue(coupon)} size={210} color={C.navy} backgroundColor={C.white} quietZone={8} />
            </View>
            <Text style={{ color: C.muted, fontSize: 10, textAlign: 'center', lineHeight: 15, marginTop: 10 }}>Muestra este QR en la sucursal para identificar el cupón.</Text>
            {coupon.code ? <Text style={{ color: C.navy, fontSize: 13, fontWeight: '800', letterSpacing: 1.2, marginTop: 12 }}>Código: {coupon.code}</Text> : null}
            {coupon.expiration ? <Text style={{ color: C.pink, fontSize: 11, marginTop: 8 }}>Vence: {new Date(coupon.expiration).toLocaleDateString()}</Text> : null}
            {coupon.terms ? <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 12 }}>{coupon.terms}</Text> : null}
          </View>
        </Card>
        <Text style={{ color: C.muted, fontSize: 10, textAlign: 'center', lineHeight: 15 }}>El QR identifica la promoción. La validación y registro del canje en caja todavía requiere conectar el lector del negocio.</Text>
      </>}
    </View>
  );
}
