import React from 'react';
import { Text, View } from 'react-native';
import { Card, Label } from '../../shared/components/UI.js';
import { colors as C } from '../../shared/theme/colors.js';

function formatVersion(version) {
  if (!version) return 'Versión pendiente de configuración';
  if (typeof version === 'string') return version;
  return Object.entries(version).map(([platform, value]) => `${platform}: ${value}`).join(' · ');
}

// Presenta la configuración de la aplicación sin esconder la respuesta JSON original.
export function CatalogAppConfig({ storeConfig = [] }) {
  const config = storeConfig[0];

  return (
    <View style={{ marginTop: 14, marginBottom: 12 }}>
      <Label style={{ fontSize: 18, marginBottom: 8 }}>Configuración de la aplicación</Label>
      {!config && <Text style={{ color: C.muted, fontSize: 11 }}>No hay configuración registrada.</Text>}
      {config && (
        <Card style={{ padding: 13 }}>
          <Label style={{ fontSize: 14 }}>{config.app || 'QPONS VIP'}</Label>
          <Text style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>{formatVersion(config.version_number)}</Text>
        </Card>
      )}
    </View>
  );
}
