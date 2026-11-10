// Reglas compartidas para que las pantallas validen datos de la misma manera.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_DIGITS_PATTERN = /^\+?[\d\s().-]+$/;

export function validateEmail(email) {
  const normalizedEmail = String(email ?? '').trim();

  if (!normalizedEmail) return 'Escribe tu correo electrónico.';
  if (!EMAIL_PATTERN.test(normalizedEmail)) return 'Escribe un correo electrónico válido.';

  return '';
}

export function validatePhone(phone) {
  const normalizedPhone = String(phone ?? '').trim();
  const digits = normalizedPhone.replace(/\D/g, '');

  if (!normalizedPhone) return 'Escribe tu teléfono móvil.';
  if (!PHONE_DIGITS_PATTERN.test(normalizedPhone) || digits.length < 10 || digits.length > 15) {
    return 'Escribe un teléfono válido con código de país si aplica.';
  }

  return '';
}

export function validatePassword(password) {
  const value = String(password ?? '');

  if (!value) return 'Escribe tu contraseña.';
  if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/\d/.test(value)) return 'La contraseña debe incluir al menos un número.';
  if (!/[^A-Za-z0-9]/.test(value)) return 'La contraseña debe incluir un símbolo.';

  return '';
}

export function validateLogin({ email, password }) {
  const errors = { email: validateEmail(email) };

  if (!String(password ?? '').trim()) errors.password = 'Escribe tu contraseña.';

  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}

export function validateRegistration({ name, email, phone, password, confirmation }) {
  const errors = {};

  if (!String(name ?? '').trim()) errors.name = 'Este campo es obligatorio.';
  else if (String(name).trim().length < 2) errors.name = 'Escribe al menos 2 caracteres.';

  const emailError = validateEmail(email);
  const phoneError = validatePhone(phone);
  const passwordError = validatePassword(password);

  if (emailError) errors.email = emailError;
  if (phoneError) errors.phone = phoneError;
  if (passwordError) errors.password = passwordError;
  if (!confirmation) errors.confirmation = 'Confirma tu contraseña.';
  else if (password !== confirmation) errors.confirmation = 'Las contraseñas no coinciden.';

  return errors;
}

export function validateRecovery({ email, password, confirmation }) {
  const errors = {};
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);

  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  if (!confirmation) errors.confirmation = 'Confirma tu contraseña.';
  else if (password !== confirmation) errors.confirmation = 'Las contraseñas no coinciden.';

  return errors;
}

export function validateVerificationCode(code) {
  return /^\d{6}$/.test(String(code ?? '').trim())
    ? ''
    : 'Escribe el código completo de 6 dígitos.';
}
