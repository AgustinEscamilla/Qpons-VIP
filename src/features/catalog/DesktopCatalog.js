import React from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import { Card, Label } from '../../shared/components/UI.js';
import { FavoriteButton } from '../../shared/components/FavoriteButton.js';
import { CatalogAlerts, CatalogPromotionalVideos } from './CatalogPromotionalVideos.js';
import { getMediaUrl } from '../../services/api/client.js';
import { colors as C } from '../../shared/theme/colors.js';
import { getPublicProfilePalette } from '../business/publicProfileLayout.js';
import { distanceKm, getDefaultCustomerLocation, sortStoresByDistance } from '../location/customerLocation.js';

function getStoreCategoryIds(store, categories) {
  const companyId = store.companyId?.id;
  if (companyId == null) return [];
  return categories.filter((category) => category.companies?.some((company) => String(company.id) === String(companyId))).map((category) => String(category.id));
}

function getCouponStore(coupon, stores) {
  const storeId = coupon.storeId?.id ?? coupon.storeId;
  return stores.find((store) => String(store.id) === String(storeId)) || (typeof coupon.storeId === 'object' ? coupon.storeId : null);
}

// Catálogo de escritorio: filtros laterales y promociones en cuadrícula.
export function DesktopCatalog({ stores, coupons, categories = [], cities = [], location, onLocationChange, alerts = [], loading, error, onOpenCoupon, onOpenStore, showAllCoupons = false, isFavoriteCoupon, isFavoriteStore, onToggleCoupon, onToggleStore, favoritesReady = true }) {
  const [search, setSearch] = React.useState('');
  const [showAllNearby, setShowAllNearby] = React.useState(false);
  const [showAllCouponResults, setShowAllCouponResults] = React.useState(false);
  const [showAllBusinessResults, setShowAllBusinessResults] = React.useState(false);
  const [exploreTab, setExploreTab] = React.useState('coupons');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [selectedCity, setSelectedCity] = React.useState('all');
  const [onlyWithCoupons, setOnlyWithCoupons] = React.useState(false);
  const resolvedLocation = location || getDefaultCustomerLocation(cities);
  const activeCityId = selectedCity !== 'all' ? selectedCity : location?.source === 'city' ? String(location.cityId) : 'all';
  const visibleStores = stores.filter((store) => `${store.name || ''} ${store.description || ''} ${store.address || ''} ${store.companyId?.name || ''}`.toLocaleLowerCase('es-MX').includes(search.trim().toLocaleLowerCase('es-MX')));
  const filteredStores = visibleStores.filter((store) => {
    const categoryMatches = selectedCategory === 'all' || getStoreCategoryIds(store, categories).includes(selectedCategory);
    const cityMatches = activeCityId === 'all' || store.cityId?.some((city) => String(city.id) === activeCityId);
    const hasCoupons = coupons.some((coupon) => String(coupon.storeId?.id ?? coupon.storeId) === String(store.id));
    return categoryMatches && cityMatches && (!onlyWithCoupons || hasCoupons);
  });
  const filteredCoupons = coupons.filter((coupon) => {
    const store = getCouponStore(coupon, stores);
    const storeName = store?.name || coupon.storeId?.name || '';
    const companyName = store?.companyId?.name || coupon.storeId?.companyId?.name || '';
    const searchMatches = `${coupon.name || ''} ${coupon.description || ''} ${storeName} ${companyName}`.toLocaleLowerCase('es-MX').includes(search.trim().toLocaleLowerCase('es-MX'));
    const categoryMatches = selectedCategory === 'all' || getStoreCategoryIds(store || {}, categories).includes(selectedCategory);
    const cityMatches = activeCityId === 'all' || store?.cityId?.some((city) => String(city.id) === activeCityId);
    return searchMatches && (!showAllCoupons || (categoryMatches && cityMatches));
  });
  const availableCategories = categories.filter((category) => stores.some((store) => getStoreCategoryIds(store, categories).includes(String(category.id))));
  const availableCities = cities.filter((city) => stores.some((store) => store.cityId?.some((storeCity) => String(storeCity.id) === String(city.id))));
  const homeStores = visibleStores.filter((store) => location?.source !== 'city' || store.cityId?.some((city) => String(city.id) === String(location.cityId)));
  const businessResults = sortStoresByDistance(showAllCoupons ? filteredStores : homeStores, resolvedLocation);
  const displayedCoupons = showAllCoupons
    ? showAllCouponResults ? filteredCoupons : filteredCoupons.slice(0, 5)
    : filteredCoupons.slice(0, 9);

  return <View style={{ paddingTop: 28 }}>
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22, zIndex: 2 }}>
      <View><Text style={{ color: C.pink, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>EXCLUSIVAS PARA SOCIOS QPONS VIP</Text><Text style={{ color: C.navy, fontSize: 30, fontWeight: '900', marginTop: 8 }}>{showAllCoupons ? 'Explorar cupones' : 'Explora experiencias y cupones'}</Text><Text style={{ color: C.muted, fontSize: 13, marginTop: 5 }}>{showAllCoupons ? 'Todos los cupones publicados por las tiendas afiliadas.' : 'Descubre beneficios publicados por negocios afiliados en tu zona.'}</Text></View>
    </View>
    <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start', zIndex: 1 }}>
      <Card style={{ width: 250, padding: 18, marginBottom: 0 }}>
        <Label style={{ fontSize: 16 }}>Filtros VIP</Label>
        <TextInput value={search} onChangeText={(value) => { setSearch(value); setShowAllCouponResults(false); setShowAllBusinessResults(false); }} placeholder={showAllCoupons ? 'Buscar cupón o tienda' : 'Buscar negocio o promoción'} placeholderTextColor={C.muted} style={{ backgroundColor: C.pale, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 11, color: C.navy, fontSize: 12, marginTop: 14 }} />
        {showAllCoupons ? <View style={{ marginTop: 16 }}>
          <Text style={{ color: C.navy, fontSize: 11, fontWeight: '800', marginBottom: 7 }}>Categoria</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {[['all', 'Todas'], ...availableCategories.map((category) => [String(category.id), category.name])].map(([value, label]) => <Pressable key={value} onPress={() => { setSelectedCategory(value); setShowAllCouponResults(false); setShowAllBusinessResults(false); }} accessibilityRole="button" accessibilityState={{ selected: selectedCategory === value }} style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16, backgroundColor: selectedCategory === value ? C.navy : C.white }}><Text style={{ color: selectedCategory === value ? C.white : C.navy, fontSize: 10, fontWeight: '700' }}>{label}</Text></Pressable>)}
          </View>
          <Text style={{ color: C.navy, fontSize: 11, fontWeight: '800', marginTop: 13, marginBottom: 7 }}>Ciudad</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {[['all', 'Todas'], ...availableCities.map((city) => [String(city.id), city.name])].map(([value, label]) => <Pressable key={value} onPress={() => { setSelectedCity(value); setShowAllCouponResults(false); setShowAllBusinessResults(false); }} accessibilityRole="button" accessibilityState={{ selected: activeCityId === value }} style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16, backgroundColor: activeCityId === value ? C.navy : C.white }}><Text style={{ color: activeCityId === value ? C.white : C.navy, fontSize: 10, fontWeight: '700' }}>{label}</Text></Pressable>)}
          </View>
          {exploreTab === 'businesses' ? <Pressable onPress={() => setOnlyWithCoupons((current) => !current)} accessibilityRole="checkbox" accessibilityState={{ checked: onlyWithCoupons }} style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12, padding: 9, borderRadius: 14, backgroundColor: onlyWithCoupons ? '#E8F7EF' : C.white }}><Text style={{ color: onlyWithCoupons ? C.green : C.muted }}>{onlyWithCoupons ? 'Si' : 'No'}</Text><Text style={{ flex: 1, color: C.navy, fontSize: 10, fontWeight: '700' }}>Solo negocios con cupones activos</Text></Pressable> : null}
          {selectedCategory !== 'all' || activeCityId !== 'all' || onlyWithCoupons ? <Pressable onPress={() => { setSelectedCategory('all'); setSelectedCity('all'); setOnlyWithCoupons(false); if (location?.source === 'city') onLocationChange?.(null); setShowAllCouponResults(false); setShowAllBusinessResults(false); }} accessibilityRole="button" style={{ alignSelf: 'flex-start', paddingVertical: 8 }}><Text style={{ color: C.pink, fontSize: 11, fontWeight: '700' }}>Limpiar filtros</Text></Pressable> : null}
        </View> : null}
        <View style={{ backgroundColor: C.pale, padding: 14, borderRadius: 18, marginTop: 18 }}><Text style={{ color: C.navy, fontSize: 12, fontWeight: '800' }}>{showAllCoupons ? 'Encuentra un cupón' : 'Cómo explorar'}</Text><Text style={{ color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 5 }}>{showAllCoupons ? 'Busca por el nombre del cupón, su descripción o la tienda que lo ofrece.' : 'La búsqueda filtra promociones y sucursales reales. Selecciona una tarjeta para ver sus detalles.'}</Text></View>
      </Card>
      <View style={{ flex: 1 }}>
        {showAllCoupons ? <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {[['coupons', 'Cupones'], ['businesses', 'Negocios']].map(([key, label]) => <Pressable key={key} onPress={() => setExploreTab(key)} accessibilityRole="button" accessibilityState={{ selected: exploreTab === key }} style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 18, backgroundColor: exploreTab === key ? C.navy : C.white, borderWidth: 1, borderColor: exploreTab === key ? C.navy : '#E5EAF4' }}><Text style={{ color: exploreTab === key ? C.white : C.navy, fontSize: 11, fontWeight: '700' }}>{label}</Text></Pressable>)}
        </View> : null}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13, display: showAllCoupons && exploreTab === 'businesses' ? 'none' : 'flex' }}><Label style={{ fontSize: 21 }}>{showAllCoupons ? 'Cupones de todas las tiendas' : 'Cupones exclusivos'}</Label><Text style={{ color: C.muted, fontSize: 11 }}>{loading ? 'Cargando…' : `${filteredCoupons.length} promociones`}</Text></View>
        {(!showAllCoupons || exploreTab === 'coupons') && error ? <Card><Text style={{ color: C.pink, fontSize: 12 }}>{error.message || error}</Text></Card> : null}
        {(!showAllCoupons || exploreTab === 'coupons') && !loading && !error && displayedCoupons.length === 0 ? <Card><Text style={{ color: C.muted, fontSize: 12 }}>{search ? 'No hay cupones que coincidan con la búsqueda.' : 'Todavía no hay cupones publicados por las tiendas.'}</Text></Card> : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, display: showAllCoupons && exploreTab === 'businesses' ? 'none' : 'flex' }}>
          {displayedCoupons.map((coupon) => {
            const store = stores.find((item) => Number(item.id) === Number(coupon.storeId?.id ?? coupon.storeId));
            const image = coupon.image_1 ? getMediaUrl(coupon.image_1) : '';
            return <View key={coupon.documentId || coupon.id} style={{ width: '31.5%', minWidth: 220, position: 'relative' }}>
              <Pressable onPress={() => onOpenCoupon(coupon)} accessibilityRole="button" style={{ width: '100%', backgroundColor: C.white, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#EEF0F5' }}>
              {image ? <Image source={{ uri: image }} resizeMode="cover" style={{ width: '100%', height: 160, backgroundColor: C.pale }} /> : <View style={{ height: 160, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.white, fontWeight: '800' }}>QPONS VIP</Text></View>}
              <View style={{ padding: 15 }}><Text style={{ color: C.pink, fontSize: 10, fontWeight: '800' }}>{store?.name || 'PROMOCIÓN VIP'}</Text><Label style={{ fontSize: 15, marginTop: 7 }}>{coupon.name}</Label><Text numberOfLines={2} style={{ color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 5 }}>{coupon.description || 'Consulta los beneficios y condiciones de esta promoción.'}</Text><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 13 }}><Text style={{ color: C.green, fontSize: 10, fontWeight: '700' }}>{coupon.expiration ? `Válido hasta ${coupon.expiration}` : 'Disponible en sucursal'}</Text><Text style={{ color: C.navy, fontSize: 11, fontWeight: '800' }}>Ver cupón →</Text></View></View>
              </Pressable>
              <FavoriteButton favorite={isFavoriteCoupon?.(coupon)} onPress={() => onToggleCoupon?.(coupon)} itemLabel={'el cupón ' + coupon.name} disabled={!favoritesReady} style={{ position: 'absolute', top: 9, right: 9 }} />
            </View>;
          })}
        </View>
        {showAllCoupons && exploreTab === 'coupons' && filteredCoupons.length > 5 ? <Pressable onPress={() => setShowAllCouponResults((current) => !current)} accessibilityRole="button" accessibilityLabel={showAllCouponResults ? 'Ver menos cupones' : 'Ver m\u00e1s cupones'} style={{ alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 11, marginTop: 14, marginBottom: 4, borderRadius: 22, backgroundColor: C.white, borderWidth: 1, borderColor: '#E5EAF4' }}><Text style={{ color: C.pink, fontSize: 12, fontWeight: '800' }}>{showAllCouponResults ? 'Ver menos cupones' : 'Ver m\u00e1s cupones'}</Text></Pressable> : null}
        {(!showAllCoupons || exploreTab === 'businesses') ? <>
          {!showAllCoupons ? <CatalogPromotionalVideos stores={stores} coupons={coupons} desktop search={search} /> : null}
          <Label style={{ fontSize: 20, marginTop: 30, marginBottom: 12 }}>{showAllCoupons ? 'Negocios' : 'Negocios cerca de ti'}</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {businessResults.slice(0, showAllCoupons ? (showAllBusinessResults ? businessResults.length : 5) : (showAllNearby ? businessResults.length : 5)).map((store) => {
              const storeCategoryNames = categories.filter((category) => getStoreCategoryIds(store, categories).includes(String(category.id))).map((category) => category.name).join(', ');
              const storeCouponCount = coupons.filter((coupon) => Number(coupon.storeId?.id ?? coupon.storeId) === Number(store.id)).length;
              const storeDistance = distanceKm(resolvedLocation, store);
              const companyLayout = store.companyId?.publicProfileLayout;
              const storePalette = getPublicProfilePalette(companyLayout?.theme);
              const couponImage = coupons.find((coupon) => Number(coupon.storeId?.id ?? coupon.storeId) === Number(store.id) && coupon.image_1)?.image_1;
              const storeImage = companyLayout?.content?.imageUrl || couponImage;
              return <View key={store.id} style={{ width: '48.5%', position: 'relative' }}>
                <Pressable onPress={() => onOpenStore(store)} accessibilityRole="button" accessibilityLabel={`Ver perfil de ${store.name}`} style={{ width: '100%', backgroundColor: storePalette.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: storePalette.border }}>
                {storeImage ? <Image source={{ uri: getMediaUrl(storeImage) }} resizeMode="cover" accessibilityLabel={`Imagen de ${store.name}`} style={{ width: '100%', height: 125, backgroundColor: C.pale }} /> : null}
                <View style={{ padding: 15 }}><Text style={{ color: storePalette.accent, fontSize: 10 }}>● Afiliado QPONS VIP</Text><Label style={{ fontSize: 15, marginTop: 6, color: storePalette.ink }}>{store.name}</Label><Text numberOfLines={2} style={{ color: storePalette.muted, fontSize: 11, marginTop: 4 }}>{store.address || store.description || 'Conoce sus promociones VIP.'}</Text>{storeCategoryNames ? <Text style={{ color: storePalette.muted, fontSize: 10, marginTop: 4 }}>{storeCategoryNames}</Text> : null}{storeDistance !== null ? <Text style={{ color: storePalette.accent, fontSize: 10, marginTop: 5 }}>A {storeDistance < 10 ? storeDistance.toFixed(1) : Math.round(storeDistance)} km</Text> : null}<Text style={{ color: storePalette.accent, fontSize: 10, fontWeight: '700', marginTop: 8 }}>{storeCouponCount} {storeCouponCount === 1 ? 'promoción' : 'promociones'} · Ver negocio →</Text></View>
                </Pressable>
                <FavoriteButton favorite={isFavoriteStore?.(store)} onPress={() => onToggleStore?.(store)} itemLabel={'el negocio ' + store.name} disabled={!favoritesReady} style={{ position: 'absolute', top: 9, right: 9 }} />
              </View>;
            })}
          </View>
          {!loading && !error && businessResults.length === 0 ? <Card><Text style={{ color: C.muted, fontSize: 11 }}>{showAllCoupons && (search || selectedCategory !== 'all' || activeCityId !== 'all' || onlyWithCoupons) ? 'No hay negocios que coincidan con estos filtros. Prueba otra categoría o ciudad.' : 'Cuando haya sucursales afiliadas en tu zona, aparecerán aquí.'}</Text></Card> : null}
          {businessResults.length > 5 ? <Pressable onPress={() => showAllCoupons ? setShowAllBusinessResults((current) => !current) : setShowAllNearby((current) => !current)} accessibilityRole="button" accessibilityLabel={(showAllCoupons ? showAllBusinessResults : showAllNearby) ? 'Ver menos negocios' : 'Ver m\u00e1s negocios'} style={{ alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 11, marginTop: 16, borderRadius: 22, backgroundColor: C.white, borderWidth: 1, borderColor: '#E5EAF4' }}><Text style={{ color: C.pink, fontSize: 12, fontWeight: '800' }}>{(showAllCoupons ? showAllBusinessResults : showAllNearby) ? 'Ver menos negocios' : 'Ver m\u00e1s negocios'}</Text></Pressable> : null}
          {!showAllCoupons ? <CatalogAlerts alerts={alerts} /> : null}
        </> : null}
      </View>
    </View>
  </View>;
}
