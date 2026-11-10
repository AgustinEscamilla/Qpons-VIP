import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card, Label } from '../../shared/components/UI.js';
import { colors as C } from '../../shared/theme/colors.js';

// Helpers compartidos por los formularios del panel: opciones, calendario y guardado.
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toLocalDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromLocalDateValue(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Controles pequeños y compartidos para que las secciones mantengan el mismo lenguaje visual.
function OptionChip({ label, selected, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} style={{ backgroundColor: selected ? C.navy : C.pale, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9, marginRight: 7, marginBottom: 7 }}>
      <Text style={{ color: selected ? C.white : C.navy, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

function Feedback({ message, error }) {
  if (!message) return null;
  return <Text accessibilityRole="alert" style={{ color: error ? C.pink : C.green, fontSize: 12, marginTop: 10 }}>{message}</Text>;
}

// Calendario en pantalla para elegir vencimientos sin escribir fechas manualmente.
function ExpirationCalendar({ value, onChange }) {
  const [visibleMonth, setVisibleMonth] = React.useState(() => startOfMonth(fromLocalDateValue(value) || new Date()));
  const [open, setOpen] = React.useState(false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = fromLocalDateValue(value);
  const monthLabel = visibleMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  const firstDayOffset = (new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay() + 6) % 7;
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDayOffset + 1;
    return day > 0 && day <= daysInMonth ? new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day) : null;
  });

  function changeMonth(amount) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  return (
    <View style={{ marginTop: 16 }}>
      <Label style={{ fontSize: 16 }}>Vence (opcional)</Label>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={value ? `Fecha de vencimiento ${value}. Toca para cambiarla` : 'Seleccionar fecha de vencimiento'}
        onPress={() => {
          if (selectedDate) setVisibleMonth(startOfMonth(selectedDate));
          setOpen((current) => !current);
        }}
        style={{ minHeight: 52, marginTop: 9, borderRadius: 27, backgroundColor: C.pale, paddingHorizontal: 18, justifyContent: 'center' }}
      >
        <Text style={{ color: value ? C.navy : '#A3AEC2', fontSize: 15 }}>
          {selectedDate ? selectedDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Selecciona una fecha'}
        </Text>
      </Pressable>
      {value ? <Pressable onPress={() => onChange('')} accessibilityRole="button" style={{ alignSelf: 'flex-start', paddingVertical: 8 }}><Text style={{ color: C.pink, fontSize: 11, fontWeight: '700' }}>Quitar fecha</Text></Pressable> : null}
      {open ? (
        <Card style={{ marginTop: 8, padding: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Mes anterior" onPress={() => changeMonth(-1)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.navy, fontSize: 20 }}>‹</Text></Pressable>
            <Text style={{ color: C.navy, fontSize: 14, fontWeight: '800', textTransform: 'capitalize' }}>{monthLabel}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Mes siguiente" onPress={() => changeMonth(1)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.navy, fontSize: 20 }}>›</Text></Pressable>
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 5 }}>{WEEK_DAYS.map((day, index) => <Text key={`${day}-${index}`} style={{ flex: 1, textAlign: 'center', color: C.muted, fontSize: 11, fontWeight: '700', paddingVertical: 7 }}>{day}</Text>)}</View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {cells.map((date, index) => {
              const dateValue = date ? toLocalDateValue(date) : '';
              const isPast = date ? date < today : true;
              const isSelected = Boolean(date && value === dateValue);
              return (
                <View key={`calendar-${index}`} style={{ width: '14.2857%', alignItems: 'center', paddingVertical: 2 }}>
                  {date ? <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={date.toLocaleDateString('es-MX', { dateStyle: 'full' })}
                    accessibilityState={{ selected: isSelected, disabled: isPast }}
                    disabled={isPast}
                    onPress={() => { onChange(dateValue); setOpen(false); }}
                    style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? C.navy : 'transparent' }}
                  ><Text style={{ color: isSelected ? C.white : isPast ? '#B8C0CF' : C.navy, fontSize: 12, fontWeight: isSelected ? '800' : '500' }}>{date.getDate()}</Text></Pressable> : <View style={{ width: 36, height: 36 }} />}
                </View>
              );
            })}
          </View>
          <Text style={{ color: C.muted, fontSize: 10, marginTop: 8 }}>Selecciona un día futuro. La fecha es opcional.</Text>
        </Card>
      ) : null}
    </View>
  );
}

function useSubmit(onSubmit, reset) {
  const [saving, setSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState({ message: '', error: false });

  async function submit(payload) {
    setSaving(true);
    setFeedback({ message: '', error: false });
    try {
      await onSubmit(payload);
      reset();
      setFeedback({ message: 'Se guardó correctamente.', error: false });
    } catch (error) {
      setFeedback({ message: error.message || 'No se pudo guardar. Inténtalo de nuevo.', error: true });
    } finally {
      setSaving(false);
    }
  }

  return { saving, feedback, submit };
}

export { DAYS, OptionChip, Feedback, ExpirationCalendar, useSubmit };
