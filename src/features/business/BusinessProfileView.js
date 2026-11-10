import React from 'react';
import { Alert, Image, Linking, PanResponder, Pressable, ScrollView, Text, View } from 'react-native';
import { Card, Header } from '../../shared/components/UI.js';
import { FavoriteButton } from '../../shared/components/FavoriteButton.js';
import BusinessLocationMap from '../location/BusinessLocationMap';
import { getMediaUrl } from '../../services/api/client.js';
import { getPublicProfilePalette, normalizePublicProfileLayout, PUBLIC_PROFILE_BLOCKS } from './publicProfileLayout.js';

const IMAGE_FIELDS = ['image_1', 'image_2', 'image_3', 'image_4', 'image_5'];
const VIDEO_FIELDS = [['TikTok / Reels', 'tiktok_video'], ['YouTube', 'youtube_url_video'], ['Facebook', 'facebook_url_video']];
function urlFor(value) {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function socialUrl(value, host, handle = false) {
  if (/^https?:\/\//i.test(value) || value.includes('.')) return urlFor(value);
  const name = value.replace(/^@/, '');
  return `https://${host}/${handle ? '@' : ''}${name}`;
}

function todayLocalDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function isCouponExpired(coupon) {
  return Boolean(coupon.expiration && String(coupon.expiration).slice(0, 10) < todayLocalDate());
}

async function openUrl(url) {
  try { await Linking.openURL(url); } catch { Alert.alert('No se pudo abrir', 'Revisa que el enlace o la aplicación estén disponibles.'); }
}

function SectionCard({ children, palette, style }) {
  return <Card style={[{ padding: 16, backgroundColor: palette.surface, borderColor: palette.border }, style]}>{children}</Card>;
}

function Action({ label, icon, url, palette }) {
  return <Pressable onPress={() => openUrl(url)} accessibilityRole="button" style={{ minWidth: 62, alignItems: 'center', marginRight: 9, paddingVertical: 8 }}>
    <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: palette.ink, fontSize: 17, fontWeight: '700' }}>{icon}</Text></View>
    <Text style={{ color: palette.ink, fontSize: 10, marginTop: 5 }}>{label}</Text>
  </Pressable>;
}

function EmptyBlock({ text, palette }) {
  return <SectionCard palette={palette}><Text style={{ color: palette.muted, fontSize: 11 }}>{text}</Text></SectionCard>;
}

function EditableBlockFrame({ block, label, selected, builderMode, palette, onSelect, onDrop, onLayout, children }) {
  const responder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 4 || Math.abs(gesture.dx) > 4,
    onPanResponderRelease: (_event, gesture) => onDrop?.(block.id, gesture.dx, gesture.dy),
  }), [block.id, onDrop]);
  return <View onLayout={onLayout} style={{ width: '100%', borderWidth: builderMode ? (selected ? 2 : 1) : 0, borderColor: selected ? palette.accent : palette.border, borderStyle: builderMode && !selected ? 'dashed' : 'solid', borderRadius: 17, padding: builderMode ? 5 : 0, backgroundColor: builderMode && selected ? palette.soft : 'transparent' }}>
    {builderMode ? <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
      <Pressable onPress={() => onSelect?.(block.id)} accessibilityRole="button" accessibilityState={{ selected }} style={{ flex: 1, minHeight: 31, justifyContent: 'center', paddingHorizontal: 9, backgroundColor: selected ? palette.button : palette.surface, borderRadius: 9, borderWidth: 1, borderColor: palette.border }}><Text numberOfLines={1} style={{ color: selected ? palette.buttonText : palette.ink, fontSize: 10, fontWeight: '800' }}>{selected ? '✓ Seleccionado · ' : 'Seleccionar · '}{label}</Text></Pressable>
      <View {...responder.panHandlers} accessible accessibilityLabel={`Arrastra para mover ${label}`} accessibilityHint="Desliza en cualquier dirección para cambiar la posición del bloque" style={{ width: 38, height: 31, alignItems: 'center', justifyContent: 'center', marginLeft: 5, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 9 }}><Text style={{ color: palette.ink, fontSize: 19, fontWeight: '800' }}>⠿</Text></View>
    </View> : null}
    {children}
  </View>;
}

