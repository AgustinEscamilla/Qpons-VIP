import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Field, Label } from '../../shared/components/UI.js';
import { catalogApi } from '../../services/api/catalog.service';
import { colors as C } from '../../shared/theme/colors.js';
import BusinessLocationPicker from '../location/BusinessLocationPicker';
import { LocateMeButton } from '../location/LocationPicker.js';
import { OptionChip, Feedback, useSubmit } from './BusinessFormHelpers.js';

// Administra las sucursales y sus direcciones, ciudades y coordenadas.
// Formulario para registrar una sucursal y asociarla a una ciudad disponible.
export function StoreManagement({ stores, onCreate, onUpdate }) {
  const emptyStoreForm = { name: '', address: '', phone: '', description: '', cityId: null, latitude: '', longitude: '' };
  const [form, setForm] = React.useState(emptyStoreForm);
  const [editingStoreId, setEditingStoreId] = React.useState(null);
  const [cities, setCities] = React.useState([]);
  const [cityError, setCityError] = React.useState('');
  const { saving, feedback, submit } = useSubmit(
    (payload) => editingStoreId ? onUpdate(editingStoreId, payload) : onCreate(payload),
    () => { setForm(emptyStoreForm); setEditingStoreId(null); },
  );

  React.useEffect(() => {
    let mounted = true;
    catalogApi.cities().then((result) => { if (mounted) setCities(Array.isArray(result) ? result : []); })
      .catch(() => { if (mounted) setCityError('No se pudieron cargar las ciudades. Puedes registrar la sucursal sin elegir ciudad.'); });
    return () => { mounted = false; };
  }, []);

  function saveStore() {
    if (form.name.trim().length < 2 || form.address.trim().length < 4) {
      setCityError('Escribe un nombre y una dirección válida para la sucursal.');
      return;
    }
    setCityError('');
    submit({ ...form, name: form.name.trim(), address: form.address.trim(), phone: form.phone.trim(), description: form.description.trim(), latitude: form.latitude === '' ? null : Number(form.latitude), longitude: form.longitude === '' ? null : Number(form.longitude) });
  }

  function editStore(store) {
    setEditingStoreId(store.id);
    setCityError('');
    setForm({ name: store.name || '', address: store.address || '', phone: store.phone || '', description: store.description || '', cityId: store.cityId?.[0]?.id ?? null, latitude: store.latitude || '', longitude: store.longitude || '' });
  }

  function cancelStoreEdit() {
    setEditingStoreId(null);
    setCityError('');
    setForm(emptyStoreForm);
  }

  return (
    <View>
      <Card>
        <Label style={{ fontSize: 16 }}>{editingStoreId ? 'Editar sucursal del catálogo' : 'Agregar sucursal'}</Label>
        <Text style={{ color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 4 }}>Registra cada ubicación para publicar sus promociones y horarios.</Text>
        <Field label="Nombre de la sucursal *" value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} placeholder="Ej. QPONS Centro" maxLength={120} />
        <Field label="Dirección *" value={form.address} onChangeText={(address) => setForm((current) => ({ ...current, address, ...(address.trim() !== current.address.trim() ? { latitude: '', longitude: '' } : {}) }))} placeholder="Calle, número y colonia" maxLength={255} />
        <Field label="Teléfono (opcional)" value={form.phone} onChangeText={(phone) => setForm((current) => ({ ...current, phone }))} placeholder="+1 (956) 000-0000" keyboardType="phone-pad" maxLength={40} />
        <Field label="Descripción (opcional)" value={form.description} onChangeText={(description) => setForm((current) => ({ ...current, description }))} placeholder="Información útil de esta ubicación" maxLength={2000} multiline />
        <Label style={{ fontSize: 13, marginTop: 15, marginBottom: 8 }}>Ciudad (opcional)</Label>
        {cities.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{cities.map((city) => <OptionChip key={city.id} label={city.name} selected={form.cityId === city.id} onPress={() => setForm((current) => ({ ...current, cityId: current.cityId === city.id ? null : city.id }))} />)}</View> : <Text style={{ color: C.muted, fontSize: 11 }}>No hay ciudades cargadas en el catálogo.</Text>}
        <Label style={{ fontSize: 13, marginTop: 16, marginBottom: 5 }}>Ubicación exacta en Google Maps</Label>
        <BusinessLocationPicker
          latitude={form.latitude}
          longitude={form.longitude}
          initialLatitude={cities.find((city) => String(city.id) === String(form.cityId))?.latitude}
          initialLongitude={cities.find((city) => String(city.id) === String(form.cityId))?.longitude}
          address={form.address}
          name={form.name}
          onChange={({ latitude, longitude, address }) => setForm((current) => ({ ...current, latitude: String(latitude), longitude: String(longitude), ...(address ? { address } : {}) }))}
          desktop={false}
        />
        <LocateMeButton label="Usar GPS para marcar la sucursal" secondary onLocated={(location) => setForm((current) => ({ ...current, latitude: String(location.latitude), longitude: String(location.longitude), ...(location.address ? { address: location.address } : {}) }))} style={{ marginTop: 9 }} />
        <Feedback message={cityError || feedback.message} error={Boolean(cityError) || feedback.error} />
        {editingStoreId ? <Button secondary onPress={cancelStoreEdit}>Cancelar edición</Button> : null}
        <Button onPress={saveStore}>{saving ? 'Guardando sucursal…' : editingStoreId ? 'Guardar cambios de sucursal' : 'Guardar sucursal'}</Button>
      </Card>
      <Label style={{ fontSize: 16, marginBottom: 8 }}>Tus sucursales ({stores.length})</Label>
      {!stores.length ? <Card><Text style={{ color: C.muted, fontSize: 12 }}>Todavía no tienes sucursales. Usa el formulario para registrar la primera.</Text></Card> : stores.map((store) => (
        <Card key={store.id} style={{ padding: 15 }}>
          <Label style={{ fontSize: 15 }}>{store.name}</Label>
          <Pressable onPress={() => editStore(store)} accessibilityRole="button" style={{ alignSelf: 'flex-start', paddingVertical: 9 }}><Text style={{ color: C.pink, fontSize: 11, fontWeight: '700' }}>Editar información que ve el cliente</Text></Pressable>
          <Text style={{ color: C.muted, fontSize: 12, marginTop: 5 }}>{store.address || 'Dirección pendiente'}{store.cityId?.[0]?.name ? ` · ${store.cityId[0].name}` : ''}</Text>
          {store.latitude && store.longitude ? <Text style={{ color: C.green, fontSize: 10, marginTop: 4 }}>Ubicación guardada en el mapa · {Number(store.latitude).toFixed(5)}, {Number(store.longitude).toFixed(5)}</Text> : <Text style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>Ubicación exacta pendiente</Text>}
          {store.phone ? <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Teléfono: {store.phone}</Text> : null}
        </Card>
      ))}
    </View>
  );
}
