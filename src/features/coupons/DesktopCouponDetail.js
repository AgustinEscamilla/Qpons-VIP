import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Button, Card, Label } from '../../shared/components/UI.js';
import { FavoriteButton } from '../../shared/components/FavoriteButton.js';
import { getMediaUrl } from '../../services/api/client.js';
import { getCouponQrValue } from './couponQr.js';
import { colors as C } from '../../shared/theme/colors.js';

// Detalle amplio de promoción: información del negocio a la izquierda y QR a la derecha.
export function DesktopCouponDetail({ coupon: suppliedCoupon, store, coupons, onBack, onSelectCoupon, isAuthenticated, onRequireAuth, isFavoriteCoupon, onToggleCoupon, favoritesReady = true }) {
  const coupon = suppliedCoupon || coupons[0] || null;
  const couponStore = store || coupon?.storeId || null;
  const image = coupon?.image_1 ? getMediaUrl(coupon.image_1) : '';

  return <View style={{ paddingTop: 22 }}>
    <Pressable onPress={onBack} style={{ alignSelf: 'flex-start', marginBottom: 16 }}><Text style={{ color: C.muted, fontSize: 12 }}>‹  Volver al catálogo  /  {couponStore?.name || 'Promoción VIP'}</Text></Pressable>
    <View style={{ flexDirection: 'row', gap: 22, alignItems: 'flex-start' }}>
      <View style={{ flex: 1.45 }}>
        <Card style={{ padding: 20 }}>
          {image ? <Image source={{ uri: image }} resizeMode="cover" style={{ width: '100%', height: 340, borderRadius: 16, backgroundColor: C.pale }} /> : <View style={{ width: '100%', height: 340, borderRadius: 16, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.white, fontSize: 20, fontWeight: '800' }}>QPONS VIP</Text></View>}
          {coupon ? <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}><FavoriteButton favorite={isFavoriteCoupon?.(coupon)} onPress={() => onToggleCoupon?.(coupon)} itemLabel={'el cupón ' + coupon.name} disabled={!favoritesReady} /></View> : null}
          <Text style={{ color: C.pink, fontSize: 10, fontWeight: '800', marginTop: 17 }}>BENEFICIO EXCLUSIVO QPONS VIP</Text>
          <Label style={{ fontSize: 25, marginTop: 7 }}>{couponStore?.name || 'Promoción VIP'}</Label>
          <Text style={{ color: C.muted, fontSize: 13, lineHeight: 20, marginTop: 7 }}>{coupon?.description || coupon?.name || 'Conoce las experiencias y beneficios exclusivos disponibles.'}</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}><Text style={{ color: C.navy, backgroundColor: C.pale, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9, fontSize: 11 }}>⌖  {couponStore?.address || 'McAllen, TX'}</Text><Text style={{ color: C.green, backgroundColor: '#E9F8F1', borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9, fontSize: 11 }}>● Beneficio disponible</Text></View>
          {coupon?.terms ? <View style={{ backgroundColor: C.pale, borderRadius: 14, padding: 14, marginTop: 18 }}><Text style={{ color: C.navy, fontSize: 12, fontWeight: '800' }}>Términos y condiciones</Text><Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 5 }}>{coupon.terms}</Text></View> : null}
        </Card>
        <Card style={{ padding: 20 }}><Label style={{ fontSize: 16 }}>Más promociones</Label><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>{coupons.filter((item) => item.id !== coupon?.id).slice(0, 4).map((item) => <View key={item.documentId || item.id} style={{ position: 'relative' }}><Pressable onPress={() => onSelectCoupon(item)} style={{ backgroundColor: C.pale, paddingHorizontal: 13, paddingVertical: 10, paddingRight: 48, borderRadius: 14 }}><Text style={{ color: C.navy, fontSize: 11, fontWeight: '700' }}>{item.name}</Text></Pressable><FavoriteButton favorite={isFavoriteCoupon?.(item)} onPress={() => onToggleCoupon?.(item)} itemLabel={'el cupón ' + item.name} disabled={!favoritesReady} style={{ position: 'absolute', top: -3, right: -3, width: 32, height: 32 }} /></View>)}</View></Card>
      </View>
      <View style={{ width: 360 }}>
        <Card style={{ padding: 22, borderTopWidth: 4, borderTopColor: C.pink }}>
          <Text style={{ color: C.white, backgroundColor: C.navy, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start', fontSize: 10, fontWeight: '800' }}>VIP EXCLUSIVO</Text>
          <Text style={{ color: C.green, fontSize: 10, fontWeight: '800', marginTop: 14 }}>PROMOCIÓN QPONS VIP</Text>
          <Label style={{ fontSize: 20, marginTop: 5 }}>{coupon?.name || 'Elige una promoción'}</Label>
          {coupon?.code ? <Text style={{ color: C.muted, fontSize: 11, marginTop: 8 }}>Código: {coupon.code}</Text> : null}
          <View style={{ backgroundColor: C.pale, alignItems: 'center', padding: 20, borderRadius: 16, marginTop: 18 }}>
            {coupon && isAuthenticated ? <>
              <QRCode value={getCouponQrValue(coupon)} size={220} color={C.navy} backgroundColor={C.white} quietZone={8} />
              {coupon?.code ? <Text style={{ color: C.navy, fontSize: 11, fontWeight: '800', marginTop: 10 }}>{coupon.code}</Text> : null}
            </> : <>
              <Text style={{ color: C.navy, textAlign: 'center', fontSize: 15, fontWeight: '800' }}>Tu cupón VIP te espera</Text>
              <Text style={{ color: C.muted, textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 8 }}>Inicia sesión o crea una cuenta para obtener el código QR y usar este beneficio.</Text>
              {coupon ? <Button onPress={onRequireAuth} style={{ width: '100%' }}>Iniciar sesión para usar</Button> : null}
            </>}
          </View>
          {isAuthenticated ? <Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 12 }}>Muestra este código QR en la sucursal para identificar la promoción.</Text> : null}
          {coupon?.expiration ? <Text style={{ color: C.pink, fontSize: 11, marginTop: 8 }}>Válido hasta {coupon.expiration}</Text> : null}
          <Button onPress={onBack}>Volver a explorar</Button>
          <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 12 }}>La lectura y validación del QR en caja se habilitará con el flujo de canje del negocio.</Text>
        </Card>
      </View>
    </View>
  </View>;
}