export function BusinessProfileView({ store, stores = [], coupons = [], serviceHours = [], layout: suppliedLayout, onBack, onOpenCoupon, onOpenStore, desktop = false, previewOnly = false, builderMode = false, selectedBlockId, onSelectBlock, onDropBlock, onBlockLayout, isFavoriteCoupon, isFavoriteStore, onToggleCoupon, onToggleStore, favoritesReady = true }) {
  if (!store) return <View>{!previewOnly ? <Header title="Negocio" back={onBack} /> : null}<EmptyBlock text="Agrega una sucursal para previsualizar el perfil." palette={getPublicProfilePalette('classic')} /></View>;
  const company = store.companyId || {};
  const layout = normalizePublicProfileLayout(suppliedLayout || company.publicProfileLayout);
  const content = layout.content;
  const palette = getPublicProfilePalette(layout.theme);
  const storeId = Number(store.id);
  const storeCoupons = coupons.filter((item) => Number(item.storeId?.id ?? item.storeId) === storeId);
  const customerCoupons = previewOnly ? storeCoupons : storeCoupons.filter((coupon) => !isCouponExpired(coupon));
  const sales = layout.sales || { title: 'Promociones VIP', description: '', buttonLabel: 'Obtener cupón VIP', featuredCouponId: null };
  const orderedCoupons = [...customerCoupons].sort((first, second) => {
    if (Number(first.id) === Number(sales.featuredCouponId)) return -1;
    if (Number(second.id) === Number(sales.featuredCouponId)) return 1;
    return 0;
  });
  const hours = (store.service_hours?.length ? store.service_hours : serviceHours).filter((item) => Number(item.storeId?.id ?? item.storeId) === storeId);
  const images = storeCoupons.flatMap((coupon) => IMAGE_FIELDS.filter((field) => coupon[field]).map((field) => ({ uri: getMediaUrl(coupon[field]), coupon })));
  const siblingStores = stores.filter((item) => Number(item.id) !== storeId && Number(item.companyId?.id ?? item.companyId) === Number(company.id));
  const actions = [
    store.phone || company.phone ? { label: 'Llamar', icon: '☎', url: `tel:${(store.phone || company.phone).replace(/[^+\d]/g, '')}` } : null,
    store.address || (store.latitude && store.longitude) ? { label: 'Llegar', icon: '➤', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.latitude && store.longitude ? `${store.latitude},${store.longitude}` : store.address)}` } : null,
    store.website || company.website ? { label: 'Web', icon: '◎', url: urlFor(store.website || company.website) } : null,
    company.instagram ? { label: 'Instagram', icon: '◉', url: socialUrl(company.instagram, 'instagram.com', true) } : null,
    company.facebook ? { label: 'Facebook', icon: 'f', url: socialUrl(company.facebook, 'facebook.com') } : null,
    company.tiktok ? { label: 'TikTok', icon: '♪', url: socialUrl(company.tiktok, 'tiktok.com', true) } : null,
  ].filter(Boolean);
  const couponVideos = storeCoupons.flatMap((coupon) => VIDEO_FIELDS.filter(([, field]) => coupon[field]).map(([label, field]) => ({ label, url: coupon[field], coupon })));
  const videos = [
    ...(content.videoUrl ? [{ label: content.videoTitle || 'Video promocional', url: content.videoUrl }] : []),
    ...couponVideos,
  ];
  const highlights = content.highlights.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 6);
  const allTerms = storeCoupons.filter((coupon) => coupon.terms);
  const firstImage = images[0]?.uri;
  const cardStyle = { backgroundColor: palette.surface, borderColor: palette.border };

  const sections = {
    hero: () => <View style={{ backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 22, overflow: 'hidden' }}>
      {firstImage ? <Image source={{ uri: firstImage }} resizeMode="cover" accessibilityLabel={`Portada de ${store.name}`} style={{ width: '100%', height: desktop ? 300 : 220, backgroundColor: palette.soft }} /> : <View style={{ width: '100%', height: desktop ? 250 : 180, backgroundColor: palette.button, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: palette.buttonText, fontSize: 22, fontWeight: '800' }}>{store.name}</Text><Text style={{ color: palette.buttonText, opacity: 0.8, fontSize: 11, marginTop: 6 }}>Añade fotos desde el editor de contenido</Text></View>}
      <View style={{ padding: 17 }}><Text style={{ color: palette.accent, fontSize: 10, fontWeight: '800' }}>● NEGOCIO QPONS VIP</Text><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 6 }}><Text style={{ flex: 1, color: palette.ink, fontSize: 22, fontWeight: '800' }}>{store.name}</Text>{!previewOnly ? <FavoriteButton favorite={isFavoriteStore?.(store)} onPress={() => onToggleStore?.(store)} itemLabel={'el negocio ' + store.name} disabled={!favoritesReady} /> : null}</View>{store.address ? <Text style={{ color: palette.muted, fontSize: 11, marginTop: 5 }}>⌖  {store.address}{store.cityId?.[0]?.name ? `, ${store.cityId[0].name}` : ''}</Text> : null}<Text style={{ color: palette.muted, fontSize: 12, lineHeight: 19, marginTop: 10 }}>{store.description || company.description || 'Agrega una descripción para presentar tu negocio.'}</Text></View>
    </View>,
    contact: () => actions.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>{actions.map((action) => <Action key={action.label} {...action} palette={palette} />)}</ScrollView> : previewOnly ? <EmptyBlock text="Añade teléfono, dirección, sitio o redes para mostrar botones de contacto." palette={palette} /> : null,
    location: () => {
      const address = [store.address, store.cityId?.[0]?.name].filter(Boolean).join(', ');
      const coordinates = store.latitude && store.longitude ? `${store.latitude},${store.longitude}` : '';
      if (!address && !coordinates && !previewOnly) return null;
      const destination = encodeURIComponent(coordinates || address || store.name);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${destination}`;
      return address || coordinates || previewOnly ? <SectionCard palette={palette}>
        <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '800' }}>Ubicación y llegada</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: palette.soft, borderRadius: 14, padding: 12, marginTop: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}><Text style={{ color: palette.accent, fontSize: 18, fontWeight: '800' }}>⌖</Text></View>
          <View style={{ flex: 1 }}><Text style={{ color: palette.ink, fontSize: 11, fontWeight: '700' }}>{store.name}</Text><Text style={{ color: palette.muted, fontSize: 10, lineHeight: 15, marginTop: 3 }}>{address || (coordinates ? `${store.latitude}, ${store.longitude}` : 'Agrega la dirección de esta sucursal.')}</Text></View>
        </View>
        <View style={{ overflow: 'hidden', borderRadius: 14, marginTop: 10 }}><BusinessLocationMap latitude={store.latitude} longitude={store.longitude} address={address} name={store.name} desktop={desktop} /></View>
        {previewOnly ? <View style={{ backgroundColor: palette.button, borderRadius: 22, alignItems: 'center', paddingVertical: 10, marginTop: 10 }}><Text style={{ color: palette.buttonText, fontSize: 10, fontWeight: '800' }}>Abrir ruta en GPS →</Text></View> : <Pressable onPress={() => openUrl(mapsUrl)} accessibilityRole="link" style={{ backgroundColor: palette.button, borderRadius: 22, alignItems: 'center', paddingVertical: 10, marginTop: 10 }}><Text style={{ color: palette.buttonText, fontSize: 10, fontWeight: '800' }}>Abrir ruta en GPS →</Text></Pressable>}
      </SectionCard> : null;
    },
    carousel: () => orderedCoupons.length ? <SectionCard palette={palette}>
      <Text style={{ color: palette.ink, fontSize: 17, fontWeight: '800' }}>Lo más destacado</Text>
      <Text style={{ color: palette.muted, fontSize: 10, marginTop: 4, marginBottom: 10 }}>Desliza para descubrir las promociones del negocio.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast" contentContainerStyle={{ paddingRight: 4 }}>
        {orderedCoupons.map((coupon) => {
          const card = <View style={{ width: desktop ? 260 : 235, backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 16, overflow: 'hidden' }}>
            {coupon.image_1 ? <Image source={{ uri: getMediaUrl(coupon.image_1) }} resizeMode="cover" accessibilityLabel={`Imagen de ${coupon.name}`} style={{ width: '100%', height: 118, backgroundColor: palette.soft }} /> : <View style={{ width: '100%', height: 92, backgroundColor: palette.soft, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: palette.accent, fontSize: 24, fontWeight: '800' }}>VIP</Text></View>}
            <View style={{ padding: 11 }}><Text numberOfLines={1} style={{ color: palette.accent, fontSize: 9, fontWeight: '800' }}>PROMOCIÓN VIP</Text><Text numberOfLines={2} style={{ color: palette.ink, fontSize: 13, fontWeight: '800', marginTop: 4 }}>{coupon.name}</Text><Text numberOfLines={2} style={{ color: palette.muted, fontSize: 10, lineHeight: 15, marginTop: 4 }}>{coupon.description || 'Consulta este beneficio en la sucursal.'}</Text><View style={{ backgroundColor: palette.button, borderRadius: 18, alignItems: 'center', paddingVertical: 8, marginTop: 9 }}><Text style={{ color: palette.buttonText, fontSize: 10, fontWeight: '800' }}>Ver promoción →</Text></View></View>
          </View>;
          return previewOnly ? <View key={coupon.id} style={{ marginRight: 10 }}>{card}</View> : <View key={coupon.id} style={{ marginRight: 10, position: 'relative' }}><Pressable onPress={() => onOpenCoupon(coupon)} accessibilityRole="button" accessibilityLabel={'Ver promoción ' + coupon.name}>{card}</Pressable><FavoriteButton favorite={isFavoriteCoupon?.(coupon)} onPress={() => onToggleCoupon?.(coupon)} itemLabel={'el cupón ' + coupon.name} disabled={!favoritesReady} style={{ position: 'absolute', top: 8, right: 18 }} /></View>;
        })}
      </ScrollView>
    </SectionCard> : previewOnly ? <EmptyBlock text="Al publicar cupones activos, se mostrarán aquí en un carrusel deslizable." palette={palette} /> : null,
    promotions: () => <View>
      <Text style={{ color: palette.ink, fontSize: 19, fontWeight: '800', marginBottom: 5 }}>{sales.title}</Text>
      {sales.description ? <Text style={{ color: palette.muted, fontSize: 11, lineHeight: 17, marginBottom: 10 }}>{sales.description}</Text> : null}
      {orderedCoupons.length ? orderedCoupons.map((coupon) => {
        const expired = isCouponExpired(coupon);
        const featured = Number(coupon.id) === Number(sales.featuredCouponId);
        return <View key={coupon.id} style={[cardStyle, { position: 'relative', borderWidth: 1, borderRadius: 19, overflow: 'hidden', marginBottom: 12 }]}>{!previewOnly ? <FavoriteButton favorite={isFavoriteCoupon?.(coupon)} onPress={() => onToggleCoupon?.(coupon)} itemLabel={'el cupón ' + coupon.name} disabled={!favoritesReady} style={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }} /> : null}
          {coupon.image_1 ? <Image source={{ uri: getMediaUrl(coupon.image_1) }} resizeMode="cover" style={{ width: '100%', height: 145, backgroundColor: palette.soft }} /> : null}
          <View style={{ padding: 14 }}>
            <Text style={{ color: palette.accent, fontSize: 9, fontWeight: '800' }}>{featured ? 'OFERTA DESTACADA · QPONS VIP' : 'BENEFICIO QPONS VIP'}</Text>
            <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '800', marginTop: 5 }}>{coupon.name}</Text>
            <Text style={{ color: palette.muted, fontSize: 11, lineHeight: 17, marginTop: 5 }}>{coupon.description || 'Consulta esta promoción en la sucursal.'}</Text>
            {coupon.expiration ? <Text style={{ color: expired ? palette.accent : palette.muted, fontSize: 10, marginTop: 8 }}>{expired ? 'Venció' : 'Válido hasta'} {new Date(coupon.expiration).toLocaleDateString('es-MX')}</Text> : null}
            {expired ? <Text style={{ color: palette.accent, fontSize: 10, fontWeight: '700', marginTop: 10 }}>Esta promoción vencida solo se muestra en tu vista previa.</Text> : previewOnly ? <View style={{ backgroundColor: palette.button, borderRadius: 22, alignItems: 'center', paddingVertical: 11, marginTop: 12 }}><Text style={{ color: palette.buttonText, fontSize: 11, fontWeight: '800' }}>{sales.buttonLabel} →</Text></View> : <Pressable onPress={() => onOpenCoupon(coupon)} accessibilityRole="button" style={{ backgroundColor: palette.button, borderRadius: 22, alignItems: 'center', paddingVertical: 11, marginTop: 12 }}><Text style={{ color: palette.buttonText, fontSize: 11, fontWeight: '800' }}>{sales.buttonLabel} →</Text></Pressable>}
          </View>
        </View>;
      }) : <EmptyBlock text={previewOnly ? 'Tus promociones vigentes aparecerán aquí cuando las publiques.' : 'Este negocio no tiene promociones vigentes por ahora.'} palette={palette} />}
    </View>,
    text: () => content.text ? <SectionCard palette={palette}><Text style={{ color: palette.accent, fontSize: 10, fontWeight: '800', marginBottom: 6 }}>UNA NOTA DEL NEGOCIO</Text><Text style={{ color: palette.ink, fontSize: 14, lineHeight: 22 }}>{content.text}</Text></SectionCard> : previewOnly ? <EmptyBlock text="Escribe un mensaje para presentar tu negocio, anunciar una temporada o invitar a tus clientes." palette={palette} /> : null,
    image: () => content.imageUrl ? <Image source={{ uri: getMediaUrl(content.imageUrl) }} resizeMode="cover" accessibilityLabel={content.imageAlt || 'Imagen promocional del negocio'} style={{ width: '100%', height: desktop ? 300 : 210, borderRadius: 19, backgroundColor: palette.soft }} /> : previewOnly ? <EmptyBlock text="Sube una imagen promocional desde Contenido de bloques." palette={palette} /> : null,
    gallery: () => images.length > 1 ? <SectionCard palette={palette}><Text style={{ color: palette.ink, fontSize: 16, fontWeight: '800', marginBottom: 9 }}>Galería de fotos</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{images.slice(1).map((image, index) => <Image key={`${image.uri}-${index}`} source={{ uri: image.uri }} resizeMode="cover" accessibilityLabel={`Foto ${index + 2} de ${store.name}`} style={{ width: 190, height: 125, borderRadius: 14, marginRight: 9, backgroundColor: palette.soft }} />)}</ScrollView></SectionCard> : previewOnly ? <EmptyBlock text="Agrega fotos para mostrar una galería en tu perfil." palette={palette} /> : null,
    videos: () => videos.length ? <SectionCard palette={palette}><Text style={{ color: palette.ink, fontSize: 17, fontWeight: '800' }}>Experiencia en video</Text><Text style={{ color: palette.muted, fontSize: 10, marginTop: 4 }}>Abre el video en la plataforma donde fue publicado.</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{videos.map((video, index) => previewOnly ? <View key={`${video.url}-${index}`} style={{ backgroundColor: palette.button, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 10, marginRight: 7, marginTop: 8 }}><Text style={{ color: palette.buttonText, fontSize: 10, fontWeight: '700' }}>▶ Ver {video.label}</Text></View> : <Pressable key={`${video.url}-${index}`} onPress={() => openUrl(urlFor(video.url))} accessibilityRole="link" style={{ backgroundColor: palette.button, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 10, marginRight: 7, marginTop: 8 }}><Text style={{ color: palette.buttonText, fontSize: 10, fontWeight: '700' }}>▶ Ver {video.label}</Text></Pressable>)}</View></SectionCard> : previewOnly ? <EmptyBlock text="Añade un enlace de video aquí o en los datos de tus cupones." palette={palette} /> : null,
    highlights: () => highlights.length ? <SectionCard palette={palette}><Text style={{ color: palette.ink, fontSize: 16, fontWeight: '800' }}>Lo que hace especial a este negocio</Text>{highlights.map((item, index) => <View key={`${item}-${index}`} style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 11 }}><Text style={{ color: palette.accent, fontSize: 14, fontWeight: '900', marginRight: 9 }}>✓</Text><Text style={{ flex: 1, color: palette.ink, fontSize: 11, lineHeight: 17 }}>{item}</Text></View>)}</SectionCard> : previewOnly ? <EmptyBlock text="Agrega servicios y beneficios, uno por línea, desde Contenido de bloques." palette={palette} /> : null,
    hours: () => hours.length ? <SectionCard palette={palette}><Text style={{ color: palette.ink, fontSize: 15, fontWeight: '800', marginBottom: 5 }}>Horarios de servicio</Text>{hours.map((item) => <View key={item.id || item.dayOfWeek} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: palette.border }}><Text style={{ color: palette.muted, fontSize: 11 }}>{item.dayOfWeek}</Text><Text style={{ color: palette.ink, fontSize: 11, fontWeight: '600' }}>{item.openingTime?.slice(0, 5) || '—'} – {item.closingTime?.slice(0, 5) || '—'}</Text></View>)}</SectionCard> : previewOnly ? <EmptyBlock text="Configura los horarios de tus sucursales para mostrarlos aquí." palette={palette} /> : null,
    branches: () => siblingStores.length ? <SectionCard palette={palette}><Text style={{ color: palette.ink, fontSize: 15, fontWeight: '800' }}>Otras sucursales</Text>{siblingStores.map((branch) => previewOnly ? <View key={branch.id} style={{ paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: palette.border }}><Text style={{ color: palette.ink, fontSize: 11, fontWeight: '700' }}>{branch.name}</Text><Text style={{ color: palette.muted, fontSize: 10, marginTop: 3 }}>{branch.address || 'Dirección pendiente'}</Text></View> : <Pressable key={branch.id} onPress={() => onOpenStore?.(branch)} accessibilityRole="button" style={{ paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: palette.border }}><Text style={{ color: palette.ink, fontSize: 11, fontWeight: '700' }}>{branch.name} →</Text><Text style={{ color: palette.muted, fontSize: 10, marginTop: 3 }}>{branch.address || 'Dirección pendiente'}</Text></Pressable>)}</SectionCard> : previewOnly ? <EmptyBlock text="Si agregas más sucursales de la empresa, aparecerán aquí." palette={palette} /> : null,
    terms: () => allTerms.length ? <SectionCard palette={palette}><Text style={{ color: palette.ink, fontSize: 15, fontWeight: '800' }}>Términos y condiciones</Text>{allTerms.map((coupon) => <View key={coupon.id} style={{ marginTop: 10 }}><Text style={{ color: palette.ink, fontSize: 11, fontWeight: '700' }}>{coupon.name}</Text><Text style={{ color: palette.muted, fontSize: 10, lineHeight: 16, marginTop: 4 }}>{coupon.terms}</Text></View>)}</SectionCard> : previewOnly ? <EmptyBlock text="Los términos de tus promociones aparecerán aquí." palette={palette} /> : null,
  };

  const blocks = layout.blocks.filter((block) => block.visible).map((block) => ({ ...block, content: sections[block.id]?.() })).filter((block) => block.content);
  // En escritorio, solo la portada y los formatos visuales protagonistas ocupan todo el ancho.
  // El resto se acomoda en dos columnas para evitar que la ficha parezca una pantalla móvil ampliada.
  const fullWidthBlocks = ['hero', 'contact', 'carousel', 'image'];
  return <View style={{ width: '100%', backgroundColor: palette.page, borderRadius: previewOnly ? 16 : 0, padding: previewOnly ? (desktop ? 12 : 7) : 0 }}>
    <View style={{ width: '100%', maxWidth: desktop && !previewOnly ? 1920 : '100%', alignSelf: 'center', paddingHorizontal: desktop && !previewOnly ? 32 : 0, paddingTop: previewOnly ? 10 : desktop ? 22 : 0, paddingBottom: desktop && !previewOnly ? 24 : 0 }}>
      {!previewOnly ? <Header title={store.name} back={onBack} /> : null}
      <View style={{ flexDirection: desktop ? 'row' : 'column', flexWrap: desktop ? 'wrap' : 'nowrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        {blocks.map((block) => <View key={block.id} style={{ width: desktop ? (fullWidthBlocks.includes(block.id) ? '100%' : '48.5%') : '100%' }}><EditableBlockFrame block={block} label={PUBLIC_PROFILE_BLOCKS.find((item) => item.id === block.id)?.label || block.id} selected={selectedBlockId === block.id} builderMode={builderMode} palette={palette} onSelect={onSelectBlock} onDrop={onDropBlock} onLayout={(event) => onBlockLayout?.(block.id, event.nativeEvent.layout)}>{block.content}</EditableBlockFrame></View>)}
      </View>
    </View>
  </View>;
}
