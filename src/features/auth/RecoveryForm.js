import React from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Field, Header, Label } from '../../shared/components/UI.js';
import { validateRecovery, validateVerificationCode } from '../../shared/utils/formValidation.js';
import { colors as C } from '../../shared/theme/colors.js';

// Comprueba formato y coincidencia; el restablecimiento no se simula si la API no existe.
export function RecoveryForm({ onBack }) {
  const [form, setForm] = React.useState({ email: '', code: '', password: '', confirmation: '' });
  const [errors, setErrors] = React.useState({});

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '', form: '' }));
  }

  function submit() {
    const nextErrors = validateRecovery(form);
    const codeError = validateVerificationCode(form.code);
    if (codeError) nextErrors.code = codeError;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setErrors({ form: 'La recuperación de contraseña todavía no está habilitada en el servidor.' });
  }

  return (
    <View>
      <Header title="Recuperar contraseña" back={onBack} />
      <Text style={{ color: C.muted, lineHeight: 20, marginBottom: 10 }}>
        Completa los datos para validar el formato. Aún no se envían códigos ni se cambia la contraseña.
      </Text>
      <Card>
        <Label>Restablece tu acceso</Label>
        <Field label="Correo electrónico" value={form.email} onChangeText={(value) => updateField('email', value)} error={errors.email} placeholder="tucorreo@ejemplo.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Field label="Código de verificación" value={form.code} onChangeText={(value) => updateField('code', value.replace(/\D/g, '').slice(0, 4))} error={errors.code} placeholder="4 dígitos" keyboardType="number-pad" maxLength={4} autoComplete="one-time-code" />
        <Field label="Nueva contraseña" value={form.password} onChangeText={(value) => updateField('password', value)} error={errors.password} placeholder="8 caracteres, un número y un símbolo" secureTextEntry autoComplete="new-password" />
        <Field label="Confirmar contraseña" value={form.confirmation} onChangeText={(value) => updateField('confirmation', value)} error={errors.confirmation} placeholder="Repite la nueva contraseña" secureTextEntry autoComplete="new-password" />
        {errors.form ? <Text accessibilityRole="alert" style={{ color: C.pink, marginTop: 12, fontSize: 12 }}>{errors.form}</Text> : null}
        <Button onPress={submit}>Validar datos</Button>
      </Card>
    </View>
  );
}
