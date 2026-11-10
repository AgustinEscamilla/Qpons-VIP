import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { Card, Header, Label } from '../../shared/components/UI.js';
import { FavoriteButton } from '../../shared/components/FavoriteButton.js';
import { LocationPicker } from '../location/LocationPicker.js';
import { CatalogAlerts, CatalogPromotionalVideos } from './CatalogPromotionalVideos.js';
import { getMediaUrl } from '../../services/api/client.js';
import { distanceKm, getDefaultCustomerLocation, sortStoresByDistance } from '../location/customerLocation.js';
import { colors as C } from '../../shared/theme/colors.js';
import { getPublicProfilePalette } from '../business/publicProfileLayout.js';

function getStoreCategoryIds(store, categories) {
  const companyId = store.companyId?.id;
  if (companyId == null) return [];
  return categories.filter((category) => category.companies?.some((company) => String(company.id) === String(companyId))).map((category) => String(category.id));
}

function getCouponStore(coupon, stores) {
  const storeId = coupon.storeId?.id ?? coupon.storeId;
  return stores.find((store) => String(store.id) === String(storeId)) || (typeof coupon.storeId === 'object' ? coupon.storeId : null);
}

// Presenta únicamente sucursales reales del catálogo para mantener Inicio enfocado.
export function CustomerNearbyCatalog({ stores = [], coupons = [], categories = [], cities = [], location, onLocationChange, alerts = [], loading, error, onBack, onOpenCoupon, onOpenStore, onViewAllCoupons, title = 'QPONS VIP · McAllen, TX', showAllCoupons = false, isFavoriteCoupon, isFavoriteStore, onToggleCoupon, onToggleStore, favoritesReady = true }) {
  const [showAllNearby, setShowAllNearby] = React.useState(false);
  const [showAllCouponResults, setShowAllCouponResults] = React.useState(false);
  const [showAllBusinesses, setShowAllBusinesses] = React.useState(false);
  const [exploreTab, setExploreTab] = React.useState('coupons');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [selectedCity, setSelectedCity] = React.useState('all');
  const [onlyWithCoupons, setOnlyWithCoupons] = React.useState(false);
  const resolvedLocation = location || getDefaultCustomerLocation(cities);
  const activeCityId = selectedCity !== 'all' ? selectedCity : location?.source === 'city' ? String(location.cityId) : 'all';
  const selectLocation = (nextLocation) => {
    onLocationChange?.(nextLocation);
    setSelectedCity(nextLocation.source === 'city' ? String(nextLocation.cityId) : 'all');
    setShowAllNearby(false);
    setShowAllBusinesses(false);
  };
  const availableStores = stores;
  const matchingCoupons = coupons.filter((coupon) => {
    const store = getCouponStore(coupon, stores);
    const categoryMatches = selectedCategory === 'all' || getStoreCategoryIds(store || {}, categories).includes(selectedCategory);
    const cityMatches = activeCityId === 'all' || store?.cityId?.some((city) => String(city.id) === activeCityId);
    return !showAllCoupons || (categoryMatches && cityMatches);
  });
  const filteredStores = availableStores.filter((store) => {
    const categoryMatches = selectedCategory === 'all' || getStoreCategoryIds(store, categories).includes(selectedCategory);
    const cityMatches = activeCityId === 'all' || store.cityId?.some((city) => String(city.id) === activeCityId);
    const hasCoupons = coupons.some((coupon) => String(coupon.storeId?.id ?? coupon.storeId) === String(store.id));
    return categoryMatches && cityMatches && (!onlyWithCoupons || hasCoupons);
  });
  const availableCategories = categories.filter((category) => stores.some((store) => getStoreCategoryIds(store, categories).includes(String(category.id))));
  const availableCities = cities.filter((city) => stores.some((store) => store.cityId?.some((storeCity) => String(storeCity.id) === String(city.id))));
  const homeStores = availableStores.filter((store) => location?.source !== 'city' || store.cityId?.some((city) => String(city.id) === String(location.cityId)));
  const businessResults = sortStoresByDistance(showAllCoupons ? filteredStores : homeStores, resolvedLocation);
  const locationLabel = resolvedLocation?.label || 'McAllen, TX';
  const featuredCoupons = matchingCoupons.slice(0, showAllCouponResults ? matchingCoupons.length : 5);
  const displayedCouponList = showAllCouponResults ? matchingCoupons : matchingCoupons.slice(0, 5);

  return (
    <View>
      {onBack ? <Header title={title} back={onBack} /> : <View style={{ marginBottom: 16 }}><Label style={{ fontSize: 16 }}>QPONS VIP · {locationLabel}</Label><Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{locationLabel} · Promociones y negocios afiliados</Text></View>}
      <LocationPicker location={location} cities={cities} onChange={selectLocation} />
      {loading ? <Text style={{ color: C.muted, fontSize: 12, marginBottom: 10 }}>Cargando negocios...</Text> : null}
      {error ? <Text accessibilityRole="alert" style={{ color: C.pink, fontSize: 12, marginBottom: 10 }}>No se pudo conectar con el catálogo. Revisa que el servidor esté encendido.</Text> : null}
      {!loading && !error ? <Text style={{ color: C.green, fontSize: 12, marginBottom: 12 }}>● {showAllCoupons ? matchingCoupons.length : coupons.length} promociones disponibles</Text> : null}
      {showAllCoupons ? <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', backgroundColor: C.pale, borderRadius: 24, padding: 4, marginBottom: 12 }}>
          {[
            ['coupons', 'Cupones'],
            ['businesses', 'Negocios'],
          ].map(([key, label]) => <Pressable key={key} onPress={() => { setExploreTab(key); setShowAllCouponResults(false); setShowAllBusinesses(false); }} accessibilityRole="button" accessibilityState={{ selected: exploreTab === key }} style={{ flex: 1, alignItems: 'center', borderRadius: 20, paddingVertical: 9, backgroundColor: exploreTab === key ? C.navy : 'transparent' }}><Text style={{ color: exploreTab === key ? C.white : C.muted, fontSize: 11, fontWeight: '700' }}>{label}</Text></Pressable>)}
        </View>
        <Text style={{ color: C.navy, fontSize: 11, fontWeight: '700', marginBottom: 6 }}>Categoría</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingBottom: 8 }}>
          {[['all', 'Todas'], ...availableCategories.map((category) => [String(category.id), category.name])].map(([value, label]) => <Pressable key={value} onPress={() => { setSelectedCategory(value); setShowAllCouponResults(false); setShowAllBusinesses(false); }} accessibilityRole="button" accessibilityState={{ selected: selectedCategory === value }} style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: 18, backgroundColor: selectedCategory === value ? C.navy : C.white, borderWidth: 1, borderColor: selectedCategory === value ? C.navy : '#E5EAF4' }}><Text style={{ color: selectedCategory === value ? C.white : C.navy, fontSize: 10, fontWeight: '700' }}>{label}</Text></Pressable>)}
        </ScrollView>
        <Text style={{ color: C.navy, fontSize: 11, fontWeight: '700', marginTop: 2, marginBottom: 6 }}>Ciudad</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingBottom: 8 }}>
          {[['all', 'Todas'], ...availableCities.map((city) => [String(city.id), city.name])].map(([value, label]) => <Pressable key={value} onPress={() => { setSelectedCity(value); setShowAllCouponResults(false); setShowAllBusinesses(false); }} accessibilityRole="button" accessibilityState={{ selected: activeCityId === value }} style={{ paddingHorizontal: 13, paddingVertical: 8, borderRadius: 18, backgroundColor: activeCityId === value ? C.navy : C.white, borderWidth: 1, borderColor: activeCityId === value ? C.navy : '#E5EAF4' }}><Text style={{ color: activeCityId === value ? C.white : C.navy, fontSize: 10, fontWeight: '700' }}>{label}</Text></Pressable>)}
        </ScrollView>
        {exploreTab === 'businesses' ? <Pressable onPress={() => setOnlyWithCoupons((current) => !current)} accessibilityRole="checkbox" accessibilityState={{ checked: onlyWithCoupons }} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, marginTop: 2, borderRadius: 18, backgroundColor: onlyWithCoupons ? '#E8F7EF' : C.white, borderWidth: 1, borderColor: onlyWithCoupons ? '#B9E7CF' : '#E5EAF4' }}><Text style={{ color: onlyWithCoupons ? C.green : C.muted, fontSize: 12 }}>{onlyWithCoupons ? '✓' : '○'}</Text><Text style={{ color: C.navy, fontSize: 10, fontWeight: '700' }}>Solo negocios con cupones activos</Text></Pressable> : null}
        {selectedCategory !== 'all' || activeCityId !== 'all' || onlyWithCoupons ? <Pressable onPress={() => { setSelectedCategory('all'); setSelectedCity('all'); setOnlyWithCoupons(false); if (location?.source === 'city') onLocationChange?.(null); setShowAllCouponResults(false); setShowAllBusinesses(false); }} accessibilityRole="button" style={{ alignSelf: 'flex-start', paddingVertical: 8 }}><Text style={{ color: C.pink, fontSize: 11, fontWeight: '700' }}>Limpiar filtros</Text></Pressable> : null}
      </View> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, display: showAllCoupons && exploreTab === 'businesses' ? 'none' : 'flex' }}>
        <Label style={{ fontSize: 21 }}>{showAllCoupons ? 'Cupones de todas las tiendas' : 'Exclusivas VIP'}</Label>
        {!showAllCoupons && featuredCoupons.length > 0 ? <Text style={{ color: C.pink, backgroundColor: '#FFE0E5', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4, fontSize: 10, fontWeight: '700', marginLeft: 8 }}>NUEVOS</Text> : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 6, paddingRight: 8 }} style={{ marginHorizontal: -4, marginBottom: 12, display: showAllCoupons ? 'none' : 'flex' }}>
        {featuredCoupons.map((coupon) => {
          const store = stores.find((item) => Number(item.id) === Number(coupon.storeId?.id ?? coupon.storeId));
          const couponImage = coupon.image_1 ? getMediaUrl(coupon.image_1) : '';
          return <View key={`featured-coupon-${coupon.id}`} style={{ width: 260, marginHorizontal: 4, position: 'relative' }}>
            <Pressable onPress={() => onOpenCoupon(coupon)} accessibilityRole="button" style={{ width: '100%', backgroundColor: C.white, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#EEF0F5' }}>
            {couponImage ? <Image source={{ uri: couponImage }} resizeMode="cover" accessibilityLabel={`Imagen de ${coupon.name}`} style={{ width: '100%', height: 130, backgroundColor: C.pale }} /> : <View style={{ height: 130, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.white, fontSize: 13, fontWeight: '800' }}>QPONS VIP</Text><Text style={{ color: '#FFD7E1', fontSize: 11, marginTop: 5 }}>Promoción exclusiva</Text></View>}
            <View style={{ padding: 13 }}><Text style={{ color: C.pink, fontSize: 10, fontWeight: '800' }}>{store?.name || store?.companyId?.name || 'PROMOCIÓN VIP'}</Text><Label style={{ fontSize: 15, marginTop: 5 }}>{coupon.name}</Label><Text numberOfLines={2} style={{ color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 4 }}>{coupon.description || 'Consulta los detalles y condiciones de esta promoción.'}</Text><Text style={{ color: C.navy, fontSize: 10, fontWeight: '700', marginTop: 9 }}>{coupon.code ? `Código ${coupon.code}` : 'Ver cupón ›'}</Text></View>
            </Pressable>
            <FavoriteButton favorite={isFavoriteCoupon?.(coupon)} onPress={() => onToggleCoupon?.(coupon)} itemLabel={'el cupón ' + coupon.name} disabled={!favoritesReady} style={{ position: 'absolute', top: 8, right: 8 }} />
          </View>;
        })}
      </ScrollView>
      {!showAllCoupons && matchingCoupons.length > 5 ? <Pressable onPress={() => onViewAllCoupons ? onViewAllCoupons() : setShowAllCouponResults(true)} accessibilityRole="button" accessibilityLabel="Ver más cupones" style={{ alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 10, marginTop: -4, marginBottom: 12, borderRadius: 22, backgroundColor: C.white, borderWidth: 1, borderColor: '#E5EAF4' }}><Text style={{ color: C.pink, fontSize: 12, fontWeight: '800' }}>Ver más cupones →</Text></Pressable> : null}
      {showAllCoupons && exploreTab === 'coupons' ? <View style={{ gap: 9, marginBottom: 16 }}>
        {displayedCouponList.map((coupon) => {
          const store = stores.find((item) => Number(item.id) === Number(coupon.storeId?.id ?? coupon.storeId));
          const couponImage = coupon.image_1 ? getMediaUrl(coupon.image_1) : '';
          const storeName = store?.name || coupon.storeId?.name || coupon.storeId?.companyId?.name || 'Tienda participante';
          return <View key={coupon.documentId || coupon.id} style={{ position: 'relative' }}>
            <Pressable onPress={() => onOpenCoupon(coupon)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 16, padding: 10, borderWidth: 1, borderColor: '#EEF0F5' }}>
            {couponImage ? <Image source={{ uri: couponImage }} resizeMode="cover" accessibilityLabel={`Imagen de ${coupon.name}`} style={{ width: 78, height: 78, borderRadius: 12, backgroundColor: C.pale }} /> : <View style={{ width: 78, height: 78, borderRadius: 12, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.pink, fontSize: 20, fontWeight: '900' }}>Q</Text></View>}
            <View style={{ flex: 1, paddingHorizontal: 11 }}><Text numberOfLines={1} style={{ color: C.pink, fontSize: 10, fontWeight: '800' }}>{storeName}</Text><Label numberOfLines={2} style={{ fontSize: 13, marginTop: 4 }}>{coupon.name}</Label><Text numberOfLines={2} style={{ color: C.muted, fontSize: 10, lineHeight: 14, marginTop: 4 }}>{coupon.description || 'Consulta los detalles de esta promoción.'}</Text><Text style={{ color: C.green, fontSize: 9, fontWeight: '700', marginTop: 5 }}>{coupon.expiration ? `Válido hasta ${new Date(coupon.expiration).toLocaleDateString('es-MX')}` : 'Disponible en sucursal'}</Text></View>
            <Text style={{ color: C.navy, fontSize: 10, fontWeight: '800' }}>Ver ›</Text>
            </Pressable>
            <FavoriteButton favorite={isFavoriteCoupon?.(coupon)} onPress={() => onToggleCoupon?.(coupon)} itemLabel={'el cupón ' + coupon.name} disabled={!favoritesReady} style={{ position: 'absolute', top: 7, right: 7 }} />
          </View>;
        })}
      </View> : null}
      {showAllCoupons && exploreTab === 'coupons' && matchingCoupons.length > 5 ? <Pressable onPress={() => setShowAllCouponResults((current) => !current)} accessibilityRole="button" accessibilityLabel={showAllCouponResults ? 'Ver menos cupones' : 'Ver más cupones'} style={{ alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 11, marginTop: -6, marginBottom: 14, borderRadius: 22, backgroundColor: C.white, borderWidth: 1, borderColor: '#E5EAF4' }}><Text style={{ color: C.pink, fontSize: 12, fontWeight: '800' }}>{showAllCouponResults ? 'Ver menos cupones ↑' : 'Ver más cupones →'}</Text></Pressable> : null}
      {!loading && !error && (showAllCoupons ? exploreTab === 'coupons' && matchingCoupons.length === 0 : featuredCoupons.length === 0) ? <Card><Text style={{ color: C.muted, fontSize: 12 }}>Todavía no hay promociones publicadas.</Text></Card> : null}
      {!showAllCoupons ? <CatalogPromotionalVideos stores={stores} coupons={coupons} /> : null}
      {(!showAllCoupons || exploreTab === 'businesses') ? <Label style={{ fontSize: 22, marginVertical: 12 }}>{showAllCoupons ? 'Negocios' : 'Negocios cerca de ti'}</Label> : null}
      {(!showAllCoupons || exploreTab === 'businesses') && !loading && !error && businessResults.length === 0 ? (
        <Card><Text style={{ color: C.muted, fontSize: 12, lineHeight: 18 }}>{selectedCategory !== 'all' || activeCityId !== 'all' || onlyWithCoupons ? 'No hay negocios que coincidan con estos filtros. Prueba otra categoría o ciudad.' : 'Todavía no hay sucursales publicadas. Cuando un negocio registre su ubicación, aparecerá aquí.'}</Text></Card>
      ) : (!showAllCoupons || exploreTab === 'businesses') ? businessResults.slice(0, showAllCoupons ? (showAllBusinesses ? businessResults.length : 5) : (showAllNearby ? businessResults.length : 5)).map((store) => {
        const coupon = coupons.find((item) => Number(item.storeId?.id ?? item.storeId) === Number(store.id));
        const storeCategoryNames = categories.filter((category) => getStoreCategoryIds(store, categories).includes(String(category.id))).map((category) => category.name).join(', ');
        const storeCouponCount = coupons.filter((item) => Number(item.storeId?.id ?? item.storeId) === Number(store.id)).length;
        const storeDistance = distanceKm(resolvedLocation, store);
        const companyLayout = store.companyId?.publicProfileLayout;
        const cardPalette = getPublicProfilePalette(companyLayout?.theme);
        const imageUrl = companyLayout?.content?.imageUrl || coupon?.image_1 || '';
        const image = imageUrl ? getMediaUrl(imageUrl) : '';
        return (
          <View key={`nearby-store-${store.id}`} style={{ position: 'relative' }}>
            <Pressable onPress={() => onOpenStore?.(store)} accessibilityRole="button" accessibilityLabel={`Ver perfil de ${store.name}`} style={{ backgroundColor: cardPalette.surface, borderRadius: 24, padding: 15, paddingRight: 56, marginBottom: 10, borderWidth: 1, borderColor: cardPalette.border, flexDirection: 'row', alignItems: 'center' }}>
            {image ? <Image source={{ uri: image }} resizeMode="cover" accessibilityLabel={`Imagen de ${store.name}`} style={{ width: 64, height: 64, borderRadius: 32, marginRight: 12, backgroundColor: C.pale }} /> : (
              <View accessibilityElementsHidden style={{ width: 64, height: 64, borderRadius: 32, marginRight: 12, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.pink, fontSize: 23, fontWeight: '800' }}>{store.name?.trim()?.charAt(0)?.toUpperCase() || 'Q'}</Text></View>
            )}
            <View style={{ flex: 1 }}>
              <Label style={{ fontSize: 16, color: cardPalette.ink }}>{store.name}</Label>
              <Text style={{ color: cardPalette.muted, fontSize: 11, lineHeight: 16, marginTop: 3 }}>{store.address || store.cityId?.[0]?.name || store.description || store.companyId?.name || 'Negocio afiliado a QPONS VIP'}</Text>
              {storeDistance !== null ? <Text style={{ color: cardPalette.accent, fontSize: 10, marginTop: 3 }}>A {storeDistance < 10 ? storeDistance.toFixed(1) : Math.round(storeDistance)} km</Text> : null}
              {storeCategoryNames ? <Text style={{ color: cardPalette.muted, fontSize: 10, marginTop: 3 }}>{storeCategoryNames}</Text> : null}
              <Text style={{ color: cardPalette.accent, fontSize: 10, fontWeight: '700', marginTop: 6 }}>{storeCouponCount} {storeCouponCount === 1 ? 'promoción activa' : 'promociones activas'}</Text>
              <Text style={{ color: cardPalette.accent, fontSize: 11, fontWeight: '700', marginTop: 4 }}>{coupon ? 'Ver negocio y promociones →' : 'Ver perfil del negocio →'}</Text>
            </View>
            </Pressable>
            <FavoriteButton favorite={isFavoriteStore?.(store)} onPress={() => onToggleStore?.(store)} itemLabel={'el negocio ' + store.name} disabled={!favoritesReady} style={{ position: 'absolute', top: 8, right: 8 }} />
          </View>
        );
      }) : null}
      {(!showAllCoupons || exploreTab === 'businesses') && businessResults.length > 5 ? <Pressable onPress={() => showAllCoupons ? setShowAllBusinesses((current) => !current) : setShowAllNearby((current) => !current)} accessibilityRole="button" accessibilityLabel={(showAllCoupons ? showAllBusinesses : showAllNearby) ? 'Ver menos negocios' : 'Ver m\u00e1s negocios'} style={{ alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 11, marginTop: 2, marginBottom: 12, borderRadius: 22, backgroundColor: C.white, borderWidth: 1, borderColor: '#E5EAF4' }}><Text style={{ color: C.pink, fontSize: 12, fontWeight: '800' }}>{(showAllCoupons ? showAllBusinesses : showAllNearby) ? 'Ver menos negocios' : 'Ver m\u00e1s negocios'}</Text></Pressable> : null}
      {!showAllCoupons ? <CatalogAlerts alerts={alerts} /> : null}
    </View>
  );
}
