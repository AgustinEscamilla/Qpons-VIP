import React from 'react';
import { Text, View } from 'react-native';
import { Card, Label } from '../../shared/components/UI.js';
import { colors as C } from '../../shared/theme/colors.js';

function getAlertDescription(text) {
  if (!text) return 'Aviso informativo de QPONS VIP.';
  if (typeof text === 'string') return text;
  if (Array.isArray(text)) return text.join(' ');
  return Object.values(text).filter(Boolean).join(' ');
}

function getTimeRange(serviceHour) {
  const opening = serviceHour.openingTime || '--:--';
  const closing = serviceHour.closingTime || '--:--';
  return `${opening} - ${closing}`;
}

// Muestra avisos activos y horarios que vienen de sus tablas correspondientes.
export function CatalogAvailability({ alerts = [], serviceHours = [] }) {
  const visibleAlerts = alerts.filter((alert) => alert.active !== false).slice(0, 3);
  const visibleHours = serviceHours.slice(0, 5);

  return (
    <View style={{ marginTop: 14 }}>
      <Label style={{ fontSize: 18, marginBottom: 8 }}>Avisos VIP</Label>
      {!visibleAlerts.length && <Text style={{ color: C.muted, fontSize: 11 }}>No hay avisos activos.</Text>}
      {visibleAlerts.map((alert) => (
        <Card key={`alert-${alert.id}`} style={{ padding: 13, marginBottom: 8, backgroundColor: '#FFF7F8' }}>
          <Label style={{ fontSize: 14 }}>{alert.title}</Label>
          <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{getAlertDescription(alert.text)}</Text>
        </Card>
      ))}

      <Label style={{ fontSize: 18, marginTop: 8, marginBottom: 8 }}>Horarios de servicio</Label>
      {!visibleHours.length && <Text style={{ color: C.muted, fontSize: 11 }}>No hay horarios registrados.</Text>}
      {visibleHours.map((serviceHour) => (
        <Card key={`hour-${serviceHour.id}`} style={{ padding: 13, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <Label style={{ fontSize: 13 }}>{serviceHour.dayOfWeek}</Label>
            <Text style={{ color: C.green, fontSize: 11 }}>{getTimeRange(serviceHour)}</Text>
          </View>
          {(serviceHour.storeId?.name || serviceHour.companyId?.name) && (
            <Text style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>
              {serviceHour.storeId?.name || serviceHour.companyId?.name}
            </Text>
          )}
        </Card>
      ))}
    </View>
  );
}
