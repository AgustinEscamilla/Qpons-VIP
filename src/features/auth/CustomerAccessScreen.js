import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { authApi } from '../../services/api/auth.service';
import { validateLogin } from '../../shared/utils/formValidation.js';
import { colors as C } from '../../shared/theme/colors.js';
import { Button, Card, Field, Label } from '../../shared/components/UI.js';

// Inicio de sesión de cliente con validación local y credenciales verificadas por NestJS.
export function CustomerAccessScreen({ onAuthenticated, onRegister }) {
  const [accountType, setAccountType] = React.useState('customer');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errors, setErrors] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);

  const isBusiness = accountType === 'business';

  async function submit() {
    const validationErrors = validateLogin({ email, password });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setSubmitting(true);
    try {
      const session = await authApi.login(email.trim().toLowerCase(), password);
      const roleMatchesSelection = isBusiness
        ? session.user.role === 'business' || session.user.role === 'admin'
        : session.user.role === 'customer' || session.user.role === 'admin';
      if (!roleMatchesSelection) {
        throw new Error(isBusiness
          ? 'Esta cuenta pertenece a un cliente. Selecciona Usuario para iniciar sesión.'
          : 'Esta cuenta pertenece a un negocio. Selecciona Negocio para iniciar sesión.');
      }
      onAuthenticated(session, accountType);
    } catch (error) {
      setErrors({ form: error.message || 'No se pudo iniciar sesión.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ width: '100%', alignItems: 'center' }}>
      <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <Label style={{ fontSize: 22, fontWeight: '800' }}>QPONS <Text style={{ color: C.pink }}>VIP</Text></Label>
        <Text style={{ color: C.navy, backgroundColor: C.white, padding: 12, borderRadius: 24 }}>⌖ McAllen, TX</Text>
      </View>
      <View style={{ alignItems: 'center', marginBottom: 22 }}>
        <Text style={{ color: C.pink, backgroundColor: '#FFE0E5', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, letterSpacing: 2 }}>● PRIVILEGE CLUB</Text>
        <Text style={{ color: C.navy, fontSize: 25, fontWeight: '700', marginTop: 18 }}>Bienvenido a QPONS VIP</Text>
        <Text style={{ color: C.muted, textAlign: 'center', fontSize: 15, lineHeight: 23, marginTop: 8 }}>Accede a descuentos y experiencias exclusivas en McAllen y el Valle.</Text>
      </View>
      {/* Permite elegir claramente qué tipo de cuenta quiere iniciar sesión. */}
      <View style={{ width: '100%', flexDirection: 'row', backgroundColor: C.pale, padding: 5, borderRadius: 30, marginBottom: 18 }}>
        <View style={{ flex: 1, backgroundColor: C.navy, padding: 13, borderRadius: 28 }}><Text style={{ color: C.white, textAlign: 'center', fontWeight: '700' }}>• Iniciar sesión</Text></View>
        <Pressable onPress={() => onRegister(accountType)} style={{ flex: 1, padding: 13 }}><Text style={{ color: C.muted, textAlign: 'center' }}>Registrarse</Text></Pressable>
      </View>
      <Card style={{ width: '100%', padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Label>Correo o teléfono móvil</Label>
          <Text style={{ color: C.green, fontSize: 12 }}>Verificado VIP</Text>
        </View>
        {/* Selector de tipo de cuenta dentro del formulario de acceso. */}
        <View accessibilityRole="tablist" style={{ width: '100%', flexDirection: 'row', backgroundColor: C.pale, padding: 5, borderRadius: 30, marginTop: 12, marginBottom: 16 }}>
          <Pressable accessibilityRole="tab" accessibilityState={{ selected: !isBusiness }} onPress={() => { setAccountType('customer'); setErrors({}); }} style={{ flex: 1, backgroundColor: !isBusiness ? C.navy : 'transparent', padding: 11, borderRadius: 28 }}>
            <Text style={{ color: !isBusiness ? C.white : C.muted, textAlign: 'center', fontWeight: '700' }}>Usuario</Text>
          </Pressable>
          <Pressable accessibilityRole="tab" accessibilityState={{ selected: isBusiness }} onPress={() => { setAccountType('business'); setErrors({}); }} style={{ flex: 1, backgroundColor: isBusiness ? C.navy : 'transparent', padding: 11, borderRadius: 28 }}>
            <Text style={{ color: isBusiness ? C.white : C.muted, textAlign: 'center', fontWeight: '700' }}>Negocio</Text>
          </Pressable>
        </View>
        <Field label={isBusiness ? 'Correo empresarial' : 'Correo electrónico'} value={email} onChangeText={(value) => { setEmail(value); setErrors((current) => ({ ...current, email: '', form: '' })); }} error={errors.email} placeholder={isBusiness ? 'negocio@ejemplo.com' : 'tucorreo@ejemplo.com'} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Field label="Contraseña" value={password} onChangeText={(value) => { setPassword(value); setErrors((current) => ({ ...current, password: '', form: '' })); }} error={errors.password} placeholder={isBusiness ? 'Tu contraseña empresarial' : 'Escribe tu contraseña'} secureTextEntry autoComplete="current-password" />
        {errors.form ? <Text accessibilityRole="alert" style={{ color: C.pink, fontSize: 12, marginTop: 12 }}>{errors.form}</Text> : null}
        <Button onPress={submit}>{submitting ? 'Validando acceso...' : isBusiness ? 'Entrar al portal de negocio →' : 'Iniciar sesión VIP →'}</Button>
      </Card>
      <Card style={{ width: '100%', backgroundColor: C.pale }}>
        <Label>{isBusiness ? '¿Aún no tienes cuenta de negocio?' : '¿Aún no eres Miembro VIP?'}</Label>
        <Text style={{ color: C.muted, marginTop: 6 }}>{isBusiness ? 'Registra tu negocio para administrar sucursales y promociones. ' : 'Recibe $2,000+ en cupones exclusivos. '}<Text onPress={() => onRegister(accountType)} style={{ color: C.pink }}>{isBusiness ? 'Registrar negocio →' : 'Unirme →'}</Text></Text>
      </Card>
    </View>
  );
}
