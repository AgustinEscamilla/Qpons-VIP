import React from 'react';
import { PanResponder, Pressable, Text, View } from 'react-native';
import { Button, Card, Label } from '../../shared/components/UI.js';
import { businessApi } from '../../services/api/business.service';
import { colors as C } from '../../shared/theme/colors.js';

// Secciones de lectura y componentes pequenos reutilizados por el panel empresarial.
export const BUSINESS_SECTIONS = [
  { key: 'summary', label: 'Resumen', title: 'Resumen del negocio', description: 'Consulta el estado general de tu operación.' },
  { key: 'company', label: 'Perfil público', title: 'Perfil público del negocio', description: 'Edita la información, redes y descripción que verán tus clientes.' },
  { key: 'stores', label: 'Sucursales', title: 'Sucursales', description: 'Revisa las ubicaciones asociadas a tu empresa.' },
  { key: 'coupons', label: 'Cupones', title: 'Cupones', description: 'Consulta las promociones asociadas a tus sucursales.' },
  { key: 'sales', label: 'Ventas', title: 'Ventas y promociones', description: 'Organiza las ofertas que ven tus clientes y administra tu escaparate público.' },
  { key: 'hours', label: 'Horarios', title: 'Horarios de servicio', description: 'Consulta los horarios de atención que están registrados.' },
  { key: 'alerts', label: 'Avisos', title: 'Avisos', description: 'Revisa los avisos activos para tus clientes.' },
];

export function PanelTab({ section, active, onPress, count }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ backgroundColor: active ? C.navy : C.white, borderRadius: 16, paddingHorizontal: 11, paddingVertical: 9, marginRight: 7, marginBottom: 7 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: active ? C.white : C.navy, fontSize: 11, fontWeight: '700' }}>{section.label}</Text>
        {count !== undefined ? <Text style={{ color: active ? C.navy : C.muted, backgroundColor: active ? C.white : C.pale, fontSize: 9, fontWeight: '800', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 5 }}>{count}</Text> : null}
      </View>
    </Pressable>
  );
}

export function SummaryCards({ data }) {
  const counts = {
    Empresas: data.company ? 1 : 0,
    Sucursales: data.stores.length,
    Cupones: data.coupons.length,
    Avisos: data.alerts.length,
  };

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {Object.entries(counts).map(([label, value]) => (
        <Card key={label} style={{ width: '48%', padding: 13, marginBottom: 0 }}>
          <Text style={{ color: C.muted, fontSize: 10 }}>{label}</Text>
          <Label style={{ color: C.pink, fontSize: 22, marginTop: 5 }}>{value}</Label>
          <Text style={{ color: C.muted, fontSize: 9, marginTop: 3 }}>{value ? 'Registrados en tu cuenta' : 'Pendiente de configurar'}</Text>
        </Card>
      ))}
    </View>
  );
}

export function isExpiredOffer(coupon) {
  if (!coupon.expiration) return false;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return String(coupon.expiration).slice(0, 10) < today;
}

export function SalesCenter({ data, onManageOffers, onCustomize }) {
  const activeOffers = data.coupons.filter((coupon) => !isExpiredOffer(coupon));
  const expiredOffers = data.coupons.filter(isExpiredOffer);
  const companyApproved = data.company?.approvalStatus === 'approved';
  return <>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {[
        ['Promociones vigentes', activeOffers.length],
        ['Promociones vencidas', expiredOffers.length],
      ].map(([label, value]) => <Card key={label} style={{ flex: 1, minWidth: 145, padding: 14, marginBottom: 0 }}>
        <Text style={{ color: C.muted, fontSize: 10 }}>{label}</Text>
        <Label style={{ color: C.pink, fontSize: 23, marginTop: 5 }}>{value}</Label>
      </Card>)}
    </View>
    <Card style={{ backgroundColor: '#FFF7E8', borderColor: '#F2D9A6', marginTop: 10 }}>
      <Label style={{ fontSize: 14 }}>Canjes y ventas</Label>
      <Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 5 }}>El QR actual identifica la promoción, pero aún no registra su validación en caja. Por eso no mostramos ingresos ni canjes estimados.</Text>
    </Card>
    {!companyApproved ? <Card style={{ backgroundColor: '#F4F6FB' }}><Text style={{ color: C.navy, fontSize: 12, fontWeight: '700' }}>{data.company?.approvalStatus === 'pending' ? 'Tu negocio está pendiente de aprobación' : 'Completa el registro de tu negocio'}</Text><Text style={{ color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 4 }}>{data.company?.approvalStatus === 'pending' ? 'Puedes preparar tus promociones; se mostrarán al público cuando el equipo apruebe el negocio.' : 'Registra la empresa y una sucursal para empezar a publicar promociones.'}</Text></Card> : null}
    <Card>
      <Label style={{ fontSize: 15 }}>Tu escaparate de promociones</Label>
      <Text style={{ color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 5 }}>Crea ofertas con vigencia e imagen, elige cuál destacar y personaliza el texto que verán en celular y computadora.</Text>
      <Button onPress={onManageOffers}>Administrar promociones ({data.coupons.length})</Button>
      <Button secondary onPress={onCustomize}>Personalizar vista del cliente</Button>
    </Card>
    {data.coupons.map((coupon) => {
      const expired = isExpiredOffer(coupon);
      const status = expired ? 'Vencida · no aparece al cliente' : companyApproved ? 'Vigente · publicada' : 'Vigente · pendiente de aprobación';
      return <Card key={coupon.id} style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <View style={{ flex: 1 }}><Label style={{ fontSize: 13 }}>{coupon.name}</Label><Text style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>{coupon.storeId?.name || 'Sucursal'}</Text></View>
          <Text style={{ color: expired ? C.pink : companyApproved ? C.green : C.muted, fontSize: 9, fontWeight: '700', textAlign: 'right' }}>{status}</Text>
        </View>
      </Card>;
    })}
    {!data.coupons.length ? <Card><Text style={{ color: C.muted, fontSize: 12 }}>Aún no tienes promociones. Crea tu primera oferta para que aparezca en la ficha pública.</Text></Card> : null}
  </>;
}

