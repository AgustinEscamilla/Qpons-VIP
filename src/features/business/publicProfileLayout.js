export const PUBLIC_PROFILE_BLOCKS = [
  { id: 'hero', label: 'Portada y presentación', description: 'Imagen principal, nombre, dirección y descripción.' },
  { id: 'contact', label: 'Contacto y ubicación', description: 'Botones para llamar, abrir el mapa, web y redes.' },
  { id: 'location', label: 'Ubicación y llegada', description: 'Dirección de la sucursal y acceso a la ruta en GPS.' },
  { id: 'carousel', label: 'Carrusel de promociones', description: 'Ofertas activas en tarjetas que los clientes pueden deslizar.', defaultVisible: false },
  { id: 'promotions', label: 'Promociones VIP', description: 'Cupones publicados por el negocio.' },
  { id: 'text', label: 'Texto promocional', description: 'Un mensaje para presentar tus productos, servicios o una campaña.', defaultVisible: false },
  { id: 'image', label: 'Imagen promocional', description: 'Una imagen destacada para anunciar tu negocio o una oferta.', defaultVisible: false },
  { id: 'gallery', label: 'Galería de fotos', description: 'Imágenes adicionales de tus sucursales y promociones.' },
  { id: 'videos', label: 'Video promocional', description: 'Comparte un video o enlaces de TikTok, YouTube y Facebook.' },
  { id: 'highlights', label: 'Servicios y beneficios', description: 'Destaca lo que hace especial a tu negocio.', defaultVisible: false },
  { id: 'hours', label: 'Horarios', description: 'Días y horas de servicio.' },
  { id: 'branches', label: 'Otras sucursales', description: 'Ubicaciones de la misma empresa.' },
  { id: 'terms', label: 'Términos y condiciones', description: 'Restricciones de tus promociones.' },
];

export const PUBLIC_PROFILE_THEMES = [
  { id: 'classic', label: 'QPONS clásico' },
  { id: 'midnight', label: 'Noche VIP' },
  { id: 'forest', label: 'Verde natural' },
];

export const PUBLIC_PROFILE_PALETTES = {
  classic: { page: '#F5F7FF', surface: '#FFFFFF', ink: '#101B30', muted: '#60708D', accent: '#C00038', soft: '#FFE0E8', button: '#101B30', buttonText: '#FFFFFF', border: '#EDF0F6' },
  midnight: { page: '#101B30', surface: '#1C2A42', ink: '#F7F9FC', muted: '#C3CEE0', accent: '#FF8099', soft: '#402436', button: '#B00035', buttonText: '#FFFFFF', border: '#34445F' },
  forest: { page: '#F0F8F3', surface: '#FFFFFF', ink: '#15382C', muted: '#587264', accent: '#14835D', soft: '#DDF4E7', button: '#15382C', buttonText: '#FFFFFF', border: '#DDEBE2' },
};

export function getPublicProfilePalette(theme) {
  return PUBLIC_PROFILE_PALETTES[theme] || PUBLIC_PROFILE_PALETTES.classic;
}

export function createDefaultPublicProfileLayout() {
  return {
    theme: 'classic',
    blocks: PUBLIC_PROFILE_BLOCKS.map(({ id, defaultVisible }) => ({ id, visible: defaultVisible !== false })),
    content: {
      text: '',
      imageUrl: '',
      imageAlt: 'Imagen promocional',
      videoUrl: '',
      videoTitle: 'Conoce nuestro negocio',
      highlights: '',
    },
    sales: {
      title: 'Promociones VIP',
      description: 'Descubre beneficios exclusivos disponibles en esta sucursal.',
      buttonLabel: 'Obtener cupón VIP',
      featuredCouponId: null,
    },
  };
}

export function normalizePublicProfileLayout(value) {
  const defaults = createDefaultPublicProfileLayout();
  if (!value || typeof value !== 'object') return defaults;
  const supplied = Array.isArray(value.blocks) ? value.blocks : [];
  const seen = new Set();
  const blocks = supplied.filter((block) => PUBLIC_PROFILE_BLOCKS.some((known) => known.id === block?.id) && !seen.has(block.id) && seen.add(block.id));
  for (const block of defaults.blocks) if (!seen.has(block.id)) blocks.push(block);
  const content = value.content && typeof value.content === 'object' ? value.content : {};
  return {
    theme: PUBLIC_PROFILE_THEMES.some(({ id }) => id === value.theme) ? value.theme : defaults.theme,
    blocks: blocks.map((block) => ({
      id: block.id,
      visible: block.id === 'hero' ? true : typeof block.visible === 'boolean' ? block.visible : defaults.blocks.find((item) => item.id === block.id)?.visible ?? true,
    })),
    content: {
      text: typeof content.text === 'string' ? content.text.trim().slice(0, 2000) : defaults.content.text,
      imageUrl: typeof content.imageUrl === 'string' ? content.imageUrl.trim().slice(0, 300) : defaults.content.imageUrl,
      imageAlt: typeof content.imageAlt === 'string' ? content.imageAlt.trim().slice(0, 120) || defaults.content.imageAlt : defaults.content.imageAlt,
      videoUrl: typeof content.videoUrl === 'string' ? content.videoUrl.trim().slice(0, 500) : defaults.content.videoUrl,
      videoTitle: typeof content.videoTitle === 'string' ? content.videoTitle.trim().slice(0, 100) || defaults.content.videoTitle : defaults.content.videoTitle,
      highlights: typeof content.highlights === 'string' ? content.highlights.slice(0, 600) : defaults.content.highlights,
    },
    sales: {
      title: typeof value.sales?.title === 'string' ? value.sales.title.trim().slice(0, 60) || defaults.sales.title : defaults.sales.title,
      description: typeof value.sales?.description === 'string' ? value.sales.description.trim().slice(0, 180) : defaults.sales.description,
      buttonLabel: typeof value.sales?.buttonLabel === 'string' ? value.sales.buttonLabel.trim().slice(0, 30) || defaults.sales.buttonLabel : defaults.sales.buttonLabel,
      featuredCouponId: Number.isSafeInteger(Number(value.sales?.featuredCouponId)) && Number(value.sales?.featuredCouponId) > 0 ? Number(value.sales.featuredCouponId) : null,
    },
  };
}
