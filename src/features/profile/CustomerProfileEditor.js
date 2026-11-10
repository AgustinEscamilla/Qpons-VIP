import React from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image, Pressable, Text, View } from 'react-native';
import { authApi } from '../../services/api/auth.service';
import { getMediaUrl } from '../../services/api/client.js';
import { Button, Card, Field, Label } from '../../shared/components/UI.js';
import { LocateMeButton } from '../location/LocationPicker.js';
import { colors as C } from '../../shared/theme/colors.js';

export function CustomerProfileEditor({ session, onSessionChange, onLocationChange, onLogout, desktop = false }) {
  const user = session?.user || {};
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const [savingLocation, setSavingLocation] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [form, setForm] = React.useState({ name: user.name || '', phone: user.phone || '', address: user.address || '', latitude: user.latitude || '', longitude: user.longitude || '' });
  const displayName = user.name || user.email?.split('@')[0] || 'Miembro QPONS';
  const photoUrl = user.profileImageUrl ? getMediaUrl(user.profileImageUrl) : '';

  const applyCurrentLocation = async (location) => {
    onLocationChange?.(location);
    if (editing) {
      setForm((current) => ({
        ...current,
        address: location.address || current.address,
        latitude: String(location.latitude),
        longitude: String(location.longitude),
      }));
      setMessage(location.address ? 'Ubicación y dirección listas. Guarda los datos para aplicarlas.' : 'Ubicación lista. Puedes escribir una dirección y guardar los datos.');
      return;
    }

    if (!session?.accessToken) {
      setError('Inicia sesión para guardar tu ubicación en el perfil.');
      return;
    }

    setSavingLocation(true);
    setError('');
    setMessage('');
    try {
      const updatedUser = await authApi.updateProfile(session.accessToken, {
        latitude: location.latitude,
        longitude: location.longitude,
        ...(location.address ? { address: location.address } : {}),
      });
      onSessionChange?.({ ...session, user: updatedUser });
      setMessage('Tu ubicación quedó guardada en el perfil.');
    } catch (requestError) {
      setError(requestError.message || 'No se pudo guardar tu ubicación.');
    } finally {
      setSavingLocation(false);
    }
  };

  const chooseProfilePhoto = async () => {
    setError('');
    setMessage('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        setError('La foto debe pesar menos de 5 MB.');
        return;
      }
      if (!session?.accessToken) throw new Error('Vuelve a iniciar sesión para cambiar tu foto.');

      setUploadingPhoto(true);
      const response = await authApi.uploadProfilePhoto(session.accessToken, asset);
      onSessionChange?.({ ...session, user: response.user });
      setMessage('Foto de perfil actualizada.');
    } catch (requestError) {
      setError(requestError.message || 'No se pudo actualizar la foto.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveProfile = async () => {
    const name = form.name.trim();
    if (name.length < 2) {
      setError('Escribe tu nombre completo.');
      return;
    }
    if (!session?.accessToken) {
      setError('Vuelve a iniciar sesión para guardar tus datos.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updatedUser = await authApi.updateProfile(session.accessToken, {
        name,
        phone: form.phone.trim(),
        address: form.address.trim(),
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
      });
      onSessionChange?.({ ...session, user: updatedUser });
      setEditing(false);
      setMessage('Tus datos se guardaron.');
    } catch (requestError) {
      setError(requestError.message || 'No se pudieron guardar tus datos.');
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setForm({ name: user.name || '', phone: user.phone || '', address: user.address || '', latitude: user.latitude || '', longitude: user.longitude || '' });
    setEditing(false);
    setError('');
  };

  return <Card style={{ padding: desktop ? 24 : 16, marginBottom: desktop ? 22 : 14 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <Pressable onPress={chooseProfilePhoto} disabled={uploadingPhoto} accessibilityRole="button" accessibilityLabel="Cambiar foto de perfil" style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E4EAF5', opacity: uploadingPhoto ? 0.6 : 1 }}>
        {photoUrl ? <Image source={{ uri: photoUrl }} accessibilityLabel={`Foto de ${displayName}`} style={{ width: 74, height: 74, borderRadius: 37 }} /> : <Text style={{ color: C.navy, fontSize: 25, fontWeight: '900' }}>{displayName.charAt(0).toUpperCase()}</Text>}
        <View style={{ position: 'absolute', right: -1, bottom: -1, width: 25, height: 25, borderRadius: 13, backgroundColor: C.navy, borderWidth: 2, borderColor: C.white, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.white, fontSize: 12 }}>✎</Text></View>
      </Pressable>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: C.pink, fontSize: 10, fontWeight: '800' }}>CUENTA DE CLIENTE</Text>
        <Label numberOfLines={1} style={{ fontSize: desktop ? 21 : 18, marginTop: 4 }}>{displayName}</Label>
        <Text numberOfLines={1} style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{user.email || 'Cuenta QPONS VIP'}</Text>
        {uploadingPhoto ? <Text style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>Subiendo foto…</Text> : <Pressable onPress={chooseProfilePhoto} accessibilityRole="button" style={{ alignSelf: 'flex-start', paddingTop: 4 }}><Text style={{ color: C.pink, fontSize: 10, fontWeight: '700' }}>Cambiar foto</Text></Pressable>}
      </View>
    </View>

    {!editing ? <>
      <View style={{ borderTopWidth: 1, borderTopColor: '#EEF0F5', marginTop: 16, paddingTop: 12, gap: 7 }}>
        <Text style={{ color: C.navy, fontSize: 12 }}>{user.phone || 'Agrega tu teléfono'}</Text>
        <Text style={{ color: user.address ? C.navy : C.muted, fontSize: 12 }}>{user.address || 'Agrega tu dirección'}</Text>
        {user.latitude && user.longitude ? <Text style={{ color: C.green, fontSize: 10 }}>Ubicación guardada · {Number(user.latitude).toFixed(4)}, {Number(user.longitude).toFixed(4)}</Text> : null}
      </View>
      <LocateMeButton label={savingLocation ? 'Guardando ubicación…' : 'Usar mi ubicación'} onLocated={applyCurrentLocation} secondary style={{ marginTop: 12 }} />
      <View style={{ flexDirection: desktop ? 'row' : 'column', gap: 8, marginTop: 14 }}>
        <Button secondary onPress={() => { setEditing(true); setMessage(''); setError(''); }} style={{ flex: desktop ? 1 : undefined, marginTop: 0, paddingVertical: 11 }}>Editar mis datos</Button>
        {onLogout ? <Button secondary onPress={onLogout} style={{ flex: desktop ? 1 : undefined, marginTop: 0, paddingVertical: 11 }}>Cerrar sesión</Button> : null}
      </View>
    </> : <View style={{ marginTop: 6 }}>
      <Field label="Nombre completo" value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} placeholder="Tu nombre" autoCapitalize="words" autoComplete="name" />
      <Field label="Teléfono móvil" value={form.phone} onChangeText={(phone) => setForm((current) => ({ ...current, phone }))} placeholder="+1 (956) 000-0000" keyboardType="phone-pad" autoComplete="tel" />
      <Field label="Dirección" value={form.address} onChangeText={(address) => setForm((current) => ({ ...current, address, ...(address.trim() !== current.address.trim() ? { latitude: '', longitude: '' } : {}) }))} placeholder="Calle, ciudad y código postal" autoCapitalize="words" autoComplete="street-address" />
      <LocateMeButton label="Usar mi ubicación actual" onLocated={applyCurrentLocation} secondary style={{ marginTop: 8 }} />
      {form.latitude && form.longitude ? <Text style={{ color: C.green, fontSize: 10, marginTop: 6 }}>Coordenadas guardadas para ordenar negocios cercanos.</Text> : null}
      <Text style={{ color: C.muted, fontSize: 10, marginTop: 10 }}>El correo {user.email ? `(${user.email})` : ''} no se puede cambiar desde esta pantalla.</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 5 }}>
        <Button secondary disabled={saving} onPress={cancelEditing} style={{ flex: 1, marginTop: 10, paddingVertical: 11 }}>Cancelar</Button>
        <Button disabled={saving} onPress={saveProfile} style={{ flex: 1, marginTop: 10, paddingVertical: 11 }}>{saving ? 'Guardando…' : 'Guardar datos'}</Button>
      </View>
    </View>}
    {error ? <Text accessibilityRole="alert" style={{ color: C.pink, fontSize: 11, marginTop: 10 }}>{error}</Text> : null}
    {message ? <Text accessibilityLiveRegion="polite" style={{ color: C.green, fontSize: 11, marginTop: 10 }}>{message}</Text> : null}
  </Card>;
}

