import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Field, Header, Label } from '../../shared/components/UI.js';
import { authApi } from '../../services/api/auth.service';
import { validateLogin } from '../../shared/utils/formValidation.js';
import { colors as C } from '../../shared/theme/colors.js';

// Acceso separado para negocios; el rol se valida con la respuesta del backend.
export function BusinessAccessScreen({ onBack, onAuthenticated, onRegister }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  async function handleLogin() {
    setLoading(true);
    const validationErrors = validateLogin({ email, password });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) {
      setLoading(false);
      return;
    }

    try {
      const session = await authApi.login(email.trim().toLowerCase(), password);
      if (!['business', 'admin'].includes(session.user.role)) {
        throw new Error('Esta cuenta pertenece a un cliente VIP, no a un negocio.');
      }
      onAuthenticated(session);
    } catch (requestError) {
      setErrors({ form: requestError.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <Header title="Acceso para negocios" back={onBack} />
      <Card>
        <Label style={{ fontSize: 22 }}>Portal de negocios</Label>
        <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 8 }}>
          Administra tu empresa, sucursales y promociones desde un espacio privado.
        </Text>
        <Field label="Correo empresarial" value={email} onChangeText={(value) => { setEmail(value); setErrors((current) => ({ ...current, email: '', form: '' })); }} error={errors.email} placeholder="negocio@ejemplo.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Field label="Contraseña" value={password} onChangeText={(value) => { setPassword(value); setErrors((current) => ({ ...current, password: '', form: '' })); }} error={errors.password} placeholder="Tu contraseña" secureTextEntry autoComplete="current-password" />
        {errors.form && <Text accessibilityRole="alert" style={{ color: C.pink, fontSize: 12, marginTop: 12 }}>{errors.form}</Text>}
        <Button onPress={handleLogin}>
          {loading ? 'Validando acceso...' : 'Entrar al panel'}
        </Button>
        {onRegister ? <Pressable onPress={onRegister} accessibilityRole="button" style={{ alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 10 }}><Text style={{ color: C.pink, fontSize: 12, fontWeight: '700' }}>¿Aún no tienes cuenta? Registrar negocio</Text></Pressable> : null}
      </Card>
      <Text style={{ color: C.muted, textAlign: 'center', fontSize: 11 }}>
        Solo las cuentas con rol business o admin pueden continuar.
      </Text>
    </View>
  );
}
