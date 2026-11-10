import React from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Card, Header, Label } from '../../shared/components/UI.js';
import { getMediaUrl } from '../../services/api/client.js';
import { colors as C } from '../../shared/theme/colors.js';

const MEDIA_FIELDS = ['image_1', 'image_2', 'image_3', 'image_4', 'image_5'];
const VIDEO_FIELDS = [
  ['TikTok / Reels', 'tiktok_video'],
  ['YouTube', 'youtube_url_video'],
  ['Facebook', 'facebook_url_video'],
];

function normalizeUrl(value) {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function socialUrl(value, host, usesHandle = false) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.includes('.')) return normalizeUrl(value);
  const handle = value.replace(/^@/, '');
  return `https://${host}/${usesHandle ? '@' : ''}${handle}`;
}

async function openExternalUrl(url) {
  if (!url) return;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('No se pudo abrir', 'Revisa que el enlace o la aplicación estén disponibles.');
  }
}

function Action({ label, icon, onPress }) {
  return <Pressable onPress={onPress} accessibilityRole="button" style={{ minWidth: 62, alignItems: 'center', marginRight: 10, paddingVertical: 9 }}>
    <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEF0F5' }}><Text style={{ color: C.navy, fontSize: 17, fontWeight: '700' }}>{icon}</Text></View>
    <Text style={{ color: C.navy, fontSize: 10, marginTop: 5 }}>{label}</Text>
  </Pressable>;
}

function VideoLink({ label, url }) {
  if (!url) return null;
  return <Pressable onPress={() => openExternalUrl(normalizeUrl(url))} accessibilityRole="link" style={{ backgroundColor: C.navy, borderRadius: 18, minHeight: 42, paddingHorizontal: 14, justifyContent: 'center', marginRight: 8, marginTop: 8 }}><Text style={{ color: C.white, fontSize: 11, fontWeight: '700' }}>▶  Ver en {label}</Text></Pressable>;
}