export function MostSavedBusinessCard({ coupons = [], stores = [], favoriteCouponIds = [] }) {
  const favorites = new Set(favoriteCouponIds.map(String));
  const counts = new Map();
  for (const coupon of coupons) {
    const couponId = String(coupon.documentId ?? coupon.id ?? '');
    if (!favorites.has(couponId)) continue;
    const storeId = coupon.storeId?.id ?? coupon.storeId;
    const store = stores.find((item) => String(item.id) === String(storeId)) || (typeof coupon.storeId === 'object' ? coupon.storeId : null);
    const company = store?.companyId && typeof store.companyId === 'object' ? store.companyId : null;
    const key = company?.id ? `company:${company.id}` : store?.id ? `store:${store.id}` : `name:${store?.name || 'unknown'}`;
    const current = counts.get(key) || { name: company?.name || store?.name || 'Negocio afiliado', count: 0 };
    current.count += 1;
    counts.set(key, current);
  }
  const mostSaved = [...counts.values()].sort((left, right) => right.count - left.count)[0];

  return <Card style={{ padding: 16 }}>
    <Text style={{ color: C.pink, fontSize: 10, fontWeight: '800' }}>TUS FAVORITOS</Text>
    <Label style={{ fontSize: 16, marginTop: 4 }}>Negocio con más cupones guardados</Label>
    {mostSaved ? <>
      <Text style={{ color: C.navy, fontSize: 15, fontWeight: '700', marginTop: 10 }}>{mostSaved.name}</Text>
      <Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>Tienes {mostSaved.count} {mostSaved.count === 1 ? 'cupón guardado' : 'cupones guardados'} de este negocio.</Text>
    </> : <Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 8 }}>Guarda cupones con el corazón y aquí verás qué negocio tiene más de tus favoritos.</Text>}
    <Text style={{ color: C.muted, fontSize: 9, lineHeight: 14, marginTop: 10 }}>El historial de canjes aparecerá cuando los negocios registren las redenciones.</Text>
  </Card>;
}
