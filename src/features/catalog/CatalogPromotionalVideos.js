import React from 'react';
import { Alert, Image, Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Card, Label } from '../../shared/components/UI.js';
import { getMediaUrl } from '../../services/api/client.js';
import { colors as C } from '../../shared/theme/colors.js';

const COUPON_VIDEO_FIELDS = [
  ['TikTok / Reels', 'tiktok_video'],
  ['YouTube', 'youtube_url_video'],
  ['Facebook', 'facebook_url_video'],
];

function normalizeVideoUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(trimmed)) return `https://${trimmed}`;
  return '';
}

function collectVideos(stores, coupons) {
  const storesById = new Map(stores.map((store) => [Number(store.id), store]));
  const videos = new Map();
  const addVideo = ({ url, title, platform, store, image }) => {
    const normalizedUrl = normalizeVideoUrl(url);
    if (!normalizedUrl || videos.has(normalizedUrl)) return;
    videos.set(normalizedUrl, { url: normalizedUrl, title: title || 'Video del negocio', platform, store, image });
  };

  stores.forEach((store) => {
    const company = store.companyId || {};
    const layout = company.publicProfileLayout;
    const videosBlock = layout?.blocks?.find((block) => block.id === 'videos');
    if (videosBlock?.visible === false) return;
    const video = layout?.content?.videoUrl;
    const poster = coupons.find((coupon) => Number(coupon.storeId?.id ?? coupon.storeId) === Number(store.id) && coupon.image_1)?.image_1;
    addVideo({ url: video, title: layout?.content?.videoTitle, platform: 'Video del negocio', store, image: poster });
  });

  coupons.forEach((coupon) => {
    const storeId = Number(coupon.storeId?.id ?? coupon.storeId);
    const store = storesById.get(storeId) || coupon.storeId || {};
    const videosBlock = store.companyId?.publicProfileLayout?.blocks?.find((block) => block.id === 'videos');
    if (videosBlock?.visible === false) return;
    COUPON_VIDEO_FIELDS.forEach(([platform, field]) => addVideo({
      url: coupon[field],
      title: coupon.name ? `${coupon.name} · ${platform}` : platform,
      platform,
      store,
      image: coupon.image_1,
    }));
  });

  return [...videos.values()].slice(0, 9);
}

async function openVideo(url) {
  try {
    await Linking.openURL(url);
  } catch {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Alert.alert('No se pudo abrir el video', 'Revisa el enlace e inténtalo de nuevo.');
    }
  }
}

function VideoCard({ video, desktop }) {
  return <Pressable onPress={() => openVideo(video.url)} accessibilityRole="link" accessibilityLabel={`Abrir video de ${video.store?.name || 'negocio'}`} style={{ width: desktop ? 240 : 265, backgroundColor: C.white, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#EEF0F5', marginRight: desktop ? 0 : 10, marginBottom: desktop ? 10 : 0 }}>
    <View style={{ height: desktop ? 128 : 145, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' }}>
      {video.image ? <Image source={{ uri: getMediaUrl(video.image) }} resizeMode="cover" accessibilityLabel={`Portada del video de ${video.store?.name || 'negocio'}`} style={{ width: '100%', height: '100%', position: 'absolute' }} /> : null}
      <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.white }}><Text style={{ color: C.white, fontSize: 18, marginLeft: 3 }}>▶</Text></View>
      <Text style={{ position: 'absolute', left: 10, bottom: 9, color: C.white, backgroundColor: 'rgba(16, 27, 48, 0.82)', borderRadius: 10, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontWeight: '800' }}>{video.platform}</Text>
    </View>
    <View style={{ padding: 12 }}>
      <Text numberOfLines={1} style={{ color: C.pink, fontSize: 9, fontWeight: '800' }}>{video.store?.name || video.store?.companyId?.name || 'NEGOCIO QPONS VIP'}</Text>
      <Label numberOfLines={2} style={{ fontSize: 13, marginTop: 4 }}>{video.title}</Label>
      <Text style={{ color: C.navy, fontSize: 10, fontWeight: '800', marginTop: 8 }}>Ver video →</Text>
    </View>
  </Pressable>;
}

export function CatalogPromotionalVideos({ stores = [], coupons = [], desktop = false, search = '' }) {
  const normalizedSearch = search.trim().toLocaleLowerCase('es-MX');
  const videos = collectVideos(stores, coupons).filter((video) => `${video.title} ${video.platform} ${video.store?.name || ''} ${video.store?.companyId?.name || ''}`.toLocaleLowerCase('es-MX').includes(normalizedSearch));
  return <View style={{ marginTop: 22, marginBottom: 6 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
      <Label style={{ fontSize: 20 }}>Videos de los negocios</Label>
      <Text style={{ color: C.white, backgroundColor: C.pink, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 4, fontSize: 9, fontWeight: '800', marginLeft: 8 }}>PROMOCIONES</Text>
    </View>
    <Text style={{ color: C.muted, fontSize: 11, marginBottom: 10 }}>Conoce sus productos, promociones y experiencias.</Text>
    {videos.length ? desktop ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{videos.map((video) => <VideoCard key={video.url} video={video} desktop />)}</View> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>{videos.map((video) => <VideoCard key={video.url} video={video} desktop={false} />)}</ScrollView>
      : <Card style={{ padding: 14 }}><Text style={{ color: C.muted, fontSize: 11, lineHeight: 16 }}>{normalizedSearch ? 'No hay videos que coincidan con tu búsqueda.' : 'Los videos compartidos por los negocios aparecerán aquí cuando publiquen enlaces desde su perfil o sus cupones.'}</Text></Card>}
  </View>;
}

function alertText(value) {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(alertText).filter(Boolean).join(' ').trim();
  if (value && typeof value === 'object') {
    if (typeof value.text === 'string') return value.text.trim();
    if (Array.isArray(value.children)) return value.children.map(alertText).filter(Boolean).join(' ').trim();
    if (Array.isArray(value.blocks)) return value.blocks.map(alertText).filter(Boolean).join(' ').trim();
  }
  return '';
}

export function CatalogAlerts({ alerts = [] }) {
  const visibleAlerts = alerts.slice(0, 3);
  if (!visibleAlerts.length) return null;
  return <View style={{ marginTop: 22 }}>
    <Label style={{ fontSize: 20, marginBottom: 10 }}>Avisos VIP</Label>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {visibleAlerts.map((alert) => {
        const description = alertText(alert.text);
        const banner = alert.img_banner ? getMediaUrl(alert.img_banner) : '';
        return <Card key={alert.id} style={{ flex: 1, minWidth: 230, maxWidth: 420, padding: 14, marginBottom: 0 }}>
          {banner ? <Image source={{ uri: banner }} resizeMode="cover" accessibilityLabel={`Aviso: ${alert.title}`} style={{ width: '100%', height: 110, borderRadius: 12, marginBottom: 10, backgroundColor: C.pale }} /> : null}
          <Label style={{ fontSize: 14 }}>{alert.title}</Label>
          {description ? <Text numberOfLines={3} style={{ color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 5 }}>{description}</Text> : null}
        </Card>;
      })}
    </View>
  </View>;
}
