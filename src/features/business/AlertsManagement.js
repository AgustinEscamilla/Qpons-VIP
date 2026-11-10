import React from 'react';
import { Text, View } from 'react-native';
import { Card, Label } from '../../shared/components/UI.js';
import { colors as C } from '../../shared/theme/colors.js';

// Presenta los avisos globales publicados por administracion.
function plainAlertText(value) {
  if (!value) return 'Aviso informativo para los clientes.';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(plainAlertText).filter(Boolean).join(' ');
  if (typeof value === 'object') return Object.values(value).map(plainAlertText).filter(Boolean).join(' ');
  return '';
}

// Los avisos globales son de lectura; su publicación se reserva al equipo administrador.
export function AlertsManagement({ alerts }) {
  return (
    <View>
      {!alerts.length ? <Card><Label style={{ fontSize: 15 }}>No hay avisos activos</Label><Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 6 }}>Aquí verás comunicados generales publicados para los clientes de QPONS VIP.</Text><Text style={{ color: C.muted, fontSize: 10, marginTop: 9 }}>Los avisos globales los administra el equipo de QPONS VIP.</Text></Card> : alerts.map((alert) => (
        <Card key={alert.id} style={{ backgroundColor: '#FFF7F8' }}><Label style={{ fontSize: 15 }}>{alert.title}</Label><Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 6 }}>{plainAlertText(alert.text)}</Text></Card>
      ))}
    </View>
  );
}