// Convierte el estado de los datos en una guía concreta para el usuario del negocio.
export function SetupGuide({ data, companyLinked, onOpenSection }) {
  const steps = [
    { key: 'company', title: 'Registra tu empresa', detail: 'Completa los datos comerciales para vincularla a esta cuenta.', done: Boolean(data.company), section: 'company' },
    { key: 'stores', title: 'Revisa tus sucursales', detail: 'Confirma las ubicaciones que verán tus clientes.', done: data.stores.length > 0, section: 'stores' },
    { key: 'coupons', title: 'Prepara tus cupones', detail: 'Consulta las promociones asociadas a tu negocio.', done: data.coupons.length > 0, section: 'coupons' },
    { key: 'hours', title: 'Agrega tus horarios', detail: 'Ayuda a tus clientes a saber cuándo estás abierto.', done: data.serviceHours.length > 0, section: 'hours' },
  ];
  const completedSteps = steps.filter((step) => step.done).length;
  const progress = `${(completedSteps / steps.length) * 100}%`;

  return (
    <Card style={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Label style={{ fontSize: 17 }}>Pon tu negocio en marcha</Label>
          <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{completedSteps} de {steps.length} pasos completados</Text>
        </View>
        <Text style={{ color: C.pink, fontWeight: '800', fontSize: 16 }}>{completedSteps}/{steps.length}</Text>
      </View>
      <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: completedSteps * 25 }} style={{ height: 7, backgroundColor: C.pale, borderRadius: 5, marginTop: 12, marginBottom: 8 }}>
        <View style={{ width: progress, height: 7, backgroundColor: C.pink, borderRadius: 5 }} />
      </View>
      {steps.map((step, index) => (
        <Pressable key={step.key} onPress={() => onOpenSection(step.section)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderTopWidth: index ? 1 : 0, borderTopColor: '#F0F2F8' }}>
          <View style={{ width: 29, height: 29, borderRadius: 15, backgroundColor: step.done ? '#E5F8F0' : C.pale, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <Text style={{ color: step.done ? C.green : C.muted, fontWeight: '800' }}>{step.done ? '✓' : index + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.navy, fontSize: 12, fontWeight: '700' }}>{step.title}</Text>
            <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 2 }}>{step.detail}</Text>
          </View>
          <Text style={{ color: C.pink, fontSize: 18, marginLeft: 8 }}>›</Text>
        </Pressable>
      ))}
      {!companyLinked ? <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 5 }}>Toca el paso “Registra tu empresa” para completar el formulario y empezar.</Text> : null}
    </Card>
  );
}

export function EmptySection({ title, description, onBackToGuide }) {
  return (
    <Card style={{ padding: 17, backgroundColor: C.white }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center', marginBottom: 11 }}>
        <Text style={{ color: C.pink, fontSize: 19, fontWeight: '800' }}>＋</Text>
      </View>
      <Label style={{ fontSize: 16 }}>{title}</Label>
      <Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 6 }}>{description}</Text>
      <Pressable onPress={onBackToGuide} accessibilityRole="button" style={{ alignSelf: 'flex-start', marginTop: 13, paddingVertical: 7 }}>
        <Text style={{ color: C.pink, fontSize: 11, fontWeight: '700' }}>Ver mis pasos de inicio  →</Text>
      </Pressable>
    </Card>
  );
}

