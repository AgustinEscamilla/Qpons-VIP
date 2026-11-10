import React from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { authApi } from '../../services/api/auth.service';
import { validateLogin, validateRegistration } from '../../shared/utils/formValidation.js';
import { colors as C } from '../../shared/theme/colors.js';
import { Button, Field } from '../../shared/components/UI.js';

// Acceso VIP en una ventana superpuesta para conservar visible la página actual.
export function DesktopMemberGate({ visible, onClose, onAuthenticated }) {
  const [mode, setMode] = React.useState('choice');
  const [accountType, setAccountType] = React.useState('customer');
  const [login, setLogin] = React.useState({ email: '', password: '' });
  const [registration, setRegistration] = React.useState({ name: '', email: '', phone: '', password: '', confirmation: '', businessDescription: '', businessKeywords: '' });
  const [pendingRegistration, setPendingRegistration] = React.useState(null);
  const [verificationCode, setVerificationCode] = React.useState('');
  const [developmentCode, setDevelopmentCode] = React.useState('');
  const [errors, setErrors] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);

  function dismiss() {
    setMode('choice');
    setErrors({});
    onClose();
  }

  const update = (form, setter, field, value) => {
    setter((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '', form: '' }));
  };

  async function submitLogin() {
    const validation = validateLogin(login);
    setErrors(validation);
    if (Object.keys(validation).length) return;
    setSubmitting(true);
    try {
      const session = await authApi.login(login.email.trim().toLowerCase(), login.password);
      const roleMatchesSelection = accountType === 'business'
        ? ['business', 'admin'].includes(session.user.role)
        : ['customer', 'admin'].includes(session.user.role);
      if (!roleMatchesSelection) {
        throw new Error(accountType === 'business'
          ? 'Esta cuenta es de cliente. Selecciona Usuario para iniciar sesión.'
          : 'Esta cuenta es de negocio. Selecciona Negocio para iniciar sesión.');
      }
      onAuthenticated(session, accountType);
    } catch (error) {
      setErrors({ form: error.message || 'No se pudo iniciar sesión.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitRegistration() {
    const validation = validateRegistration(registration);
    if (accountType === 'business' && registration.businessDescription.trim().length < 10) validation.businessDescription = 'Describe tu negocio con al menos 10 caracteres.';
    if (accountType === 'business' && registration.businessKeywords.trim().length < 2) validation.businessKeywords = 'Escribe al menos una palabra clave.';
    setErrors(validation);
    if (Object.keys(validation).length) return;
    setSubmitting(true);
    try {
      const payload = {
        name: registration.name.trim(),
        email: registration.email.trim().toLowerCase(),
        phone: registration.phone.trim(),
        password: registration.password,
        role: accountType,
        ...(accountType === 'business' ? { businessDescription: registration.businessDescription.trim(), businessKeywords: registration.businessKeywords.trim() } : {}),
      };
      const response = await authApi.register(payload);
      setPendingRegistration({ ...response, ...payload });
      setDevelopmentCode(response.developmentCode || '');
      setVerificationCode('');
      setMode('verify');
    } catch (error) {
      setErrors({ form: error.message || 'No se pudo crear la cuenta.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitVerification() {
    if (!/^\d{6}$/.test(verificationCode)) { setErrors({ form: 'Escribe el codigo completo de 6 digitos.' }); return; }
    setSubmitting(true);
    try {
      const session = await authApi.verifyRegistration(pendingRegistration.email, verificationCode);
      onAuthenticated(session, accountType);
    } catch (error) { setErrors({ form: error.message || 'No se pudo verificar el correo.' }); }
    finally { setSubmitting(false); }
  }

  async function resendCode() {
    setSubmitting(true);
    setErrors({});
    try {
      const response = await authApi.resendRegistrationCode(pendingRegistration.email);
      setDevelopmentCode(response.developmentCode || '');
    } catch (error) { setErrors({ form: error.message || 'No se pudo reenviar el codigo.' }); }
    finally { setSubmitting(false); }
  }

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setErrors({});
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss} statusBarTranslucent>
      <View style={{ position: 'relative', zIndex: 1000, elevation: 1000, flex: 1, backgroundColor: 'rgba(16,27,48,0.56)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Pressable onPress={dismiss} accessibilityRole="button" accessibilityLabel="Cerrar ventana de acceso" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
        <View style={{ width: '100%', maxWidth: 480, maxHeight: '90%', backgroundColor: C.white, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#E9EDF5', shadowColor: C.navy, shadowOpacity: 0.2, shadowRadius: 28, elevation: 12 }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 28 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ color: C.navy, fontSize: 15, fontWeight: '900' }}>QPONS <Text style={{ color: C.pink }}>VIP</Text></Text>
              <Pressable onPress={dismiss} accessibilityRole="button" accessibilityLabel="Cerrar" style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.navy, fontSize: 22 }}>×</Text></Pressable>
            </View>
            <Text style={{ color: C.navy, fontSize: 23, fontWeight: '800', textAlign: 'center' }}>{mode === 'choice' ? 'Únete a QPONS VIP' : mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta VIP'}</Text>
            <Text style={{ color: C.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8, marginBottom: 22 }}>
              {mode === 'choice' ? 'Elige tu tipo de cuenta para iniciar sesión o registrarte.' : mode === 'login' ? (accountType === 'business' ? 'Accede al portal para administrar tu negocio.' : 'Accede a tus pases y beneficios guardados.') : (accountType === 'business' ? 'Registra tu negocio en QPONS VIP.' : 'Regístrate gratis para guardar y canjear tus beneficios VIP.')}
            </Text>

            {mode === 'choice' ? <>
              <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: C.pale, padding: 4, borderRadius: 26, marginBottom: 12 }}>
                {['customer', 'business'].map((type) => <Pressable key={type} accessibilityRole="tab" accessibilityState={{ selected: accountType === type }} onPress={() => setAccountType(type)} style={{ flex: 1, paddingVertical: 11, borderRadius: 22, backgroundColor: accountType === type ? C.navy : 'transparent' }}><Text style={{ color: accountType === type ? C.white : C.muted, textAlign: 'center', fontSize: 13, fontWeight: '700' }}>{type === 'customer' ? 'Usuario' : 'Negocio'}</Text></Pressable>)}
              </View>
              <Button onPress={() => changeMode('login')} style={{ marginTop: 0 }}>{accountType === 'business' ? 'Iniciar sesión de negocio' : 'Iniciar sesión'}</Button>
              <Button onPress={() => changeMode('register')} secondary>{accountType === 'business' ? 'Registrar negocio' : 'Registrarse'}</Button>
              <Text style={{ color: C.muted, textAlign: 'center', fontSize: 12, marginTop: 18 }}>¿Solo estás explorando? Cierra esta ventana para volver al catálogo.</Text>
            </> : <>
              {mode !== 'verify' ? <View style={{ flexDirection: 'row', backgroundColor: C.pale, padding: 4, borderRadius: 26, marginBottom: 8 }}>
                {['login', 'register'].map((option) => <Pressable key={option} onPress={() => changeMode(option)} style={{ flex: 1, paddingVertical: 10, borderRadius: 22, backgroundColor: mode === option ? C.navy : 'transparent' }}><Text style={{ color: mode === option ? C.white : C.muted, textAlign: 'center', fontSize: 12, fontWeight: '700' }}>{option === 'login' ? 'Iniciar sesión' : 'Registrarse'}</Text></Pressable>)}
              </View> : null}
              {mode !== 'verify' ? <Text style={{ color: C.navy, fontSize: 12, fontWeight: '700', marginTop: 10 }}>Tipo de cuenta</Text> : null}
              {mode !== 'verify' ? <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: C.pale, padding: 4, borderRadius: 26, marginTop: 8, marginBottom: 8 }}>
                {['customer', 'business'].map((type) => <Pressable key={type} accessibilityRole="tab" accessibilityState={{ selected: accountType === type }} onPress={() => { setAccountType(type); setErrors({}); }} style={{ flex: 1, paddingVertical: 10, borderRadius: 22, backgroundColor: accountType === type ? C.navy : 'transparent' }}><Text style={{ color: accountType === type ? C.white : C.muted, textAlign: 'center', fontSize: 12, fontWeight: '700' }}>{type === 'customer' ? 'Cuenta de cliente' : 'Cuenta de negocio'}</Text></Pressable>)}
              </View> : null}
              {mode === 'login' ? <>
                <Field label="Correo electrónico" value={login.email} onChangeText={(value) => update(login, setLogin, 'email', value)} error={errors.email} placeholder="tucorreo@ejemplo.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
                <Field label="Contraseña" value={login.password} onChangeText={(value) => update(login, setLogin, 'password', value)} error={errors.password} placeholder="Escribe tu contraseña" secureTextEntry autoComplete="current-password" />
              </> : mode === 'register' ? <>
                <Field label="Nombre completo" value={registration.name} onChangeText={(value) => update(registration, setRegistration, 'name', value)} error={errors.name} placeholder="Tu nombre" autoCapitalize="words" autoComplete="name" />
                <Field label="Correo electrónico" value={registration.email} onChangeText={(value) => update(registration, setRegistration, 'email', value)} error={errors.email} placeholder="tucorreo@ejemplo.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
                <Field label="Teléfono móvil" value={registration.phone} onChangeText={(value) => update(registration, setRegistration, 'phone', value)} error={errors.phone} placeholder="+1 (956) 000-0000" keyboardType="phone-pad" autoComplete="tel" />
                {accountType === 'business' ? <>
                  <Field label="Descripción del negocio" value={registration.businessDescription} onChangeText={(value) => update(registration, setRegistration, 'businessDescription', value)} error={errors.businessDescription} placeholder="¿Qué ofrece tu negocio?" multiline maxLength={2000} />
                  <Field label="Palabras clave" value={registration.businessKeywords} onChangeText={(value) => update(registration, setRegistration, 'businessKeywords', value)} error={errors.businessKeywords} placeholder="Ej. café, comida, promociones" maxLength={500} />
                </> : null}
                <Field label="Crear contraseña" value={registration.password} onChangeText={(value) => update(registration, setRegistration, 'password', value)} error={errors.password} placeholder="Mínimo 8 caracteres, un número y un símbolo" secureTextEntry autoComplete="new-password" />
                <Field label="Confirmar contraseña" value={registration.confirmation} onChangeText={(value) => update(registration, setRegistration, 'confirmation', value)} error={errors.confirmation} placeholder="Repite tu contraseña" secureTextEntry autoComplete="new-password" />
              </> : <>
                <Text style={{ color: C.muted, fontSize: 12, lineHeight: 19 }}>Escribe el codigo de 6 digitos que enviamos a {pendingRegistration?.email}.</Text>
                {accountType === 'business' ? <View style={{ backgroundColor: C.pale, padding: 12, borderRadius: 14, marginTop: 10 }}><Text style={{ color: C.navy, fontWeight: '700', fontSize: 12 }}>Solicitud para: {pendingRegistration?.name}</Text><Text style={{ color: C.muted, fontSize: 10, marginTop: 5 }}>{pendingRegistration?.businessDescription}</Text><Text style={{ color: C.pink, fontSize: 10, marginTop: 6 }}>Quedara pendiente de aprobacion despues de verificar el correo.</Text></View> : null}
                <Field label="Codigo de verificacion" value={verificationCode} onChangeText={(value) => { setVerificationCode(value.replace(/\D/g, '').slice(0, 6)); setErrors({}); }} error={errors.code} placeholder="000000" keyboardType="number-pad" maxLength={6} autoComplete="one-time-code" />
                {developmentCode ? <Text style={{ color: C.pink, fontSize: 12, marginTop: 8 }}>Codigo de prueba: {developmentCode}</Text> : null}
                <Pressable onPress={resendCode} accessibilityRole="button" disabled={submitting} style={{ paddingVertical: 11 }}><Text style={{ color: C.navy, fontSize: 12, textAlign: 'center', fontWeight: '700' }}>Reenviar codigo</Text></Pressable>
              </>}
              {errors.form ? <Text accessibilityRole="alert" style={{ color: C.pink, fontSize: 12, marginTop: 12 }}>{errors.form}</Text> : null}
              <Button onPress={mode === 'login' ? submitLogin : mode === 'register' ? submitRegistration : submitVerification}>{submitting ? 'Procesando...' : mode === 'login' ? 'Iniciar sesión VIP →' : mode === 'register' ? accountType === 'business' ? 'Crear cuenta de negocio →' : 'Crear mi cuenta VIP →' : 'Confirmar correo y continuar'}</Button>
              {mode !== 'verify' ? <Pressable onPress={() => changeMode('choice')} style={{ padding: 12, marginTop: 6 }}><Text style={{ color: C.muted, textAlign: 'center', fontSize: 12 }}>Volver a las opciones</Text></Pressable> : null}
            </>}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
