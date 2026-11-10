import React from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Pressable, Text, View } from 'react-native';
import { Button, Card, Header, Label } from '../../shared/components/UI.js';
import { colors as C } from '../../shared/theme/colors.js';

function findCouponFromQr(value, coupons) {
  const rawValue = String(value || '').trim();
  if (!rawValue) return null;

  let payload;
  try {
    payload = JSON.parse(rawValue);
  } catch {
    return coupons.find((coupon) => String(coupon.code || '').toLowerCase() === rawValue.toLowerCase()) || null;
  }

  if (!payload || payload.app !== 'QPONS-VIP' || payload.type !== 'coupon') return null;
  return coupons.find((coupon) => {
    const idMatches = payload.documentId != null && String(coupon.documentId || coupon.id) === String(payload.documentId);
    const codeMatches = payload.code && String(coupon.code || '').toLowerCase() === String(payload.code).toLowerCase();
    return idMatches || codeMatches;
  }) || null;
}

export function QrScannerScreen({ coupons = [], onBack, onOpenCoupon }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanMessage, setScanMessage] = React.useState('Centra el código QR dentro del recuadro.');
  const [scanLocked, setScanLocked] = React.useState(false);
  const [cameraError, setCameraError] = React.useState('');

  const handleBarcodeScanned = ({ data }) => {
    if (scanLocked) return;
    setScanLocked(true);
    const coupon = findCouponFromQr(data, coupons);
    if (coupon) {
      onOpenCoupon(coupon);
      return;
    }
    setScanMessage('Este QR no corresponde a un cupón disponible de QPONS VIP.');
  };

  return <View>
    <Header title="Escanear código QR" back={onBack} />
    <Card style={{ padding: 16 }}>
      <Label>Encuentra una promoción</Label>
      <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 14 }}>
        Escanea el QR de un cupón QPONS VIP para abrir sus detalles.
      </Text>

      {!permission ? <View style={{ height: 330, borderRadius: 20, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.muted }}>Preparando la cámara…</Text>
      </View> : !permission.granted ? <View style={{ minHeight: 250, borderRadius: 20, backgroundColor: C.pale, padding: 20, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: C.navy, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>Permite el acceso a la cámara</Text>
        <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8 }}>
          QPONS VIP necesita la cámara para leer códigos QR de promociones.
        </Text>
        {permission.canAskAgain ? <Button onPress={requestPermission} style={{ alignSelf: 'stretch' }}>Permitir cámara</Button> : <Text style={{ color: C.pink, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 14 }}>Activa el permiso de cámara para QPONS VIP desde los ajustes de tu dispositivo.</Text>}
      </View> : <View style={{ height: 360, overflow: 'hidden', borderRadius: 20, backgroundColor: C.navy }}>
        {!cameraError ? <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanLocked ? undefined : handleBarcodeScanned}
          onMountError={(event) => setCameraError(event?.message || 'No se pudo iniciar la cámara.')}
        /> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: C.white, fontWeight: '700', textAlign: 'center' }}>{cameraError}</Text>
          <Text style={{ color: '#D4DCEC', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8 }}>Comprueba los permisos de cámara e inténtalo de nuevo.</Text>
        </View>}
        {!cameraError ? <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 218, height: 218, borderColor: C.white, borderWidth: 3, borderRadius: 22, backgroundColor: 'transparent' }} />
        </View> : null}
      </View>}

      <Text accessibilityRole={scanLocked && scanMessage.startsWith('Este QR') ? 'alert' : undefined} style={{ color: scanMessage.startsWith('Este QR') ? C.pink : C.muted, fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 12 }}>
        {scanMessage}
      </Text>
      {scanLocked && permission?.granted ? <Pressable onPress={() => { setScanLocked(false); setScanMessage('Centra el código QR dentro del recuadro.'); }} accessibilityRole="button" style={{ alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 10, marginTop: 4 }}>
        <Text style={{ color: C.navy, fontSize: 12, fontWeight: '700' }}>Escanear otro código</Text>
      </Pressable> : null}
    </Card>
    <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, textAlign: 'center', marginHorizontal: 12 }}>
      El lector abre promociones QPONS VIP. El canje en caja requiere la validación del negocio.
    </Text>
  </View>;
}
