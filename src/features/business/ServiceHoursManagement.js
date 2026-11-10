import React from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Field, Label } from '../../shared/components/UI.js';
import { colors as C } from '../../shared/theme/colors.js';
import { DAYS, OptionChip, Feedback, useSubmit } from './BusinessFormHelpers.js';

// Gestiona intervalos de servicio por sucursal y por dia de la semana.
// Captura un horario y requiere seleccionar una sucursal propiedad del negocio.
export function LegacyHoursManagement({ stores, hours, onCreate }) {
  const [form, setForm] = React.useState({ storeId: null, dayOfWeek: '', openingTime: '', closingTime: '' });
  const [validation, setValidation] = React.useState('');
  const { saving, feedback, submit } = useSubmit(onCreate, () => setForm({ storeId: null, dayOfWeek: '', openingTime: '', closingTime: '' }));

  function saveHour() {
    if (!form.storeId || !form.dayOfWeek || !/^([01]\d|2[0-3]):[0-5]\d$/.test(form.openingTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(form.closingTime)) {
      setValidation('Elige sucursal y día; captura horas en formato de 24 horas, por ejemplo 09:00.');
      return;
    }
    if (form.openingTime === form.closingTime) { setValidation('La hora de apertura y cierre no pueden ser iguales.'); return; }
    setValidation('');
    submit(form);
  }

  return (
    <View>
      <Card>
        <Label style={{ fontSize: 16 }}>Agregar horario</Label>
        {!stores.length ? <Text style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>Primero registra una sucursal para poder asignarle horarios.</Text> : <>
          <Label style={{ fontSize: 13, marginTop: 15, marginBottom: 8 }}>Sucursal *</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{stores.map((store) => <OptionChip key={store.id} label={store.name} selected={form.storeId === store.id} onPress={() => setForm((current) => ({ ...current, storeId: store.id }))} />)}</View>
          <Label style={{ fontSize: 13, marginTop: 10, marginBottom: 8 }}>Día *</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{DAYS.map((day) => <OptionChip key={day} label={day} selected={form.dayOfWeek === day} onPress={() => setForm((current) => ({ ...current, dayOfWeek: day }))} />)}</View>
          <Field label="Apertura * (24 horas)" value={form.openingTime} onChangeText={(openingTime) => setForm((current) => ({ ...current, openingTime }))} placeholder="09:00" maxLength={5} />
          <Field label="Cierre * (24 horas)" value={form.closingTime} onChangeText={(closingTime) => setForm((current) => ({ ...current, closingTime }))} placeholder="18:00" maxLength={5} />
          <Feedback message={validation || feedback.message} error={Boolean(validation) || feedback.error} />
          <Button onPress={saveHour}>{saving ? 'Guardando horario…' : 'Guardar horario'}</Button>
        </>}
      </Card>
      <Label style={{ fontSize: 16, marginBottom: 8 }}>Horarios registrados ({hours.length})</Label>
      {!hours.length ? <Card><Text style={{ color: C.muted, fontSize: 12 }}>Aún no hay horarios. Configura los días de atención de cada sucursal.</Text></Card> : hours.map((hour) => (
        <Card key={hour.id} style={{ padding: 15 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}><Label style={{ fontSize: 14 }}>{hour.dayOfWeek}</Label><Text style={{ color: C.green, fontSize: 12, fontWeight: '700' }}>{hour.openingTime?.slice(0, 5) || '--:--'} a {hour.closingTime?.slice(0, 5) || '--:--'}</Text></View>
          <Text style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>{hour.storeId?.name || 'Sucursal'}</Text>
        </Card>
      ))}
    </View>
  );
}

// Permite crear promociones y las presenta bajo la ubicación correspondiente.
// Permite activar cada día de la semana y definir un horario independiente por sucursal.
export function HoursManagement({ stores, hours, onSave }) {
  const makeEmptySchedule = () => Object.fromEntries(DAYS.map((day) => [day, { open: false, openingTime: '09:00', closingTime: '18:00' }]));
  const [storeId, setStoreId] = React.useState(null);
  const [schedule, setSchedule] = React.useState(makeEmptySchedule);
  const [bulkHours, setBulkHours] = React.useState({ openingTime: '09:00', closingTime: '18:00' });
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [isError, setIsError] = React.useState(false);

  function selectStore(id) {
    setStoreId(id);
    setMessage('');
    const currentSchedule = makeEmptySchedule();
    hours.filter((hour) => Number(hour.storeId?.id ?? hour.storeId) === Number(id)).forEach((hour) => {
      const day = DAYS.find((candidate) => candidate.toLocaleLowerCase('es-MX') === String(hour.dayOfWeek).toLocaleLowerCase('es-MX'));
      if (day) currentSchedule[day] = { open: true, openingTime: hour.openingTime?.slice(0, 5) || '09:00', closingTime: hour.closingTime?.slice(0, 5) || '18:00' };
    });
    setSchedule(currentSchedule);
    const firstOpenDay = DAYS.find((day) => currentSchedule[day].open);
    if (firstOpenDay) setBulkHours({ openingTime: currentSchedule[firstOpenDay].openingTime, closingTime: currentSchedule[firstOpenDay].closingTime });
  }

  function updateDay(day, patch) {
    setSchedule((current) => ({ ...current, [day]: { ...current[day], ...patch } }));
    setMessage('');
  }

  function applyBulkHours() {
    const openDays = DAYS.filter((day) => schedule[day].open);
    if (!openDays.length) { setMessage('Primero marca los días a los que quieres aplicar el horario.'); setIsError(true); return; }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(bulkHours.openingTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(bulkHours.closingTime) || bulkHours.openingTime === bulkHours.closingTime) {
      setMessage('Revisa las horas del horario para varios días (formato 24 horas y horas distintas).'); setIsError(true); return;
    }
    setSchedule((current) => Object.fromEntries(DAYS.map((day) => [day, current[day].open ? { ...current[day], ...bulkHours } : current[day]])));
    setMessage(`Se aplicó ${bulkHours.openingTime} a ${bulkHours.closingTime} a ${openDays.length} día(s). Puedes ajustar cada día después.`);
    setIsError(false);
  }

  async function saveSchedule() {
    if (!storeId) { setMessage('Selecciona la sucursal que tendrá este horario.'); setIsError(true); return; }
    const selectedDays = DAYS.filter((day) => schedule[day].open);
    for (const day of selectedDays) {
      const { openingTime, closingTime } = schedule[day];
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(openingTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(closingTime)) {
        setMessage(`Revisa las horas de ${day}; usa formato de 24 horas, por ejemplo 09:00.`); setIsError(true); return;
      }
      if (openingTime === closingTime) { setMessage(`La apertura y el cierre de ${day} no pueden ser iguales.`); setIsError(true); return; }
    }
    setSaving(true); setMessage('');
    try {
      await onSave({ storeId, days: selectedDays.map((day) => ({ dayOfWeek: day, openingTime: schedule[day].openingTime, closingTime: schedule[day].closingTime })) });
      setMessage(selectedDays.length ? 'Horario semanal guardado para esta sucursal.' : 'La sucursal quedó marcada como cerrada toda la semana.');
      setIsError(false);
    } catch (error) {
      setMessage(error.message || 'No se pudo guardar el horario.'); setIsError(true);
    } finally { setSaving(false); }
  }

  const visibleHours = storeId ? hours.filter((hour) => Number(hour.storeId?.id ?? hour.storeId) === Number(storeId)) : hours;
  return (
    <View>
      <Card>
        <Label style={{ fontSize: 16 }}>Horario semanal</Label>
        <Text style={{ color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 5 }}>Elige una sucursal, activa los días que abre y configura por separado la hora de cada día. Los días apagados se guardarán como cerrados.</Text>
        {!stores.length ? <Text style={{ color: C.muted, fontSize: 12, marginTop: 12 }}>Primero registra una sucursal para configurar sus horarios.</Text> : <>
          <Label style={{ fontSize: 13, marginTop: 15, marginBottom: 8 }}>Sucursal *</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{stores.map((store) => <OptionChip key={store.id} label={store.name} selected={Number(storeId) === Number(store.id)} onPress={() => selectStore(store.id)} />)}</View>
          {storeId ? <View style={{ backgroundColor: C.pale, borderRadius: 16, padding: 13, marginTop: 8, marginBottom: 8 }}>
            <Label style={{ fontSize: 13 }}>Configurar varios días a la vez</Label>
            <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 4 }}>Primero marca los días que abres. Este horario se aplicará a todos los días abiertos; después puedes cambiar cualquiera individualmente.</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><Field label="Abre (24 h)" value={bulkHours.openingTime} onChangeText={(openingTime) => setBulkHours((current) => ({ ...current, openingTime }))} placeholder="09:00" maxLength={5} /></View>
              <View style={{ flex: 1 }}><Field label="Cierra (24 h)" value={bulkHours.closingTime} onChangeText={(closingTime) => setBulkHours((current) => ({ ...current, closingTime }))} placeholder="18:00" maxLength={5} /></View>
            </View>
            <Button secondary onPress={applyBulkHours}>Aplicar a todos los días abiertos</Button>
          </View> : null}
          {storeId ? DAYS.map((day) => (
            <View key={day} style={{ borderTopWidth: 1, borderTopColor: '#F0F2F8', paddingTop: 12, marginTop: 7 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Label style={{ fontSize: 14 }}>{day}</Label>
                <OptionChip label={schedule[day].open ? 'Abierto' : 'Cerrado'} selected={schedule[day].open} onPress={() => updateDay(day, { open: !schedule[day].open })} />
              </View>
              {schedule[day].open ? <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}><Field label="Abre (24 h)" value={schedule[day].openingTime} onChangeText={(openingTime) => updateDay(day, { openingTime })} placeholder="09:00" maxLength={5} /></View>
                <View style={{ flex: 1 }}><Field label="Cierra (24 h)" value={schedule[day].closingTime} onChangeText={(closingTime) => updateDay(day, { closingTime })} placeholder="18:00" maxLength={5} /></View>
              </View> : <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>La sucursal permanecerá cerrada.</Text>}
            </View>
          )) : <Text style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>Selecciona una sucursal para editar sus siete días.</Text>}
          <Feedback message={message} error={isError} />
          <Button onPress={saveSchedule}>{saving ? 'Guardando horario…' : 'Guardar horario semanal'}</Button>
        </>}
      </Card>
      <Label style={{ fontSize: 16, marginBottom: 8 }}>Horarios registrados ({visibleHours.length})</Label>
      {!visibleHours.length ? <Card><Text style={{ color: C.muted, fontSize: 12 }}>Aún no hay horarios para mostrar. Selecciona los días de atención y guárdalos.</Text></Card> : visibleHours.map((hour) => (
        <Card key={hour.id} style={{ padding: 15 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}><Label style={{ fontSize: 14 }}>{hour.dayOfWeek}</Label><Text style={{ color: C.green, fontSize: 12, fontWeight: '700' }}>{hour.openingTime?.slice(0, 5) || '--:--'} a {hour.closingTime?.slice(0, 5) || '--:--'}</Text></View>
          <Text style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>{hour.storeId?.name || 'Sucursal'}</Text>
        </Card>
      ))}
    </View>
  );
}
