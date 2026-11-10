import React from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Field } from '../../shared/components/UI.js';
import { RegistrationRoleSelector } from './RegistrationRoleSelector.js';
import { colors as C } from '../../shared/theme/colors.js';

// Registro centrado con una selección clara entre cliente y negocio.
export function RegistrationScreen({ role, onRoleChange, onBack, onContinue }) {
  const businessRegistration = role === 'business';

  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <View style={{ width: '100%', maxWidth: 700, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <Text onPress={onBack} style={{ color: C.navy, backgroundColor: C.pale, borderRadius: 24, padding: 14, fontSize: 20 }}>‹</Text>
        <Text style={{ color: C.navy, backgroundColor: '#FFE0E5', borderRadius: 18, paddingHorizontal: 13, paddingVertical: 7, fontSize: 11 }}>● QPONS VIP CLUB</Text>
        <View style={{ width: 42 }} />
      </View>
      <View style={{ width: '100%', maxWidth: 700, alignItems: 'center', marginBottom: 18 }}>
        <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.white, fontSize: 27 }}>♙</Text></View>
        <Text style={{ color: C.pink, backgroundColor: '#FFE0E5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, fontSize: 10, marginTop: 12 }}>MEMBRESÍA EXCLUSIVA</Text>
        <Text style={{ color: C.navy, fontSize: 25, fontWeight: '800', marginTop: 8 }}>Crea tu cuenta {businessRegistration ? 'de negocio' : 'VIP'}</Text>
        <Text style={{ color: C.muted, textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 5 }}>Únete a QPONS VIP y disfruta promociones y experiencias exclusivas en McAllen y el Valle.</Text>
      </View>
      <View style={{ width: '100%', maxWidth: 700 }}>
        <RegistrationRoleSelector role={role} onChange={onRoleChange} visible />
        <Text style={{ color: C.muted, textAlign: 'center', fontSize: 11, marginBottom: 10 }}>
          {businessRegistration ? 'Administra tu empresa y publica promociones.' : 'Recibe beneficios y cupones exclusivos.'}
        </Text>
        <Card style={{ padding: 14 }}>
          <Field label={businessRegistration ? 'Nombre del negocio' : 'Nombre completo'} placeholder={businessRegistration ? 'Nombre comercial' : 'Como aparece en tu identificación'} />
          <Field label="Correo electrónico" placeholder="tucorreo@ejemplo.com" />
          <Field label="Teléfono móvil" placeholder="+1 (956) 000-0000" />
          <Field label="Crear contraseña" placeholder="Mínimo 8 caracteres" secureTextEntry />
          <Field label="Confirmar contraseña" placeholder="Repite tu contraseña" secureTextEntry />
          <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 12 }}>Al crear tu cuenta, aceptas los términos de servicio y la política de privacidad de QPONS VIP.</Text>
        </Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.pale, borderRadius: 16, padding: 12, marginBottom: 5 }}><Text style={{ color: C.green, marginRight: 8 }}>✓</Text><Text style={{ flex: 1, color: C.muted, fontSize: 10 }}>Tus datos estarán protegidos con seguridad VIP.</Text></View>
        <Button onPress={onContinue}>{businessRegistration ? 'Crear cuenta de negocio →' : 'Crear mi cuenta VIP →'}</Button>
      </View>
    </View>
  );
}
