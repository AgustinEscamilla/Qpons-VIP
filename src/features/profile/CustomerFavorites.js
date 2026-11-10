import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Card, Label } from '../../shared/components/UI.js';
import { FavoriteButton } from '../../shared/components/FavoriteButton.js';
import { getFavoriteId } from './useFavorites.js';
import { getMediaUrl } from '../../services/api/client.js';
import { colors as C } from '../../shared/theme/colors.js';

function matchSavedItems(ids, items) {
  return ids
    .map((id) => items.find((item) => getFavoriteId(item) === id))
    .filter(Boolean);
}

export function CustomerFavorites({
  coupons = [],
  stores = [],
  couponIds = [],
  storeIds = [],
  ready,
  loading,
  onOpenCoupon,
  onOpenStore,
  onToggleCoupon,
  onToggleStore,
  isFavoriteCoupon,
  isFavoriteStore,
  desktop = false,
}) {
  const savedCoupons = matchSavedItems(couponIds, coupons);
  const savedStores = matchSavedItems(storeIds, stores);
  const storeImage = (store) => {
    const coupon = coupons.find((item) => Number(item.storeId?.id ?? item.storeId) === Number(store.id) && item.image_1);
    return coupon?.image_1 ? getMediaUrl(coupon.image_1) : '';
  };
  const savedItemStyle = {
    width: desktop ? '48.5%' : '100%',
    backgroundColor: C.white,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEF0F5',
  };

  return (
    <View style={{ paddingTop: desktop ? 28 : 12 }}>
      <Label style={{ fontSize: desktop ? 28 : 22 }}>Favoritos</Label>
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 5, marginBottom: 20 }}>
        Tus cupones y negocios guardados en un solo lugar.
      </Text>

      {!ready || loading ? (
        <Card><Text style={{ color: C.muted, fontSize: 12 }}>Cargando tus favoritos…</Text></Card>
      ) : savedCoupons.length === 0 && savedStores.length === 0 ? (
        <Card>
          <Text style={{ color: C.pink, fontSize: 28, marginBottom: 4 }}>♡</Text>
          <Label style={{ fontSize: 16 }}>Aún no tienes favoritos</Label>
          <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 6 }}>
            Toca el corazón de un cupón o negocio para guardarlo aquí.
          </Text>
        </Card>
      ) : null}

      {savedCoupons.length > 0 ? <>
        <Label style={{ fontSize: 18, marginBottom: 10 }}>Cupones guardados</Label>
        <View style={{ flexDirection: desktop ? 'row' : 'column', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          {savedCoupons.map((coupon) => {
            const image = coupon.image_1 ? getMediaUrl(coupon.image_1) : '';
            const storeName = coupon.storeId?.name || coupon.storeId?.companyId?.name || 'Tienda participante';
            return (
              <View key={getFavoriteId(coupon)} style={[savedItemStyle, { position: 'relative' }]}>
                <Pressable onPress={() => onOpenCoupon?.(coupon)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', padding: 12, paddingRight: 48 }}>
                  {image ? <Image source={{ uri: image }} resizeMode="cover" accessibilityLabel={'Imagen de ' + coupon.name} style={{ width: 76, height: 76, borderRadius: 12, backgroundColor: C.pale }} /> : <View style={{ width: 76, height: 76, borderRadius: 12, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.pink, fontSize: 22, fontWeight: '900' }}>Q</Text></View>}
                  <View style={{ flex: 1, paddingHorizontal: 11 }}>
                    <Text numberOfLines={1} style={{ color: C.pink, fontSize: 10, fontWeight: '800' }}>{storeName}</Text>
                    <Label numberOfLines={2} style={{ fontSize: 13, marginTop: 4 }}>{coupon.name}</Label>
                    <Text numberOfLines={2} style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>{coupon.description || 'Consulta los detalles del cupón.'}</Text>
                  </View>
                </Pressable>
                <FavoriteButton favorite={isFavoriteCoupon?.(coupon)} onPress={() => onToggleCoupon?.(coupon)} itemLabel={'el cupón ' + coupon.name} disabled={!ready} style={{ position: 'absolute', top: 8, right: 8 }} />
              </View>
            );
          })}
        </View>
      </> : null}

      {savedStores.length > 0 ? <>
        <Label style={{ fontSize: 18, marginBottom: 10 }}>Negocios guardados</Label>
        <View style={{ flexDirection: desktop ? 'row' : 'column', flexWrap: 'wrap', gap: 12 }}>
          {savedStores.map((store) => {
            const image = storeImage(store);
            return (
              <View key={getFavoriteId(store)} style={[savedItemStyle, { position: 'relative' }]}>
                <Pressable onPress={() => onOpenStore?.(store)} accessibilityRole="button" accessibilityLabel={'Ver perfil de ' + store.name} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, paddingRight: 48 }}>
                  {image ? <Image source={{ uri: image }} resizeMode="cover" accessibilityLabel={'Imagen de ' + store.name} style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: C.pale }} /> : <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.pink, fontSize: 22, fontWeight: '900' }}>{store.name?.trim()?.charAt(0)?.toUpperCase() || 'Q'}</Text></View>}
                  <View style={{ flex: 1, paddingHorizontal: 11 }}>
                    <Label numberOfLines={1} style={{ fontSize: 14 }}>{store.name}</Label>
                    <Text numberOfLines={2} style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>{store.address || store.cityId?.[0]?.name || store.description || 'Negocio afiliado a QPONS VIP'}</Text>
                  </View>
                </Pressable>
                <FavoriteButton favorite={isFavoriteStore?.(store)} onPress={() => onToggleStore?.(store)} itemLabel={'el negocio ' + store.name} disabled={!ready} style={{ position: 'absolute', top: 8, right: 8 }} />
              </View>
            );
          })}
        </View>
      </> : null}
    </View>
  );
}
