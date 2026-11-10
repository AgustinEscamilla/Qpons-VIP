// Serializa una referencia estable del cupón para que todos los QR de la app coincidan.
export function getCouponQrValue(coupon) {
  if (!coupon) return '';
  return JSON.stringify({
    app: 'QPONS-VIP',
    type: 'coupon',
    documentId: coupon.documentId || String(coupon.id),
    code: coupon.code || '',
  });
}
