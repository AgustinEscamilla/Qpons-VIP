import React from 'react';
import { Image, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button, Card, Field, Header, Label } from '../../shared/components/UI.js';
import { CompanyForm } from './CompanyForm.js';
import { BusinessProfileView } from './BusinessProfileView.js';
import { AlertsManagement, CouponManagement, HoursManagement, StoreManagement } from './BusinessOperations.js';
import { businessApi } from '../../services/api/business.service';
import { getMediaUrl } from '../../services/api/client.js';
import { createDefaultPublicProfileLayout, normalizePublicProfileLayout, PUBLIC_PROFILE_BLOCKS, PUBLIC_PROFILE_THEMES } from './publicProfileLayout.js';
import { colors as C } from '../../shared/theme/colors.js';
import { BUSINESS_SECTIONS, CompanyApprovalQueue, DragHandle, EmptySection, isExpiredOffer, PanelTab, ProfileEditorButton, SalesCenter, SetupGuide, SummaryCards } from './BusinessPanelSections.js';

// Coordina datos, permisos y secciones; los subcomponentes presentan cada area.
export function BusinessPanel({ session, onBack, onLogout }) {
  const isAdmin = session.user.role === 'admin';
  const approvalSection = { key: 'approvals', label: 'Aprobaciones', title: 'Solicitudes de negocios', description: 'Revisa y decide qué negocios pueden publicarse en el catálogo.' };
  const availableSections = isAdmin ? [approvalSection] : BUSINESS_SECTIONS;
  const [activeSection, setActiveSection] = React.useState(isAdmin ? 'approvals' : 'summary');
  const [profileEditor, setProfileEditor] = React.useState('preview');
  const [previewMode, setPreviewMode] = React.useState(Platform.OS === 'web' ? 'desktop' : 'mobile');
  const [data, setData] = React.useState({ company: null, stores: [], coupons: [], serviceHours: [], alerts: [] });
  const [layoutDraft, setLayoutDraft] = React.useState(null);
  const [savingLayout, setSavingLayout] = React.useState(false);
  const [uploadingProfileImage, setUploadingProfileImage] = React.useState(false);
  const [layoutFeedback, setLayoutFeedback] = React.useState('');
  const blockLayoutRef = React.useRef({});
  const previewCanvasLayoutsRef = React.useRef({});
  const [selectedPreviewBlock, setSelectedPreviewBlock] = React.useState('hero');
  const [showBlockPicker, setShowBlockPicker] = React.useState(false);
  const [loading, setLoading] = React.useState(!isAdmin);
  const [error, setError] = React.useState(null);
  const selectedSection = availableSections.find((section) => section.key === activeSection) ?? availableSections[0];
  const companyLinked = Boolean(session.user.companyId || data.company);

  const loadOverview = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setData(await businessApi.overview(session.accessToken));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [session.accessToken]);

  const createCompany = React.useCallback(async (payload) => {
    const company = await businessApi.createCompany(payload, session.accessToken);
    setData((current) => ({ ...current, company }));
    setActiveSection('company');
    await loadOverview();
  }, [loadOverview, session.accessToken]);

  const updateCompany = React.useCallback(async (payload) => {
    await businessApi.updateCompany(payload, session.accessToken);
    await loadOverview();
  }, [loadOverview, session.accessToken]);

  // Cada alta guarda en PostgreSQL y vuelve a consultar el panel para actualizar contadores.
  const createStore = React.useCallback(async (payload) => {
    await businessApi.createStore(payload, session.accessToken);
    await loadOverview();
  }, [loadOverview, session.accessToken]);

  const updateStore = React.useCallback(async (storeId, payload) => {
    await businessApi.updateStore(storeId, payload, session.accessToken);
    await loadOverview();
  }, [loadOverview, session.accessToken]);

  const saveWeeklySchedule = React.useCallback(async (payload) => {
    await businessApi.saveWeeklySchedule(payload, session.accessToken);
    await loadOverview();
  }, [loadOverview, session.accessToken]);

  const createCoupon = React.useCallback(async (payload) => {
    await businessApi.createCoupon(payload, session.accessToken);
    await loadOverview();
  }, [loadOverview, session.accessToken]);

  const updateCoupon = React.useCallback(async (couponId, payload) => {
    await businessApi.updateCoupon(couponId, payload, session.accessToken);
    await loadOverview();
  }, [loadOverview, session.accessToken]);

  const uploadCouponImage = React.useCallback((asset) => {
    return businessApi.uploadCouponImage(asset, session.accessToken);
  }, [session.accessToken]);

  React.useEffect(() => {
    let active = true;

    if (isAdmin) return () => { active = false; };

    businessApi.overview(session.accessToken)
      .then((result) => {
        if (active) {
          setData(result);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAdmin, session.accessToken]);

  function renderSection() {
    if (loading) return <Text style={{ color: C.muted, fontSize: 12 }}>Cargando información protegida...</Text>;
    if (error) return <Card style={{ backgroundColor: '#FFF7F8' }}><Text style={{ color: C.pink, fontSize: 12 }}>{error}</Text><Button secondary onPress={loadOverview}>Reintentar</Button></Card>;
    if (activeSection === 'approvals' && isAdmin) return <CompanyApprovalQueue token={session.accessToken} />;
    if (activeSection === 'sales') return data.company ? <SalesCenter data={data} onManageOffers={() => setActiveSection('coupons')} onCustomize={() => { setProfileEditor('sales'); setActiveSection('company'); }} /> : <EmptySection title="Primero registra tu empresa" description="Vincula una empresa y una sucursal para poder configurar las promociones que verán tus clientes." onBackToGuide={() => { setProfileEditor('company'); setActiveSection('company'); }} />;
    if (activeSection === 'summary') return <><SummaryCards data={data} /><Pressable onPress={() => { setProfileEditor('preview'); setActiveSection('company'); }} accessibilityRole="button" style={{ backgroundColor: C.navy, borderRadius: 20, padding: 17, marginTop: 12, marginBottom: 14 }}><Text style={{ color: C.white, fontSize: 15, fontWeight: '800' }}>Personaliza tu perfil público  →</Text><Text style={{ color: '#CFD9EA', fontSize: 11, lineHeight: 17, marginTop: 5 }}>Previsualiza cómo aparece tu negocio y edita fotos, promociones, horarios y redes desde un solo lugar.</Text></Pressable><SetupGuide data={data} companyLinked={companyLinked} onOpenSection={(section) => { setProfileEditor(section === 'company' ? 'company' : 'preview'); setActiveSection(section); }} /></>;
    if (activeSection === 'company') {
      if (!data.company && session.user.role !== 'business') return <EmptySection title="Aún no hay una empresa vinculada" description="Esta cuenta todavía no tiene una empresa asociada." onBackToGuide={() => setActiveSection('summary')} />;
      const profileEditors = [
        ['preview', 'Vista previa'],
        ['design', 'Diseño y bloques'],
        ['sales', 'Ventas y promociones'],
        ['content', 'Contenido de bloques'],
        ['company', 'Información y redes'],
        ['stores', 'Sucursales'],
        ['coupons', 'Fotos, videos y cupones'],
        ['hours', 'Horarios'],
      ];
      const previewStores = data.stores.map((store) => ({ ...store, companyId: data.company }));
      const selectedPreviewStore = previewStores[0];
      const savedLayout = normalizePublicProfileLayout(data.company?.publicProfileLayout);
      const currentLayout = layoutDraft || savedLayout;
      const saveLayout = async () => {
        setSavingLayout(true);
        setLayoutFeedback('');
        try {
          const result = await businessApi.savePublicProfileLayout(currentLayout, session.accessToken);
          const savedCompany = result?.company || result;
          setData((current) => ({ ...current, company: { ...current.company, ...savedCompany } }));
          setLayoutDraft(null);
          setLayoutFeedback('Cambios guardados. Ya se reflejan en el perfil público.');
        } catch (saveError) {
          setLayoutFeedback(saveError.message || 'No se pudo guardar el diseño.');
        } finally {
          setSavingLayout(false);
        }
      };
      const updateLayoutContent = (key, value) => setLayoutDraft((current) => {
        const base = current || savedLayout;
        return { ...base, content: { ...base.content, [key]: value } };
      });
      const chooseProfileImage = async () => {
        if (uploadingProfileImage) return;
        setUploadingProfileImage(true);
        setLayoutFeedback('');
        try {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.82,
          });
          const asset = result.assets?.[0];
          if (result.canceled || !asset) return;
          if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
            setLayoutFeedback('La imagen debe pesar máximo 5 MB. Elige una imagen más ligera.');
            return;
          }
          const uploaded = await uploadCouponImage(asset);
          updateLayoutContent('imageUrl', uploaded.imageUrl || '');
          setLayoutFeedback('Imagen cargada. Guarda el contenido para publicarla.');
        } catch (uploadError) {
          setLayoutFeedback(uploadError.message || 'No se pudo cargar la imagen.');
        } finally {
          setUploadingProfileImage(false);
        }
      };
      const moveBlock = (index, direction) => setLayoutDraft((current) => {
        const next = [...(current || savedLayout).blocks];
        const target = index + direction;
        if (target < 0 || target >= next.length) return current || savedLayout;
        [next[index], next[target]] = [next[target], next[index]];
        return { ...(current || savedLayout), blocks: next };
      });
      const dropBlock = (fromIndex, deltaY) => {
        const measurements = currentLayout.blocks.map((block, index) => ({ block, index, ...blockLayoutRef.current[block.id] })).filter((item) => Number.isFinite(item.y));
        const source = measurements.find((item) => item.index === fromIndex);
        if (!source || Math.abs(deltaY) < 12) return;
        const draggedCenter = source.y + source.height / 2 + deltaY;
        const destination = measurements.reduce((closest, item) => Math.abs(item.y + item.height / 2 - draggedCenter) < Math.abs(closest.y + closest.height / 2 - draggedCenter) ? item : closest, measurements[0]);
        if (!destination || destination.index === fromIndex) return;
        setLayoutDraft((current) => {
          const next = [...(current || savedLayout).blocks];
          const [dragged] = next.splice(fromIndex, 1);
          const insertionIndex = destination.index > fromIndex ? destination.index - 1 : destination.index;
          next.splice(insertionIndex, 0, dragged);
          return { ...(current || savedLayout), blocks: next };
        });
      };
      const dropCanvasBlock = (blockId, deltaX, deltaY) => {
        const source = previewCanvasLayoutsRef.current[blockId];
        if (!source || Math.hypot(deltaX, deltaY) < 18) return;
        const sourceCenter = { x: source.x + source.width / 2 + deltaX, y: source.y + source.height / 2 + deltaY };
        const target = currentLayout.blocks.map((block, index) => ({ block, index, layout: previewCanvasLayoutsRef.current[block.id] }))
          .filter((item) => item.block.visible && item.layout)
          .reduce((closest, item) => {
            const center = { x: item.layout.x + item.layout.width / 2, y: item.layout.y + item.layout.height / 2 };
            const distance = Math.hypot(center.x - sourceCenter.x, center.y - sourceCenter.y);
            return distance < closest.distance ? { index: item.index, distance } : closest;
          }, { index: -1, distance: Infinity });
        const fromIndex = currentLayout.blocks.findIndex((item) => item.id === blockId);
        if (fromIndex < 0 || target.index < 0 || fromIndex === target.index) return;
        setLayoutDraft((current) => {
          const next = [...(current || savedLayout).blocks];
          const [dragged] = next.splice(fromIndex, 1);
          const insertionIndex = target.index > fromIndex ? target.index - 1 : target.index;
          next.splice(insertionIndex, 0, dragged);
          return { ...(current || savedLayout), blocks: next };
        });
        setSelectedPreviewBlock(blockId);
      };
      const replaceSelectedBlock = (replacementId) => {
        const next = [...currentLayout.blocks];
        const selectedIndex = next.findIndex((block) => block.id === selectedPreviewBlock);
        const replacementIndex = next.findIndex((block) => block.id === replacementId);
        if (selectedIndex < 0 || replacementIndex < 0 || selectedIndex === replacementIndex) return;
        const selected = next[selectedIndex];
        const replacement = next[replacementIndex];
        next[selectedIndex] = { ...replacement, visible: selected.visible };
        next[replacementIndex] = { ...selected, visible: replacement.visible };
        setLayoutDraft({ ...currentLayout, blocks: next });
        setSelectedPreviewBlock(replacementId);
        setShowBlockPicker(false);
      };
      const selectedBlockDefinition = PUBLIC_PROFILE_BLOCKS.find((block) => block.id === selectedPreviewBlock);
      const editSectionByBlock = { hero: 'stores', contact: 'company', location: 'stores', carousel: 'coupons', promotions: 'coupons', text: 'content', image: 'content', gallery: 'coupons', videos: 'content', highlights: 'content', hours: 'hours', branches: 'stores', terms: 'coupons' };
      const editor = profileEditors.find(([key]) => key === profileEditor)?.[1] || 'Vista previa';
      return <>
        <Card style={{ padding: 16, backgroundColor: '#F9FAFF' }}><Label style={{ fontSize: 16 }}>Así verán tu negocio los clientes</Label><Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 5 }}>Puedes cambiar entre celular y computadora. Usa las opciones de abajo para editar cada parte de esta ficha.</Text></Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>{profileEditors.map(([key, label]) => <ProfileEditorButton key={key} label={label} active={profileEditor === key} onPress={() => setProfileEditor(key)} />)}</View>
        {profileEditor === 'preview' ? <>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}><ProfileEditorButton label="Vista celular" active={previewMode === 'mobile'} onPress={() => setPreviewMode('mobile')} /><ProfileEditorButton label="Vista computadora" active={previewMode === 'desktop'} onPress={() => setPreviewMode('desktop')} /></View>
          {!selectedPreviewStore ? <EmptySection title="Agrega una sucursal para ver tu ficha" description="La vista pública se organiza alrededor de la ubicación del negocio. Registra tu primera sucursal para previsualizarla aquí." onBackToGuide={() => setProfileEditor('stores')} /> : <ScrollView horizontal={previewMode === 'desktop' && Platform.OS !== 'web'} showsHorizontalScrollIndicator contentContainerStyle={{ justifyContent: 'center', width: '100%' }}><View style={{ width: previewMode === 'desktop' && Platform.OS !== 'web' ? 820 : '100%', maxWidth: previewMode === 'mobile' ? 390 : 960, alignSelf: 'center', backgroundColor: C.bg, borderRadius: 22, borderWidth: 1, borderColor: '#E6EAF2', paddingHorizontal: previewMode === 'mobile' ? 10 : 16, paddingVertical: 12 }}><Text style={{ color: C.muted, fontSize: 10, marginBottom: 8, textAlign: 'center' }}>VISTA PREVIA · {previewMode === 'mobile' ? 'CELULAR' : 'COMPUTADORA'}</Text><BusinessProfileView store={selectedPreviewStore} stores={previewStores} coupons={data.coupons} serviceHours={data.serviceHours} layout={currentLayout} desktop={previewMode === 'desktop'} previewOnly /></View></ScrollView>}
        </> : <>
          <Pressable onPress={() => setProfileEditor('preview')} accessibilityRole="button" style={{ alignSelf: 'flex-start', paddingVertical: 8, marginBottom: 5 }}><Text style={{ color: C.pink, fontSize: 11, fontWeight: '700' }}>‹ Regresar a vista previa</Text></Pressable>
          {profileEditor === 'company' ? data.company ? <CompanyForm initialCompany={data.company} onSubmit={updateCompany} /> : <CompanyForm onSubmit={createCompany} /> : null}
          {profileEditor === 'stores' ? data.company ? <StoreManagement stores={data.stores} onCreate={createStore} onUpdate={updateStore} /> : <EmptySection title="Primero registra tu empresa" description="Vincula la empresa antes de administrar sucursales." onBackToGuide={() => setProfileEditor('company')} /> : null}
          {profileEditor === 'coupons' ? data.company ? <CouponManagement stores={data.stores} coupons={data.coupons} onCreate={createCoupon} onUpdate={updateCoupon} onUploadImage={uploadCouponImage} /> : <EmptySection title="Primero registra tu empresa" description="Vincula la empresa antes de publicar promociones y contenido." onBackToGuide={() => setProfileEditor('company')} /> : null}
          {profileEditor === 'hours' ? data.company ? <HoursManagement stores={data.stores} hours={data.serviceHours} onSave={saveWeeklySchedule} /> : <EmptySection title="Primero registra tu empresa" description="Vincula la empresa antes de configurar horarios." onBackToGuide={() => setProfileEditor('company')} /> : null}
          {profileEditor === 'sales' ? <>
            <Card style={{ padding: 16 }}>
              <Label style={{ fontSize: 16 }}>Personaliza el escaparate de ventas</Label>
              <Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 5 }}>Estos textos y la oferta destacada se guardan en el perfil público y se reflejan en celular y computadora.</Text>
              <Field label="Título de la sección" value={currentLayout.sales.title} onChangeText={(title) => setLayoutDraft({ ...currentLayout, sales: { ...currentLayout.sales, title } })} placeholder="Promociones VIP" maxLength={60} />
              <Field label="Texto para tus clientes" value={currentLayout.sales.description} onChangeText={(description) => setLayoutDraft({ ...currentLayout, sales: { ...currentLayout.sales, description } })} placeholder="Describe brevemente tus ofertas" maxLength={180} multiline />
              <Field label="Texto del botón" value={currentLayout.sales.buttonLabel} onChangeText={(buttonLabel) => setLayoutDraft({ ...currentLayout, sales: { ...currentLayout.sales, buttonLabel } })} placeholder="Obtener cupón VIP" maxLength={30} />
              <Label style={{ fontSize: 14, marginTop: 17, marginBottom: 7 }}>Oferta destacada</Label>
              <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginBottom: 8 }}>Aparecerá primero en la ficha del cliente. La promoción debe estar vigente.</Text>
              <ProfileEditorButton label="Sin oferta destacada" active={!currentLayout.sales.featuredCouponId} onPress={() => setLayoutDraft({ ...currentLayout, sales: { ...currentLayout.sales, featuredCouponId: null } })} />
              {data.coupons.filter((coupon) => !isExpiredOffer(coupon)).map((coupon) => <ProfileEditorButton key={coupon.id} label={`${coupon.name} · ${coupon.storeId?.name || 'Sucursal'}`} active={Number(currentLayout.sales.featuredCouponId) === Number(coupon.id)} onPress={() => setLayoutDraft({ ...currentLayout, sales: { ...currentLayout.sales, featuredCouponId: Number(coupon.id) } })} />)}
              {!data.coupons.some((coupon) => !isExpiredOffer(coupon)) ? <Text style={{ color: C.muted, fontSize: 11 }}>Publica una promoción con vigencia actual para poder destacarla.</Text> : null}
              <Pressable accessibilityRole="button" disabled={savingLayout} onPress={saveLayout} style={{ backgroundColor: C.navy, borderRadius: 24, paddingVertical: 14, alignItems: 'center', marginTop: 13, opacity: savingLayout ? 0.65 : 1 }}><Text style={{ color: C.white, fontSize: 13, fontWeight: '800' }}>{savingLayout ? 'Guardando…' : 'Guardar escaparate de ventas'}</Text></Pressable>
              {layoutFeedback ? <Text accessibilityLiveRegion="polite" style={{ color: layoutFeedback.includes('no se pudo') ? C.pink : C.green, fontSize: 11, marginTop: 8 }}>{layoutFeedback}</Text> : null}
            </Card>
            <Card style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <View style={{ flex: 1, minWidth: 160, marginRight: 8 }}><Label style={{ fontSize: 16 }}>Vista previa del cliente</Label><Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 4 }}>Los cambios se reflejan aquí antes de guardarlos.</Text></View>
                <View style={{ flexDirection: 'row', marginTop: 6 }}><ProfileEditorButton label="Celular" active={previewMode === 'mobile'} onPress={() => setPreviewMode('mobile')} /><ProfileEditorButton label="Computadora" active={previewMode === 'desktop'} onPress={() => setPreviewMode('desktop')} /></View>
              </View>
              {!selectedPreviewStore ? <EmptySection title="Agrega una sucursal para previsualizar" description="Registra una ubicación para que los clientes puedan consultar tus promociones." onBackToGuide={() => setProfileEditor('stores')} /> : <ScrollView horizontal={previewMode === 'desktop'} showsHorizontalScrollIndicator={previewMode === 'desktop'} contentContainerStyle={{ justifyContent: previewMode === 'desktop' ? 'flex-start' : 'center', width: previewMode === 'desktop' ? undefined : '100%' }}><View style={{ width: previewMode === 'desktop' ? 900 : '100%', maxWidth: previewMode === 'mobile' ? 390 : 900, alignSelf: 'center', backgroundColor: C.bg, borderRadius: 18, borderWidth: 1, borderColor: '#E6EAF2', padding: 10, marginTop: 9 }}><BusinessProfileView store={selectedPreviewStore} stores={previewStores} coupons={data.coupons} serviceHours={data.serviceHours} layout={currentLayout} desktop={previewMode === 'desktop'} previewOnly /></View></ScrollView>}
            </Card>
          </> : null}
          {profileEditor === 'content' ? <>
            <Card style={{ padding: 16 }}>
              <Label style={{ fontSize: 16 }}>Contenido promocional</Label>
              <Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 5 }}>Crea un mensaje, imagen, video y lista de beneficios. El carrusel toma automáticamente las promociones activas de tus sucursales.</Text>
              <Field label="Texto para tus clientes" value={currentLayout.content.text} onChangeText={(value) => updateLayoutContent('text', value)} placeholder="Cuenta qué hace especial a tu negocio o presenta una campaña" maxLength={2000} multiline />
              <Label style={{ fontSize: 14, marginTop: 17 }}>Imagen promocional</Label>
              <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 4 }}>También aparece en tu tarjeta de negocio en Inicio; si no subes una, se usará la imagen de uno de tus cupones.</Text>
              <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 4 }}>Sube un banner horizontal. Máximo 5 MB.</Text>
              {currentLayout.content.imageUrl ? <Image source={{ uri: getMediaUrl(currentLayout.content.imageUrl) }} resizeMode="cover" accessibilityLabel={currentLayout.content.imageAlt} style={{ width: '100%', height: 170, borderRadius: 15, marginTop: 10, backgroundColor: C.pale }} /> : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 3 }}>
                <ProfileEditorButton label={uploadingProfileImage ? 'Cargando imagen…' : 'Subir o cambiar imagen'} active={false} disabled={uploadingProfileImage} onPress={chooseProfileImage} />
                {currentLayout.content.imageUrl ? <ProfileEditorButton label="Quitar imagen" active={false} onPress={() => updateLayoutContent('imageUrl', '')} /> : null}
              </View>
              <Field label="Descripción accesible de la imagen" value={currentLayout.content.imageAlt} onChangeText={(value) => updateLayoutContent('imageAlt', value)} placeholder="Platillo especial de la casa" maxLength={120} />
              <Field label="Título del video" value={currentLayout.content.videoTitle} onChangeText={(value) => updateLayoutContent('videoTitle', value)} placeholder="Conoce nuestro negocio" maxLength={100} />
              <Field label="Enlace del video" value={currentLayout.content.videoUrl} onChangeText={(value) => updateLayoutContent('videoUrl', value)} placeholder="https://youtube.com/... o https://tiktok.com/..." keyboardType="url" autoCapitalize="none" maxLength={500} />
              <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 5 }}>El cliente podrá abrir el video en YouTube, TikTok u otra plataforma. También puedes agregar enlaces en cada cupón.</Text>
              <Field label="Servicios y beneficios (uno por línea, máximo 6)" value={currentLayout.content.highlights} onChangeText={(value) => updateLayoutContent('highlights', value)} placeholder={'Terraza al aire libre\nEstacionamiento gratuito\nReservaciones por WhatsApp'} maxLength={600} multiline />
              <Label style={{ fontSize: 14, marginTop: 17, marginBottom: 7 }}>Bloques que quieres mostrar</Label>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{['carousel', 'text', 'image', 'videos', 'highlights'].map((id) => {
                const block = currentLayout.blocks.find((item) => item.id === id);
                const definition = PUBLIC_PROFILE_BLOCKS.find((item) => item.id === id);
                return <ProfileEditorButton key={id} label={`${block?.visible ? '✓' : '+'} ${definition?.label}`} active={Boolean(block?.visible)} onPress={() => setLayoutDraft({ ...currentLayout, blocks: currentLayout.blocks.map((item) => item.id === id ? { ...item, visible: !item.visible } : item) })} />;
              })}</View>
              <Pressable accessibilityRole="button" disabled={savingLayout || uploadingProfileImage} onPress={saveLayout} style={{ backgroundColor: C.navy, borderRadius: 24, paddingVertical: 14, alignItems: 'center', marginTop: 12, opacity: savingLayout || uploadingProfileImage ? 0.65 : 1 }}><Text style={{ color: C.white, fontSize: 13, fontWeight: '800' }}>{uploadingProfileImage ? 'Subiendo imagen…' : savingLayout ? 'Guardando…' : 'Guardar contenido'}</Text></Pressable>
              {layoutFeedback ? <Text accessibilityLiveRegion="polite" style={{ color: layoutFeedback.toLowerCase().includes('no se pudo') ? C.pink : C.green, fontSize: 11, marginTop: 8 }}>{layoutFeedback}</Text> : null}
            </Card>
            <Card style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <View style={{ flex: 1, minWidth: 160, marginRight: 8 }}><Label style={{ fontSize: 16 }}>Vista previa mientras editas</Label><Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 4 }}>Los cambios se muestran aquí antes de guardarlos.</Text></View>
                <View style={{ flexDirection: 'row', marginTop: 6 }}><ProfileEditorButton label="Celular" active={previewMode === 'mobile'} onPress={() => setPreviewMode('mobile')} /><ProfileEditorButton label="Computadora" active={previewMode === 'desktop'} onPress={() => setPreviewMode('desktop')} /></View>
              </View>
              {!selectedPreviewStore ? <EmptySection title="Agrega una sucursal para previsualizar" description="Registra una ubicación y agrega promociones para ver los bloques en tu ficha." onBackToGuide={() => setProfileEditor('stores')} /> : <ScrollView horizontal={previewMode === 'desktop'} showsHorizontalScrollIndicator={previewMode === 'desktop'} contentContainerStyle={{ justifyContent: previewMode === 'desktop' ? 'flex-start' : 'center', width: previewMode === 'desktop' ? undefined : '100%' }}><View style={{ width: previewMode === 'desktop' ? 900 : '100%', maxWidth: previewMode === 'mobile' ? 390 : 900, alignSelf: 'center', backgroundColor: C.bg, borderRadius: 18, borderWidth: 1, borderColor: '#E6EAF2', padding: 10, marginTop: 9 }}><BusinessProfileView store={selectedPreviewStore} stores={previewStores} coupons={data.coupons} serviceHours={data.serviceHours} layout={currentLayout} desktop={previewMode === 'desktop'} previewOnly /></View></ScrollView>}
            </Card>
          </> : null}
          {profileEditor === 'design' ? <>
            <Card style={{ padding: 16 }}>
              <Label style={{ fontSize: 16 }}>Elige el estilo de tu ficha</Label>
              <Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 5 }}>Estos cambios afectan la vista del negocio en celular y computadora.</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>{PUBLIC_PROFILE_THEMES.map((theme) => <ProfileEditorButton key={theme.id} label={theme.label} active={currentLayout.theme === theme.id} onPress={() => setLayoutDraft({ ...currentLayout, theme: theme.id })} />)}</View>
            </Card>
            <Card style={{ padding: 16 }}>
              <Label style={{ fontSize: 16 }}>Bloques de contenido</Label>
              <Text style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>QPONS define los bloques disponibles. Puedes ordenarlos, ocultarlos o editar su contenido desde las secciones del panel.</Text>
              {currentLayout.blocks.map((block, index) => {
                const definition = PUBLIC_PROFILE_BLOCKS.find((item) => item.id === block.id);
                return <View key={block.id} onLayout={(event) => { blockLayoutRef.current[block.id] = { y: event.nativeEvent.layout.y, height: event.nativeEvent.layout.height }; }} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: index === currentLayout.blocks.length - 1 ? 0 : 1, borderBottomColor: '#EDF0F6' }}>
                  <DragHandle index={index} label={definition?.label} onDrop={dropBlock} />
                  <View style={{ flex: 1, marginRight: 8 }}><Text style={{ color: C.navy, fontSize: 12, fontWeight: '700' }}>{definition?.label}</Text><Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 3 }}>{definition?.description}</Text></View>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Subir ${definition?.label}`} disabled={index === 0} onPress={() => moveBlock(index, -1)} style={{ padding: 8, opacity: index === 0 ? 0.35 : 1 }}><Text style={{ color: C.navy, fontSize: 17 }}>↑</Text></Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Bajar ${definition?.label}`} disabled={index === currentLayout.blocks.length - 1} onPress={() => moveBlock(index, 1)} style={{ padding: 8, opacity: index === currentLayout.blocks.length - 1 ? 0.35 : 1 }}><Text style={{ color: C.navy, fontSize: 17 }}>↓</Text></Pressable>
                  <Pressable accessibilityRole="switch" accessibilityState={{ checked: block.visible, disabled: block.id === 'hero' }} disabled={block.id === 'hero'} onPress={() => setLayoutDraft({ ...currentLayout, blocks: currentLayout.blocks.map((item) => item.id === block.id ? { ...item, visible: !item.visible } : item) })} style={{ minWidth: 54, alignItems: 'center', backgroundColor: block.visible ? C.navy : '#E5E9F1', borderRadius: 16, paddingHorizontal: 9, paddingVertical: 7, opacity: block.id === 'hero' ? 0.7 : 1 }}><Text style={{ color: block.visible ? C.white : C.navy, fontSize: 9, fontWeight: '800' }}>{block.visible ? 'VISIBLE' : 'OCULTO'}</Text></Pressable>
                </View>;
              })}
              <Pressable accessibilityRole="button" disabled={savingLayout} onPress={saveLayout} style={{ backgroundColor: C.navy, borderRadius: 24, paddingVertical: 14, alignItems: 'center', marginTop: 12, opacity: savingLayout ? 0.65 : 1 }}><Text style={{ color: C.white, fontSize: 13, fontWeight: '800' }}>{savingLayout ? 'Guardando diseño…' : 'Guardar diseño'}</Text></Pressable>
              <Button secondary onPress={() => { setLayoutDraft(createDefaultPublicProfileLayout()); setLayoutFeedback('Diseño predeterminado listo. Guarda para publicarlo.'); }}>Restablecer bloques</Button>
              {layoutFeedback ? <Text accessibilityLiveRegion="polite" style={{ color: layoutFeedback.includes('no se pudo') ? C.pink : C.green, fontSize: 11, marginTop: 8 }}>{layoutFeedback}</Text> : null}
            </Card>
            <Card style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <View style={{ flex: 1, minWidth: 160, marginRight: 8 }}>
                  <Label style={{ fontSize: 16 }}>Vista previa en vivo</Label>
                  <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 4 }}>Se actualiza al instante mientras cambias el tema, los bloques o su orden.</Text>
                </View>
                <View style={{ flexDirection: 'row', marginTop: 6 }}>
                  <ProfileEditorButton label="Celular" active={previewMode === 'mobile'} onPress={() => setPreviewMode('mobile')} />
                  <ProfileEditorButton label="Computadora" active={previewMode === 'desktop'} onPress={() => setPreviewMode('desktop')} />
                </View>
              </View>
              {!selectedPreviewStore ? <EmptySection title="Agrega una sucursal para ver la vista previa" description="Primero registra una ubicación para visualizar cómo quedará la ficha pública." onBackToGuide={() => setProfileEditor('stores')} /> : <ScrollView horizontal={previewMode === 'desktop'} showsHorizontalScrollIndicator={previewMode === 'desktop'} contentContainerStyle={{ justifyContent: previewMode === 'desktop' ? 'flex-start' : 'center', width: previewMode === 'desktop' ? undefined : '100%' }}><View style={{ width: previewMode === 'desktop' ? 900 : '100%', maxWidth: previewMode === 'mobile' ? 390 : 900, alignSelf: 'center', backgroundColor: C.bg, borderRadius: 18, borderWidth: 1, borderColor: '#E6EAF2', padding: 10, marginTop: 9 }}><Text style={{ color: C.muted, fontSize: 9, marginBottom: 7, textAlign: 'center' }}>VISTA {previewMode === 'mobile' ? 'CELULAR' : 'COMPUTADORA'} · BORRADOR SIN GUARDAR</Text><BusinessProfileView store={selectedPreviewStore} stores={previewStores} coupons={data.coupons} serviceHours={data.serviceHours} layout={currentLayout} desktop={previewMode === 'desktop'} previewOnly builderMode selectedBlockId={selectedPreviewBlock} onSelectBlock={setSelectedPreviewBlock} onDropBlock={dropCanvasBlock} onBlockLayout={(id, layout) => { previewCanvasLayoutsRef.current[id] = layout; }} /></View></ScrollView>}
              {selectedBlockDefinition ? <Card style={{ padding: 14, marginTop: 10 }}>
                <Label style={{ fontSize: 15 }}>Bloque seleccionado: {selectedBlockDefinition.label}</Label>
                <Text style={{ color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 4 }}>{selectedBlockDefinition.description}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                  <ProfileEditorButton label="Modificar este bloque" active={false} onPress={() => { setShowBlockPicker(false); setProfileEditor(editSectionByBlock[selectedPreviewBlock] || 'company'); }} />
                  <ProfileEditorButton label={showBlockPicker ? 'Cancelar cambio' : 'Cambiar bloque'} active={showBlockPicker} onPress={() => setShowBlockPicker((open) => !open)} />
                </View>
                {showBlockPicker ? <><Text style={{ color: C.muted, fontSize: 10, marginBottom: 7 }}>Elige qué sección ocupará esta posición. El bloque actual intercambiará su lugar y visibilidad.</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{PUBLIC_PROFILE_BLOCKS.filter((block) => block.id !== selectedPreviewBlock).map((block) => <ProfileEditorButton key={block.id} label={block.label} active={false} onPress={() => replaceSelectedBlock(block.id)} />)}</View></> : null}
              </Card> : null}
            </Card>
          </> : null}
          <Text style={{ color: C.muted, fontSize: 10, marginTop: 5 }}>Editando: {editor}</Text>
        </>}
      </>;
    }
    if (activeSection === 'stores') return data.company ? <StoreManagement stores={data.stores} onCreate={createStore} onUpdate={updateStore} /> : <EmptySection title="Primero registra tu empresa" description="Vincula la empresa desde la pestaña Empresa para poder guardar sucursales propias." onBackToGuide={() => setActiveSection('company')} />;
    if (activeSection === 'coupons') return data.company ? <CouponManagement stores={data.stores} coupons={data.coupons} onCreate={createCoupon} onUpdate={updateCoupon} onUploadImage={uploadCouponImage} /> : <EmptySection title="Primero registra tu empresa" description="Vincula la empresa desde la pestaña Empresa antes de crear promociones." onBackToGuide={() => setActiveSection('company')} />;
    if (activeSection === 'hours') return data.company ? <HoursManagement stores={data.stores} hours={data.serviceHours} onSave={saveWeeklySchedule} /> : <EmptySection title="Primero registra tu empresa" description="Vincula la empresa desde la pestaña Empresa antes de configurar horarios." onBackToGuide={() => setActiveSection('company')} />;
    return <AlertsManagement alerts={data.alerts} />;
  }

  return (
    <View>
      <Header title={isAdmin ? 'Panel administrativo' : 'Panel de negocios'} back={onBack} />
      <Card style={{ backgroundColor: C.navy }}>
        <Text style={{ color: C.white, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>QPONS VIP BUSINESS</Text>
        <Text style={{ color: C.white, fontSize: 22, fontWeight: '800', marginTop: 8 }}>Hola, {session.user.name}</Text>
        <Text style={{ color: '#C9D3E6', fontSize: 11, marginTop: 5 }}>{session.user.email}</Text>
        <Text style={{ color: '#8FE0C1', fontSize: 10, marginTop: 12 }}>● Acceso autorizado para {session.user.role}</Text>
      </Card>
      {session.user.role === 'business' && !session.user.companyId && !data.company ? <Card style={{ backgroundColor: '#FFF7E8', borderColor: '#F2D9A6' }}><Text style={{ color: C.navy, fontSize: 13, fontWeight: '800' }}>Primer paso: registra tu empresa</Text><Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 5 }}>Completa los datos comerciales y la vincularemos a tu cuenta automáticamente.</Text><Pressable onPress={() => setActiveSection('company')} accessibilityRole="button" style={{ alignSelf: 'flex-start', marginTop: 10, paddingVertical: 5 }}><Text style={{ color: C.pink, fontSize: 11, fontWeight: '800' }}>Registrar empresa  →</Text></Pressable></Card> : null}
      {data.company?.approvalStatus === 'pending' ? <Card style={{ backgroundColor: '#FFF7E8', borderColor: '#F2D9A6' }}><Text style={{ color: C.navy, fontSize: 13, fontWeight: '800' }}>Registro recibido · pendiente de aprobación</Text><Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 5 }}>Ya puedes completar tu perfil y preparar el contenido. Tu negocio se mostrará al público cuando el equipo de QPONS VIP lo apruebe.</Text></Card> : null}
      {data.company?.approvalStatus === 'rejected' ? <Card style={{ backgroundColor: '#FFF7F8', borderColor: '#F2D9E0' }}><Text style={{ color: C.pink, fontSize: 13, fontWeight: '800' }}>Tu empresa necesita ajustes</Text><Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 5 }}>Actualiza la información desde Perfil público. Al guardar los cambios, la solicitud volverá a revisión.</Text><Pressable onPress={() => { setActiveSection('company'); setProfileEditor('company'); }} accessibilityRole="button" style={{ alignSelf: 'flex-start', paddingVertical: 7, marginTop: 5 }}><Text style={{ color: C.pink, fontSize: 11, fontWeight: '800' }}>Editar datos de la empresa →</Text></Pressable></Card> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
        {availableSections.map((section) => {
          const counts = { company: data.company ? 1 : 0, stores: data.stores.length, coupons: data.coupons.length, sales: data.coupons.filter((coupon) => !isExpiredOffer(coupon)).length, hours: data.serviceHours.length, alerts: data.alerts.length };
          return <PanelTab key={section.key} section={section} active={section.key === activeSection} count={counts[section.key]} onPress={() => setActiveSection(section.key)} />;
        })}
      </View>
      <Label style={{ fontSize: 20, marginBottom: 5 }}>{selectedSection.title}</Label>
      <Text style={{ color: C.muted, fontSize: 12, marginBottom: 13 }}>{selectedSection.description}</Text>
      {!loading && !error && activeSection === 'summary' ? <Text style={{ color: C.muted, fontSize: 11, marginBottom: 8 }}>Empieza por el paso pendiente y toca cada fila para abrir esa sección.</Text> : null}
      {renderSection()}
      <Button secondary onPress={loadOverview}>Actualizar información</Button>
      <Button secondary onPress={onLogout}>Cerrar sesión del negocio</Button>
    </View>
  );
}
