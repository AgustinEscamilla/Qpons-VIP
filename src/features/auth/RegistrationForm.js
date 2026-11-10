import React from 'react';
import { Text, View } from 'react-native';
import { Button, Card, Field } from '../../shared/components/UI.js';
import { RegistrationRoleSelector } from './RegistrationRoleSelector.js';
import { validateRegistration } from '../../shared/utils/formValidation.js';
import { colors as C } from '../../shared/theme/colors.js';

// Valida todos los campos antes de pedirle al backend que cree la cuenta.
export function RegistrationForm({ role, onRoleChange, onBack, onContinue }) {
  const isBusiness = role === 'business';
  const [form, setForm] = React.useState({ name: '', email: '', phone: '', password: '', confirmation: '', businessDescription: '', businessKeywords: '' });
  const [errors, setErrors] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '', form: '' }));
  }

  async function submit() {
    const validationErrors = validateRegistration(form);
    if (isBusiness && form.businessDescription.trim().length < 10) validationErrors.businessDescription = 'Describe tu negocio con al menos 10 caracteres.';
    if (isBusiness && form.businessKeywords.trim().length < 2) validationErrors.businessKeywords = 'Escribe al menos una palabra clave.';
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setSubmitting(true);
    try {
      await onContinue({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        role,
        ...(isBusiness ? { businessDescription: form.businessDescription.trim(), businessKeywords: form.businessKeywords.trim() } : {}),
      });
    } catch (error) {
      setErrors({ form: error.message || 'No se pudo crear la cuenta.' });
    } finally {
      setSubmitting(false);
    }
  }

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
        <Text style={{ color: C.navy, fontSize: 25, fontWeight: '800', marginTop: 8 }}>Crea tu cuenta {isBusiness ? 'de negocio' : 'VIP'}</Text>
        <Text style={{ color: C.muted, textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 5 }}>Únete a QPONS VIP y disfruta promociones y experiencias exclusivas en McAllen y el Valle.</Text>
      </View>
      <View style={{ width: '100%', maxWidth: 700 }}>
        <RegistrationRoleSelector role={role} onChange={onRoleChange} visible />
        <Text style={{ color: C.muted, textAlign: 'center', fontSize: 11, marginBottom: 10 }}>
          {isBusiness ? 'Administra tu empresa y publica promociones.' : 'Recibe beneficios y cupones exclusivos.'}
        </Text>
        <Card style={{ padding: 14 }}>
          <Field label={isBusiness ? 'Nombre del negocio' : 'Nombre completo'} value={form.name} onChangeText={(value) => updateField('name', value)} error={errors.name} placeholder={isBusiness ? 'Nombre comercial' : 'Como aparece en tu identificación'} autoCapitalize="words" autoComplete="name" />
          <Field label="Correo electrónico" value={form.email} onChangeText={(value) => updateField('email', value)} error={errors.email} placeholder="tucorreo@ejemplo.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          <Field label="Teléfono móvil" value={form.phone} onChangeText={(value) => updateField('phone', value)} error={errors.phone} placeholder="+1 (956) 000-0000" keyboardType="phone-pad" autoComplete="tel" />
          {isBusiness ? <>
            <Field label="Descripción del negocio" value={form.businessDescription} onChangeText={(value) => updateField('businessDescription', value)} error={errors.businessDescription} placeholder="¿Qué ofrece tu negocio?" multiline maxLength={2000} />
            <Field label="Palabras clave" value={form.businessKeywords} onChangeText={(value) => updateField('businessKeywords', value)} error={errors.businessKeywords} placeholder="Ej. tacos, café, descuentos" maxLength={500} />
            <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 8 }}>Al confirmar tu correo, tu empresa quedará pendiente de revisión antes de aparecer públicamente.</Text>
          </> : null}
          <Field label="Crear contraseña" value={form.password} onChangeText={(value) => updateField('password', value)} error={errors.password} placeholder="Mínimo 8 caracteres, un número y un símbolo" secureTextEntry autoComplete="new-password" />
          <Field label="Confirmar contraseña" value={form.confirmation} onChangeText={(value) => updateField('confirmation', value)} error={errors.confirmation} placeholder="Repite tu contraseña" secureTextEntry autoComplete="new-password" />
          {errors.form ? <Text accessibilityRole="alert" style={{ color: C.pink, fontSize: 12, marginTop: 12 }}>{errors.form}</Text> : null}
          <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 12 }}>Al crear tu cuenta, aceptas los términos de servicio y la política de privacidad de QPONS VIP.</Text>
        </Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.pale, borderRadius: 16, padding: 12, marginBottom: 5 }}><Text style={{ color: C.green, marginRight: 8 }}>✓</Text><Text style={{ flex: 1, color: C.muted, fontSize: 10 }}>Tus datos estarán protegidos con seguridad VIP.</Text></View>
        <Button onPress={submit}>{submitting ? 'Creando cuenta...' : isBusiness ? 'Crear cuenta de negocio →' : 'Crear mi cuenta VIP →'}</Button>
      </View>
    </View>
  );
}
