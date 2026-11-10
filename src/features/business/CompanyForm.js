import React from 'react';
import { Text } from 'react-native';
import { Button, Card, Field, Label } from '../../shared/components/UI.js';
import { validatePhone } from '../../shared/utils/formValidation.js';
import { colors as C } from '../../shared/theme/colors.js';

const emptyCompany = {
  name: '',
  description: '',
  phone: '',
  website: '',
  facebook: '',
  instagram: '',
  tiktok: '',
  keywords: '',
};

// Captura la información inicial y solicita al backend crear y asociar la empresa.
export function CompanyForm({ onSubmit, initialCompany = null }) {
  const [form, setForm] = React.useState(() => Object.fromEntries(Object.keys(emptyCompany).map((field) => [field, initialCompany?.[field] ?? ''])));
  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '', form: '' }));
  }

  async function submit() {
    const nextErrors = {};
    if (form.name.trim().length < 2) nextErrors.name = 'Escribe el nombre comercial (mínimo 2 caracteres).';
    if (form.name.trim().length > 120) nextErrors.name = 'El nombre no puede superar 120 caracteres.';
    if (form.description.trim().length < 10) nextErrors.description = 'Describe tu negocio con al menos 10 caracteres.';
    const phoneError = validatePhone(form.phone);
    if (phoneError) nextErrors.phone = phoneError;
    if (form.keywords.trim().length < 2) nextErrors.keywords = 'Escribe al menos una palabra clave.';
    if (form.website.trim()) {
      try {
        const website = form.website.trim().startsWith('http') ? form.website.trim() : `https://${form.website.trim()}`;
        if (!new URL(website).hostname.includes('.')) throw new Error('Dirección inválida');
      } catch {
        nextErrors.website = 'Escribe una página válida, por ejemplo mipagina.com.';
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      await onSubmit(Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()])));
    } catch (error) {
      setErrors({ form: error.message || 'No se pudo registrar la empresa.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card style={{ padding: 16 }}>
      <Label style={{ fontSize: 17 }}>{initialCompany ? 'Edita tu perfil público' : 'Registra tu empresa'}</Label>
      <Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 5 }}>
        {initialCompany ? 'Estos datos aparecen en la ficha que ven tus clientes. Puedes cambiar la descripción, teléfono, sitio web y redes.' : 'Al guardar, esta empresa quedará vinculada a tu cuenta. Después podrás asociar sucursales y consultar sus promociones.'}
      </Text>
      <Field label="Nombre comercial *" value={form.name} onChangeText={(value) => updateField('name', value)} error={errors.name} placeholder="Ej. Café del Valle" autoCapitalize="words" maxLength={120} />
      <Field label="Descripción *" value={form.description} onChangeText={(value) => updateField('description', value)} error={errors.description} placeholder="Cuéntales a tus clientes qué ofrece tu negocio (mínimo 10 caracteres)" maxLength={2000} multiline />
      <Field label="Teléfono *" value={form.phone} onChangeText={(value) => updateField('phone', value)} error={errors.phone} placeholder="+1 (956) 000-0000" keyboardType="phone-pad" autoComplete="tel" />
      <Field label="Sitio web (opcional)" value={form.website} onChangeText={(value) => updateField('website', value)} error={errors.website} placeholder="mipagina.com" autoCapitalize="none" keyboardType="url" maxLength={200} />
      <Field label="Facebook (opcional)" value={form.facebook} onChangeText={(value) => updateField('facebook', value)} placeholder="Enlace o nombre de usuario" autoCapitalize="none" maxLength={200} />
      <Field label="Instagram (opcional)" value={form.instagram} onChangeText={(value) => updateField('instagram', value)} placeholder="@tunegocio" autoCapitalize="none" maxLength={100} />
      <Field label="TikTok (opcional)" value={form.tiktok} onChangeText={(value) => updateField('tiktok', value)} placeholder="@tunegocio" autoCapitalize="none" maxLength={100} />
      <Field label="Palabras clave *" value={form.keywords} onChangeText={(value) => updateField('keywords', value)} error={errors.keywords} placeholder="Ej. café, desayunos, postres" maxLength={500} />
      {errors.form ? <Text accessibilityRole="alert" style={{ color: C.pink, fontSize: 12, marginTop: 12 }}>{errors.form}</Text> : null}
      <Button onPress={submit}>{saving ? 'Guardando empresa...' : initialCompany ? 'Guardar cambios del perfil' : 'Guardar y vincular empresa'}</Button>
    </Card>
  );
}