export function CompanyApprovalQueue({ token }) {
  const [companies, setCompanies] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState(null);
  const [error, setError] = React.useState('');
  const [feedback, setFeedback] = React.useState('');

  const loadCompanies = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCompanies(await businessApi.pendingCompanies(token));
    } catch (requestError) {
      setError(requestError.message || 'No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    let active = true;
    businessApi.pendingCompanies(token)
      .then((result) => { if (active) setCompanies(result); })
      .catch((requestError) => { if (active) setError(requestError.message || 'No se pudieron cargar las solicitudes.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  async function decide(company, status) {
    setBusyId(company.id);
    setError('');
    setFeedback('');
    try {
      await businessApi.updateCompanyApproval(company.id, status, token);
      setFeedback(status === 'approved' ? `${company.name} fue aprobado y ya puede aparecer en el catálogo.` : `${company.name} fue rechazado.`);
      await loadCompanies();
    } catch (requestError) {
      setError(requestError.message || 'No se pudo actualizar la solicitud.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <Text style={{ color: C.muted, fontSize: 12 }}>Cargando solicitudes de negocios...</Text>;
  return <View>
    {feedback ? <Card style={{ backgroundColor: '#EAF8F2' }}><Text style={{ color: C.green, fontSize: 12, fontWeight: '700' }}>{feedback}</Text></Card> : null}
    {error ? <Card style={{ backgroundColor: '#FFF7F8' }}><Text accessibilityRole="alert" style={{ color: C.pink, fontSize: 12 }}>{error}</Text><Button secondary onPress={loadCompanies}>Reintentar</Button></Card> : null}
    {!error && companies.length === 0 ? <EmptySection title="No hay solicitudes pendientes" description="Cuando un negocio verifique su correo, su solicitud aparecerá aquí para que puedas revisarla." onBackToGuide={loadCompanies} /> : null}
    {companies.map((company) => <Card key={company.id} style={{ padding: 16 }}>
      <Text style={{ color: C.navy, fontSize: 17, fontWeight: '800' }}>{company.name}</Text>
      {company.ownerName ? <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Solicitante: {company.ownerName} · {company.ownerEmail}</Text> : null}
      <Text style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>{company.phone || 'Sin teléfono'} · Solicitud #{company.id}</Text>
      <Text style={{ color: C.navy, fontSize: 12, lineHeight: 18, marginTop: 10 }}>{company.description}</Text>
      <Text style={{ color: C.muted, fontSize: 11, marginTop: 8 }}>Palabras clave: {company.keywords || 'Sin palabras clave'}</Text>
      <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Sucursales registradas: {company.storeCount || 0}</Text>
      {company.website ? <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Sitio web: {company.website}</Text> : null}
      <View style={{ flexDirection: 'row', marginTop: 14, gap: 9 }}>
        <Button onPress={() => decide(company, 'approved')} disabled={busyId !== null} style={{ flex: 1 }}>{busyId === company.id ? 'Guardando...' : 'Aprobar negocio'}</Button>
        <Button secondary onPress={() => decide(company, 'rejected')} disabled={busyId !== null} style={{ flex: 1 }}>Rechazar</Button>
      </View>
    </Card>)}
    <Button secondary onPress={loadCompanies}>Actualizar solicitudes</Button>
  </View>;
}

export function ProfileEditorButton({ label, active, onPress, disabled = false }) {
  return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ selected: active, disabled }} style={{ backgroundColor: active ? C.navy : C.white, borderWidth: 1, borderColor: active ? C.navy : '#E8EDF6', borderRadius: 18, paddingHorizontal: 13, paddingVertical: 10, marginRight: 7, marginBottom: 7, opacity: disabled ? 0.55 : 1 }}><Text style={{ color: active ? C.white : C.navy, fontSize: 11, fontWeight: '700' }}>{label}</Text></Pressable>;
}

export function DragHandle({ index, label, onDrop }) {
  const responder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderRelease: (_event, gesture) => onDrop(index, gesture.dy),
    onPanResponderTerminate: () => {},
  }), [index, onDrop]);
  return <View {...responder.panHandlers} accessible accessibilityLabel={`Arrastra para mover ${label}`} accessibilityHint="Desliza hacia arriba o abajo para cambiar su posición" style={{ width: 34, height: 38, alignItems: 'center', justifyContent: 'center', marginRight: 3 }}><Text style={{ color: C.muted, fontSize: 20, fontWeight: '800' }}>⠿</Text></View>;
}

// Panel privado organizado por función para evitar mezclar operaciones del negocio.
