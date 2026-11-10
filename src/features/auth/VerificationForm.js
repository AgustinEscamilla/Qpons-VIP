import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Field, Header, Label } from '../../shared/components/UI.js';
import { validateVerificationCode } from '../../shared/utils/formValidation.js';
import { colors as C } from '../../shared/theme/colors.js';

export function VerificationForm({ registration, onBack, onVerify, onResend }) {
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [developmentCode, setDevelopmentCode] = React.useState(registration?.developmentCode || '');
  const [submitting, setSubmitting] = React.useState(false);
  const [resending, setResending] = React.useState(false);

  async function submit() {
    const validationError = validateVerificationCode(code);
    if (validationError) { setError(validationError); return; }
    setSubmitting(true);
    setError('');
    try { await onVerify(code); } catch (requestError) { setError(requestError.message || 'No se pudo verificar el codigo.'); }
    finally { setSubmitting(false); }
  }

  async function resend() {
    setResending(true);
    setError('');
    setMessage('');
    try {
      const response = await onResend();
      setDevelopmentCode(response?.developmentCode || '');
      setMessage('Si el correo tiene un registro pendiente, enviamos un codigo nuevo.');
    } catch (requestError) { setError(requestError.message || 'No se pudo reenviar el codigo.'); }
    finally { setResending(false); }
  }

  return <View>
    <Header title="Verifica tu cuenta" back={onBack} />
    <Card>
      <Label>Confirma tus datos</Label>
      <Text style={{ color: C.muted, lineHeight: 19, marginTop: 6, fontSize: 12 }}>Enviamos un codigo de 6 digitos a {registration?.email || 'tu correo'}. Al verificarlo, confirmas el correo y creamos tu cuenta.</Text>
      {registration?.role === 'business' ? <View style={{ backgroundColor: C.pale, borderRadius: 16, padding: 12, marginTop: 12 }}>
        <Text style={{ color: C.navy, fontSize: 12, fontWeight: '800' }}>Solicitud de negocio: {registration.name}</Text>
        <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 4 }}>Telefono: {registration.phone}</Text>
        <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 3 }}>Descripcion: {registration.businessDescription}</Text>
        <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 3 }}>Palabras clave: {registration.businessKeywords}</Text>
        <Text style={{ color: C.pink, fontSize: 10, lineHeight: 15, marginTop: 7 }}>La empresa quedara pendiente de aprobacion despues de verificar el correo.</Text>
      </View> : null}
      <Field label="Codigo de verificacion" value={code} onChangeText={(value) => { setCode(value.replace(/\D/g, '').slice(0, 6)); setError(''); }} error={error && /^Escribe/.test(error) ? error : ''} placeholder="000000" keyboardType="number-pad" maxLength={6} autoComplete="one-time-code" />
      {developmentCode ? <Text accessibilityRole="alert" style={{ color: C.pink, marginTop: 10, fontSize: 12, fontWeight: '700' }}>Codigo de prueba local: {developmentCode}</Text> : null}
      {message ? <Text accessibilityLiveRegion="polite" style={{ color: C.green, marginTop: 10, fontSize: 11 }}>{message}</Text> : null}
      {error && !/^Escribe/.test(error) ? <Text accessibilityRole="alert" style={{ color: C.pink, marginTop: 12, fontSize: 12 }}>{error}</Text> : null}
      <Button onPress={submit}>{submitting ? 'Verificando...' : 'Confirmar correo y crear cuenta'}</Button>
      <Pressable accessibilityRole="button" disabled={resending} onPress={resend} style={{ alignItems: 'center', paddingVertical: 12, opacity: resending ? 0.6 : 1 }}><Text style={{ color: C.navy, fontSize: 12, fontWeight: '700' }}>{resending ? 'Enviando codigo...' : 'Reenviar codigo'}</Text></Pressable>
    </Card>
  </View>;
}