export function BusinessDetailScreen({ store, stores = [], coupons = [], serviceHours = [], onBack, onOpenCoupon, onOpenStore, desktop = false, previewOnly = false }) {
  if (!store) return <View><Header title="Negocio" back={onBack} /><Card><Text style={{ color: C.muted }}>No encontramos este negocio en el catálogo.</Text></Card></View>;

  const storeId = Number(store.id);
  const company = store.companyId || {};
  const otherStores = stores.filter((item) => Number(item.id) !== storeId && Number(item.companyId?.id ?? item.companyId) === Number(company.id));
  const storeCoupons = coupons.filter((coupon) => Number(coupon.storeId?.id ?? coupon.storeId) === storeId);
  const hours = (store.service_hours?.length ? store.service_hours : serviceHours)
    .filter((item) => Number(item.storeId?.id ?? item.storeId) === storeId);
  const gallery = storeCoupons.flatMap((coupon) => MEDIA_FIELDS
    .map((field) => coupon[field] ? { uri: getMediaUrl(coupon[field]), coupon } : null)
    .filter(Boolean));
  const videos = storeCoupons.flatMap((coupon) => VIDEO_FIELDS
    .map(([label, field]) => coupon[field] ? { label, url: coupon[field], coupon } : null)
    .filter(Boolean));
  const heroImage = gallery[0]?.uri;
  const actions = [
    store.phone || company.phone ? { label: 'Llamar', icon: '☎', url: `tel:${(store.phone || company.phone).replace(/[^+\d]/g, '')}` } : null,
    store.address ? { label: 'Llegar', icon: '➤', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}` } : null,
    store.website || company.website ? { label: 'Web', icon: '◎', url: normalizeUrl(store.website || company.website) } : null,
    company.instagram ? { label: 'Instagram', icon: '◉', url: socialUrl(company.instagram, 'instagram.com', true) } : null,
    company.facebook ? { label: 'Facebook', icon: 'f', url: socialUrl(company.facebook, 'facebook.com') } : null,
    company.tiktok ? { label: 'TikTok', icon: '♪', url: socialUrl(company.tiktok, 'tiktok.com', true) } : null,
  ].filter(Boolean);

  return <View style={{ paddingTop: desktop ? 22 : 0, paddingBottom: 20 }}>
    {!previewOnly ? <Header title={store.name} back={onBack} /> : null}
    <View style={{ flexDirection: desktop ? 'row' : 'column', alignItems: 'flex-start', gap: 18 }}>
      <View style={{ flex: 1, width: '100%' }}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {heroImage ? <Image source={{ uri: heroImage }} resizeMode="cover" accessibilityLabel={`Fotos de ${store.name}`} style={{ width: '100%', height: desktop ? 340 : 230, backgroundColor: C.pale }} /> : <View style={{ width: '100%', height: desktop ? 260 : 190, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.white, fontSize: 23, fontWeight: '800' }}>{store.name}</Text><Text style={{ color: '#CFD9EA', fontSize: 12, marginTop: 7 }}>Añade fotos desde el panel de negocio</Text></View>}
          <View style={{ padding: 18 }}>
            <Text style={{ color: C.green, fontSize: 10, fontWeight: '800' }}>● NEGOCIO QPONS VIP</Text>
            <Label style={{ fontSize: 23, marginTop: 6 }}>{store.name}</Label>
            {store.address ? <Text style={{ color: C.muted, fontSize: 12, marginTop: 5 }}>⌖  {store.address}{store.cityId?.[0]?.name ? `, ${store.cityId[0].name}` : ''}</Text> : null}
            {store.description || company.description ? <Text style={{ color: C.muted, fontSize: 13, lineHeight: 20, marginTop: 12 }}>{store.description || company.description}</Text> : <Text style={{ color: C.muted, fontSize: 12, marginTop: 9 }}>Este negocio todavía no agrega una descripción.</Text>}
          </View>
        </Card>

        {actions.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 4 }}>{actions.map((action) => <Action key={action.label} {...action} onPress={() => openExternalUrl(action.url)} />)}</ScrollView> : null}

        {gallery.length > 1 ? <View style={{ marginBottom: 14 }}><Label style={{ fontSize: 18, marginBottom: 8 }}>Fotos</Label><ScrollView horizontal showsHorizontalScrollIndicator={false}>{gallery.slice(1).map((item, index) => previewOnly ? <Image key={`${item.uri}-${index}`} source={{ uri: item.uri }} resizeMode="cover" accessibilityLabel={`Foto ${index + 2} de ${store.name}`} style={{ width: 190, height: 130, borderRadius: 16, marginRight: 9, backgroundColor: C.pale }} /> : <Pressable key={`${item.uri}-${index}`} onPress={() => onOpenCoupon(item.coupon)} accessibilityRole="button"><Image source={{ uri: item.uri }} resizeMode="cover" accessibilityLabel={`Foto ${index + 2} de ${store.name}`} style={{ width: 190, height: 130, borderRadius: 16, marginRight: 9, backgroundColor: C.pale }} /></Pressable>)}</ScrollView></View> : null}

        {videos.length ? <Card style={{ padding: 16 }}><Label style={{ fontSize: 18 }}>Experiencia en video</Label><Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Videos y contenido compartidos por el negocio.</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{videos.map((video, index) => <VideoLink key={`${video.url}-${index}`} {...video} />)}</View></Card> : null}

        {hours.length ? <Card style={{ padding: 16 }}><Label style={{ fontSize: 16 }}>Horarios de servicio</Label>{hours.map((item) => <View key={item.id || item.dayOfWeek} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F2F8' }}><Text style={{ color: C.muted, fontSize: 12 }}>{item.dayOfWeek}</Text><Text style={{ color: C.navy, fontSize: 12, fontWeight: '600' }}>{item.openingTime?.slice(0, 5) || '—'} – {item.closingTime?.slice(0, 5) || '—'}</Text></View>)}</Card> : null}
        {otherStores.length ? <Card style={{ padding: 16 }}><Label style={{ fontSize: 16 }}>Otras sucursales</Label>{otherStores.map((item) => previewOnly ? <View key={item.id} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F2F8' }}><Text style={{ color: C.navy, fontSize: 12, fontWeight: '700' }}>{item.name}</Text><Text style={{ color: C.muted, fontSize: 10, marginTop: 3 }}>{item.address || 'Dirección pendiente'}</Text></View> : <Pressable key={item.id} onPress={() => onOpenStore?.(item)} accessibilityRole="button" style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F2F8' }}><Text style={{ color: C.navy, fontSize: 12, fontWeight: '700' }}>{item.name}  →</Text><Text style={{ color: C.muted, fontSize: 10, marginTop: 3 }}>{item.address || 'Dirección pendiente'}</Text></Pressable>)}</Card> : null}
        {storeCoupons.some((coupon) => coupon.terms) ? <Card style={{ padding: 16 }}><Label style={{ fontSize: 16 }}>Términos y condiciones</Label>{storeCoupons.filter((coupon) => coupon.terms).map((coupon) => <View key={coupon.id} style={{ marginTop: 11 }}><Text style={{ color: C.navy, fontSize: 12, fontWeight: '700' }}>{coupon.name}</Text><Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 4 }}>{coupon.terms}</Text></View>)}</Card> : null}
      </View>

      <View style={{ width: desktop ? 360 : '100%' }}>
        <Label style={{ fontSize: 20, marginBottom: 9 }}>Promociones VIP</Label>
        {!storeCoupons.length ? <Card><Text style={{ color: C.muted, fontSize: 12 }}>Este negocio todavía no publica promociones.</Text></Card> : storeCoupons.map((coupon) => {
          const image = coupon.image_1 ? getMediaUrl(coupon.image_1) : '';
          return <Card key={coupon.id} style={{ padding: 0, overflow: 'hidden' }}>
            {image ? <Image source={{ uri: image }} resizeMode="cover" accessibilityLabel={`Imagen de ${coupon.name}`} style={{ width: '100%', height: 160, backgroundColor: C.pale }} /> : null}
            <View style={{ padding: 16 }}><Text style={{ color: C.pink, fontSize: 10, fontWeight: '800' }}>BENEFICIO QPONS VIP</Text><Label style={{ fontSize: 18, marginTop: 5 }}>{coupon.name}</Label><Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 5 }}>{coupon.description || 'Consulta esta promoción en la sucursal.'}</Text>{coupon.expiration ? <Text style={{ color: C.muted, fontSize: 10, marginTop: 9 }}>Válido hasta {new Date(coupon.expiration).toLocaleDateString('es-MX')}</Text> : null}{previewOnly ? <View style={{ backgroundColor: C.navy, borderRadius: 24, alignItems: 'center', paddingVertical: 12, marginTop: 13 }}><Text style={{ color: C.white, fontWeight: '800', fontSize: 12 }}>Obtener cupón VIP →</Text></View> : <Pressable onPress={() => onOpenCoupon(coupon)} accessibilityRole="button" style={{ backgroundColor: C.navy, borderRadius: 24, alignItems: 'center', paddingVertical: 12, marginTop: 13 }}><Text style={{ color: C.white, fontWeight: '800', fontSize: 12 }}>Obtener cupón VIP →</Text></Pressable>}</View>
          </Card>;
        })}
      </View>
    </View>
  </View>;
}
