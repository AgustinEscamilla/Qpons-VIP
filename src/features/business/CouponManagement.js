import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import QRCode from 'react-native-qrcode-svg';
import { Button, Card, Field, Label } from '../../shared/components/UI.js';
import { getMediaUrl } from '../../services/api/client.js';
import { getCouponQrValue } from '../coupons/couponQr.js';
import { colors as C } from '../../shared/theme/colors.js';
import { Feedback, ExpirationCalendar, OptionChip, useSubmit } from './BusinessFormHelpers.js';

// Crea y edita promociones; conserva la vigencia, imagen y QR del cupon.
export function CouponManagement({ stores, coupons, onCreate, onUpdate, onUploadImage }) {
  const emptyCoupon = { storeId: null, name: '', description: '', code: '', expiration: '', terms: '', image_1: '', image_2: '', image_3: '', image_4: '', image_5: '', tiktok_video: '', youtube_url_video: '', facebook_url_video: '' };
  const [form, setForm] = React.useState(emptyCoupon);
  const [editingCouponId, setEditingCouponId] = React.useState(null);
  const [validation, setValidation] = React.useState('');
  const [previewUris, setPreviewUris] = React.useState([]);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [imageFeedback, setImageFeedback] = React.useState('');
  const { saving, feedback, submit } = useSubmit((payload) => editingCouponId ? onUpdate(editingCouponId, payload) : onCreate(payload), () => {
    setForm(emptyCoupon);
    setEditingCouponId(null);
    setPreviewUris([]);
    setImageFeedback('');
  });

  async function chooseGalleryImages() {
    setImageFeedback('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return;
      if (result.assets.some((asset) => asset.fileSize && asset.fileSize > 5 * 1024 * 1024)) {
        setImageFeedback('Cada imagen debe pesar máximo 5 MB. Elige imágenes más ligeras.');
        return;
      }

      setUploadingImage(true);
      const fields = ['image_1', 'image_2', 'image_3', 'image_4', 'image_5'];
      const uploadedImages = await Promise.all(result.assets.slice(0, fields.length).map((asset) => onUploadImage(asset)));
      const nextImages = Object.fromEntries(fields.map((field, index) => [field, uploadedImages[index]?.imageUrl || '']));
      setForm((current) => ({ ...current, ...nextImages }));
      setPreviewUris(result.assets.slice(0, fields.length).map((asset) => asset.uri));
      setImageFeedback(`${uploadedImages.length} imagen(es) listas para la galería del negocio.`);
    } catch (error) {
      setImageFeedback(error.message || 'No se pudo subir la imagen.');
    } finally {
      setUploadingImage(false);
    }
  }

  function saveCoupon() {
    if (!form.storeId || form.name.trim().length < 2) { setValidation('Selecciona una sucursal y escribe el nombre de la promoción.'); return; }
    if (form.expiration && !/^\d{4}-\d{2}-\d{2}$/.test(form.expiration)) { setValidation('Usa el formato de fecha AAAA-MM-DD.'); return; }
    if (uploadingImage) { setValidation('Espera a que termine de subir la imagen.'); return; }
    setValidation('');
    submit({ ...form, name: form.name.trim(), description: form.description.trim(), code: form.code.trim(), terms: form.terms.trim(), expiration: editingCouponId ? form.expiration : form.expiration || undefined });
  }

  // Carga en el formulario los datos de la tarjeta para que el negocio los modifique.
  function editCoupon(coupon) {
    setEditingCouponId(coupon.id);
    setValidation('');
    setImageFeedback('');
    setForm({
      storeId: coupon.storeId?.id ?? coupon.storeId,
      name: coupon.name || '',
      description: coupon.description || '',
      code: coupon.code || '',
      expiration: coupon.expiration ? String(coupon.expiration).slice(0, 10) : '',
      terms: coupon.terms || '',
      image_1: coupon.image_1 || '',
      image_2: coupon.image_2 || '',
      image_3: coupon.image_3 || '',
      image_4: coupon.image_4 || '',
      image_5: coupon.image_5 || '',
      tiktok_video: coupon.tiktok_video || '',
      youtube_url_video: coupon.youtube_url_video || '',
      facebook_url_video: coupon.facebook_url_video || '',
    });
    const images = ['image_1', 'image_2', 'image_3', 'image_4', 'image_5'].map((field) => coupon[field]).filter(Boolean);
    setPreviewUris(images.map((image) => getMediaUrl(image)));
  }

  function cancelCouponEdit() {
    setEditingCouponId(null);
    setValidation('');
    setForm(emptyCoupon);
    setPreviewUris([]);
    setImageFeedback('');
  }

  return (
    <View>
      <Card>
        {editingCouponId ? <Label style={{ fontSize: 16 }}>Editar tarjeta de promoción</Label> : null}
        <Text style={{ color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 4 }}>El nombre, la descripción, el código y la imagen se muestran en la tarjeta VIP del catálogo.</Text>
        <Label style={{ fontSize: 16 }}>{editingCouponId ? 'Editar promoción' : 'Crear cupón'}</Label>
        {!stores.length ? <Text style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>Registra una sucursal antes de publicar un cupón.</Text> : <>
          <Label style={{ fontSize: 13, marginTop: 15, marginBottom: 8 }}>Sucursal *</Label>
          {editingCouponId ? <Text style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>{stores.find((store) => Number(store.id) === Number(form.storeId))?.name || 'Sucursal'}</Text> : <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{stores.map((store) => <OptionChip key={store.id} label={store.name} selected={form.storeId === store.id} onPress={() => setForm((current) => ({ ...current, storeId: store.id }))} />)}</View>}
          <Field label="Nombre de la promoción *" value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} placeholder="Ej. 2x1 en bebidas" maxLength={120} />
          <Field label="Descripción" value={form.description} onChangeText={(description) => setForm((current) => ({ ...current, description }))} placeholder="Explica qué incluye la promoción" maxLength={2000} multiline />
          <Field label="Código (opcional)" value={form.code} onChangeText={(code) => setForm((current) => ({ ...current, code }))} placeholder="Se genera automáticamente al publicar" maxLength={80} autoCapitalize="characters" />
          <Text style={{ color: C.muted, fontSize: 10, marginTop: 5 }}>Déjalo vacío y asignaremos un código aleatorio único al cupón.</Text>
          <Label style={{ fontSize: 14, marginTop: 17 }}>Fotos del negocio y la promoción</Label>
          <Text style={{ color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 4 }}>Selecciona hasta 5 imágenes para la ficha pública. Máximo 5 MB por imagen.</Text>
          {previewUris.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 11 }}>{previewUris.map((uri, index) => <Image key={`${uri}-${index}`} source={{ uri }} resizeMode="cover" accessibilityLabel={`Vista previa ${index + 1}`} style={{ width: 150, height: 100, borderRadius: 14, marginRight: 8, backgroundColor: C.pale }} />)}</ScrollView> : null}
          <Button secondary onPress={chooseGalleryImages}>{uploadingImage ? 'Subiendo imágenes…' : previewUris.length ? 'Cambiar galería de fotos' : 'Elegir fotos (hasta 5)'}</Button>
          {previewUris.length ? <Pressable onPress={() => { setPreviewUris([]); setForm((current) => ({ ...current, image_1: '', image_2: '', image_3: '', image_4: '', image_5: '' })); }} accessibilityRole="button" style={{ alignSelf: 'flex-start', paddingVertical: 8 }}><Text style={{ color: C.pink, fontSize: 11, fontWeight: '700' }}>Quitar todas las fotos</Text></Pressable> : null}
          <Feedback message={imageFeedback} error={Boolean(imageFeedback && !form.image_1)} />
          <Label style={{ fontSize: 14, marginTop: 18 }}>Videos (enlaces opcionales)</Label>
          <Text style={{ color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 4 }}>Pega enlaces públicos; aparecerán como botones para abrir el video.</Text>
          <Field label="TikTok / Reels" value={form.tiktok_video} onChangeText={(tiktok_video) => setForm((current) => ({ ...current, tiktok_video }))} placeholder="https://www.tiktok.com/@negocio/video/..." autoCapitalize="none" keyboardType="url" maxLength={500} />
          <Field label="YouTube" value={form.youtube_url_video} onChangeText={(youtube_url_video) => setForm((current) => ({ ...current, youtube_url_video }))} placeholder="https://youtu.be/..." autoCapitalize="none" keyboardType="url" maxLength={500} />
          <Field label="Facebook video" value={form.facebook_url_video} onChangeText={(facebook_url_video) => setForm((current) => ({ ...current, facebook_url_video }))} placeholder="https://www.facebook.com/..." autoCapitalize="none" keyboardType="url" maxLength={500} />
          <ExpirationCalendar value={form.expiration} onChange={(expiration) => setForm((current) => ({ ...current, expiration }))} />
          {editingCouponId ? <Button secondary onPress={cancelCouponEdit}>Cancelar edición</Button> : null}
          <Field label="Términos (opcional)" value={form.terms} onChangeText={(terms) => setForm((current) => ({ ...current, terms }))} placeholder="Restricciones de uso" maxLength={2000} multiline />
          <Feedback message={validation || feedback.message} error={Boolean(validation) || feedback.error} />
          <Button onPress={saveCoupon}>{saving ? editingCouponId ? 'Guardando cambios…' : 'Publicando cupón…' : editingCouponId ? 'Guardar cambios del cupón' : 'Publicar cupón'}</Button>
        </>}
      </Card>
      <Label style={{ fontSize: 16, marginBottom: 8 }}>Promociones ({coupons.length})</Label>
      {!coupons.length ? <Card><Text style={{ color: C.muted, fontSize: 12 }}>Cuando publiques cupones desde una sucursal, aparecerán en esta lista.</Text></Card> : coupons.map((coupon) => (
        <Card key={coupon.id} style={{ padding: 15 }}>
          <Label style={{ fontSize: 14 }}>{coupon.name}</Label>
          <Pressable onPress={() => editCoupon(coupon)} accessibilityRole="button" style={{ alignSelf: 'flex-start', paddingVertical: 7 }}><Text style={{ color: C.pink, fontSize: 11, fontWeight: '700' }}>Editar tarjeta que ve el cliente</Text></Pressable>
          {coupon.image_1 ? <Image source={{ uri: getMediaUrl(coupon.image_1) }} resizeMode="cover" accessibilityLabel={`Imagen de ${coupon.name}`} style={{ width: '100%', height: 150, borderRadius: 14, marginTop: 9, backgroundColor: C.pale }} /> : null}
          {coupon.description ? <Text style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>{coupon.description}</Text> : null}
          <Text style={{ color: C.pink, fontSize: 11, fontWeight: '700', marginTop: 7 }}>{coupon.storeId?.name || 'Sucursal'}{coupon.code ? ` · Código ${coupon.code}` : ''}</Text>
          {coupon.expiration ? <Text style={{ color: C.muted, fontSize: 10, marginTop: 3 }}>Vence: {new Date(coupon.expiration).toLocaleDateString()}</Text> : null}
          <View style={{ borderTopWidth: 1, borderTopColor: '#F0F2F8', marginTop: 13, paddingTop: 13, alignItems: 'center' }}>
            <Label style={{ fontSize: 13, alignSelf: 'flex-start' }}>QR de este cupón</Label>
            <View accessibilityLabel={`Código QR para ${coupon.name}`} style={{ padding: 10, backgroundColor: C.white, borderRadius: 12, marginTop: 10 }}>
              <QRCode
                value={getCouponQrValue(coupon)}
                size={170}
                color={C.navy}
                backgroundColor={C.white}
                quietZone={8}
              />
            </View>
            <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 9 }}>Identifica esta promoción. El canje automático requiere un lector conectado al sistema.</Text>
          </View>
        </Card>
      ))}
    </View>
  );
}
