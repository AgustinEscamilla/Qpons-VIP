import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import {
  Category,
  City,
  Company,
  Coupon,
  ServiceHour,
  Store,
  Subcategory,
  databaseEntities,
} from './entities/index.js';

const categories = [
  { name: 'Restaurantes', subcategories: ['Mexicana', 'Cortes y parrilla', 'Cocina vegana', 'Sushi y ramen', 'BBQ', 'Panadería'] },
  { name: 'Cafeterías', subcategories: ['Café de especialidad', 'Jugos y smoothies'] },
  { name: 'Nightlife', subcategories: ['Lounge', 'Coctelería'] },
  { name: 'Belleza & Spa', subcategories: ['Cuidado de la piel', 'Uñas y spa', 'Medspa'] },
  { name: 'Fitness', subcategories: ['Gimnasio'] },
  { name: 'Entretenimiento', subcategories: ['Boliche y juegos'] },
  { name: 'Tiendas', subcategories: ['Arte y regalos', 'Aventura outdoor'] },
  { name: 'Hogar', subcategories: ['Decoración'] },
  { name: 'Servicios', subcategories: ['Florería', 'Detallado automotriz'] },
];

const cities = [
  { name: 'McAllen, TX', code: 'RGV-MFE', latitude: '26.2034', longitude: '-98.2300' },
  { name: 'Edinburg, TX', code: 'RGV-EBG', latitude: '26.3017', longitude: '-98.1633' },
  { name: 'Mission, TX', code: 'RGV-MSN', latitude: '26.2159', longitude: '-98.3253' },
  { name: 'Pharr, TX', code: 'RGV-PHR', latitude: '26.1948', longitude: '-98.1836' },
  { name: 'Weslaco, TX', code: 'RGV-WES', latitude: '26.1595', longitude: '-97.9908' },
  { name: 'Harlingen, TX', code: 'RGV-HRL', latitude: '26.1906', longitude: '-97.6961' },
  { name: 'Brownsville, TX', code: 'RGV-BRO', latitude: '25.9018', longitude: '-97.4975' },
];

const demoBusinesses = [
  { name: 'Cosecha Norte Taquería', category: 'Restaurantes', subcategory: 'Mexicana', city: 'McAllen, TX', description: 'Tacos al carbón, tortillas hechas a mano y salsas de temporada con ingredientes del Valle.', offerName: 'Cuarto taco de cortesía', offerDescription: 'Compra tres tacos de la casa y recibe el cuarto sin costo.', terms: 'Válido en tacos de la casa. No combinable con otras promociones.', text: 'El sabor del norte se sirve recién hecho, con recetas familiares y productos locales.', highlights: ['Tortillas hechas a mano', 'Salsas preparadas diariamente', 'Opciones vegetarianas'], address: '101 Demo Plaza, McAllen, TX', phone: '956-555-0101', photo: 'photo-1517248135467-4c7edcad34c4', galleryPhoto: 'photo-1504674900247-0877df9cc836', openHour: 11, closeHour: 21, closedDay: 'Lunes' },
  { name: 'Brasa del Río Steakhouse', category: 'Restaurantes', subcategory: 'Cortes y parrilla', city: 'Edinburg, TX', description: 'Cortes a la parrilla, guarniciones artesanales y una carta pensada para cenas especiales.', offerName: 'Acompañamiento para compartir', offerDescription: 'En la compra de dos cortes principales, elige una guarnición al centro de cortesía.', terms: 'Aplica en cortes seleccionados de lunes a jueves. Se requiere una compra mínima de dos platos.', text: 'Una mesa para celebrar: cortes al fuego, ingredientes de temporada y hospitalidad del Valle.', highlights: ['Cortes preparados al momento', 'Terraza para grupos', 'Menú de temporada'], address: '102 Demo Plaza, Edinburg, TX', phone: '956-555-0102', photo: 'photo-1544025162-d76694265947', galleryPhoto: 'photo-1414235077428-338989a2e8c0', openHour: 16, closeHour: 22, closedDay: 'Martes' },
  { name: 'La Esquina del Grano', category: 'Cafeterías', subcategory: 'Café de especialidad', city: 'McAllen, TX', description: 'Café de pequeños lotes, bebidas preparadas por baristas y pan dulce de proveedores locales.', offerName: 'Latte y pan del día', offerDescription: 'Combina cualquier latte mediano con una pieza de panadería por precio especial.', terms: 'Disponible hasta las 11:00 a. m. o hasta agotar existencias.', text: 'Tu pausa favorita empieza con café recién molido y algo dulce hecho cerca de casa.', highlights: ['Granos de origen único', 'Leche vegetal disponible', 'Panadería local'], address: '103 Demo Plaza, McAllen, TX', phone: '956-555-0103', photo: 'photo-1501339847302-ac426a4a7cbb', galleryPhoto: 'photo-1495474472287-4d71bcdd2085', openHour: 7, closeHour: 18, closedDay: 'Domingo' },
  { name: 'Fruta Brava Smoothie Bar', category: 'Cafeterías', subcategory: 'Jugos y smoothies', city: 'Mission, TX', description: 'Smoothies, bowls de fruta y jugos prensados preparados con combinaciones frescas.', offerName: 'Extra de energía', offerDescription: 'Agrega proteína vegetal o un shot de espresso a tu smoothie sin costo.', terms: 'Un extra gratis por bebida. No acumulable con otras ofertas.', text: 'Color, fruta fresca y mezclas hechas al momento para acompañar tu día.', highlights: ['Fruta fresca', 'Opciones sin lácteos', 'Proteína vegetal'], address: '104 Demo Plaza, Mission, TX', phone: '956-555-0104', photo: 'photo-1553530666-ba11a7da3888', galleryPhoto: 'photo-1505252585461-04db1eb84625', openHour: 8, closeHour: 19, closedDay: 'Miércoles' },
  { name: 'Menta & Maíz Cocina Verde', category: 'Restaurantes', subcategory: 'Cocina vegana', city: 'McAllen, TX', description: 'Cocina basada en plantas con maíz criollo, vegetales de temporada y salsas hechas en casa.', offerName: 'Menú verde para dos', offerDescription: 'Dos platos principales vegetales y dos aguas frescas por precio especial.', terms: 'Disponible de martes a jueves. Bebidas participantes sujetas a disponibilidad.', text: 'Comida vegetal abundante, llena de sabor y preparada con ingredientes de temporada.', highlights: ['Menú 100% vegetal', 'Ingredientes regionales', 'Comida para llevar'], address: '105 Demo Plaza, McAllen, TX', phone: '956-555-0105', photo: 'photo-1512621776951-a57141f2eefd', galleryPhoto: 'photo-1540420773420-3366772f4999', openHour: 11, closeHour: 20, closedDay: 'Lunes' },
  { name: 'Pan de Sol RGV', category: 'Restaurantes', subcategory: 'Panadería', city: 'Pharr, TX', description: 'Pan dulce, masa madre y pasteles pequeños elaborados cada mañana en el Valle.', offerName: 'Media docena de pan dulce', offerDescription: 'Lleva seis piezas de pan dulce de la vitrina y paga cinco.', terms: 'Válido en piezas seleccionadas. No aplica en pasteles personalizados.', text: 'Horneamos temprano para que el aroma del pan recién hecho llegue a tu mesa.', highlights: ['Horneado diario', 'Pasteles por encargo', 'Opciones de masa madre'], address: '106 Demo Plaza, Pharr, TX', phone: '956-555-0106', photo: 'photo-1608198093002-ad4e0054848b', galleryPhoto: 'photo-1509440159596-0249088772ff', openHour: 6, closeHour: 17, closedDay: 'Domingo' },
  { name: 'Marea Sushi & Ramen', category: 'Restaurantes', subcategory: 'Sushi y ramen', city: 'Edinburg, TX', description: 'Rollos preparados al momento, ramen de cocción lenta y opciones frescas para compartir.', offerName: 'Rollo de la casa', offerDescription: 'Recibe un rollo clásico de la casa al ordenar dos platos principales participantes.', terms: 'Válido en salón de lunes a jueves. No aplica con pedidos de catering.', text: 'Sabor japonés con un toque del Valle, servido en un espacio tranquilo y moderno.', highlights: ['Ramen preparado por horas', 'Pescado seleccionado', 'Opciones sin gluten'], address: '107 Demo Plaza, Edinburg, TX', phone: '956-555-0107', photo: 'photo-1579871494447-9811cf80d66c', galleryPhoto: 'photo-1579584425555-c3ce17fd4351', openHour: 12, closeHour: 22, closedDay: 'Martes' },
  { name: 'Carbón 956 BBQ', category: 'Restaurantes', subcategory: 'BBQ', city: 'Mission, TX', description: 'Brisket ahumado lentamente, costillas glaseadas y guarniciones hechas desde cero.', offerName: 'Combo de brisket', offerDescription: 'Combo de brisket con dos guarniciones y bebida a precio especial.', terms: 'Disponible hasta agotar existencias. No acumulable con otras promociones.', text: 'Humo lento, madera de mezquite y porciones generosas para compartir.', highlights: ['Brisket de ahumado lento', 'Salsas de la casa', 'Paquetes familiares'], address: '108 Demo Plaza, Mission, TX', phone: '956-555-0108', photo: 'photo-1529692236671-f1f6cf9683ba', galleryPhoto: 'photo-1544025162-d76694265947', openHour: 11, closeHour: 21, closedDay: 'Lunes' },
  { name: 'Luna Alta Rooftop Lounge', category: 'Nightlife', subcategory: 'Lounge', city: 'McAllen, TX', description: 'Lounge en azotea con música en vivo, coctelería de autor y vistas al centro de McAllen.', offerName: 'Coctel de bienvenida', offerDescription: 'Recibe un coctel sin alcohol de bienvenida al reservar una mesa para dos.', terms: 'Solo para mayores de edad. Presenta el cupón al llegar. No incluye bebidas alcohólicas.', text: 'Atardeceres, música y una carta de bebidas para empezar la noche con estilo.', highlights: ['Música en vivo ciertos días', 'Terraza al aire libre', 'Cocteles sin alcohol'], address: '109 Demo Plaza, McAllen, TX', phone: '956-555-0109', photo: 'photo-1470229722913-7c0e2dbbafd3', galleryPhoto: 'photo-1514933651103-005eec06c04b', openHour: 17, closeHour: 23, closedDay: 'Lunes' },
  { name: 'Candela Cava & Tapas', category: 'Nightlife', subcategory: 'Coctelería', city: 'Edinburg, TX', description: 'Tapas para compartir, vinos por copa y coctelería de temporada en un patio íntimo.', offerName: 'Tabla de tapas', offerDescription: 'Ahorra en una tabla de tapas al ordenar dos bebidas participantes.', terms: 'Disponible de martes a jueves. Bebidas alcohólicas solo para mayores de edad.', text: 'Una cava acogedora para probar sabores nuevos y compartir una buena conversación.', highlights: ['Tapas de temporada', 'Vinos por copa', 'Patio con iluminación cálida'], address: '110 Demo Plaza, Edinburg, TX', phone: '956-555-0110', photo: 'photo-1514933651103-005eec06c04b', galleryPhoto: 'photo-1414235077428-338989a2e8c0', openHour: 16, closeHour: 23, closedDay: 'Domingo' },
  { name: 'Loto Skin Studio', category: 'Belleza & Spa', subcategory: 'Cuidado de la piel', city: 'McAllen, TX', description: 'Faciales personalizados y rutinas de cuidado de la piel con consulta antes de cada servicio.', offerName: 'Facial de primera visita', offerDescription: 'Descuento en tu facial personalizado al reservar una consulta inicial.', terms: 'Se requiere cita. Un beneficio por persona y sujeto a disponibilidad.', text: 'Cada tratamiento comienza escuchando lo que tu piel necesita hoy.', highlights: ['Consulta personalizada', 'Productos profesionales', 'Citas privadas'], address: '111 Demo Plaza, McAllen, TX', phone: '956-555-0111', photo: 'photo-1570172619644-dfd03ed5d881', galleryPhoto: 'photo-1616394584738-fc6e612e71b9', openHour: 9, closeHour: 19, closedDay: 'Domingo' },
  { name: 'Magnolia Nails & Spa', category: 'Belleza & Spa', subcategory: 'Uñas y spa', city: 'Mission, TX', description: 'Manicura, pedicura y tratamientos de spa con estaciones privadas y opciones para grupos.', offerName: 'Manicura y diseño', offerDescription: 'Incluye un diseño sencillo en dos uñas al reservar una manicura.', terms: 'El diseño debe solicitarse al reservar. No aplica en servicios para grupos.', text: 'Un espacio relajante para renovar tu estilo con detalles cuidados y productos de calidad.', highlights: ['Citas para grupos', 'Diseños personalizados', 'Estaciones higienizadas'], address: '112 Demo Plaza, Mission, TX', phone: '956-555-0112', photo: 'photo-1604654894610-df63bc536371', galleryPhoto: 'photo-1610992015732-2449b76344bc', openHour: 9, closeHour: 19, closedDay: 'Lunes' },
  { name: 'Aura MedSpa RGV', category: 'Belleza & Spa', subcategory: 'Medspa', city: 'Edinburg, TX', description: 'Servicios estéticos no invasivos realizados por personal certificado y con valoración previa.', offerName: 'Valoración de cortesía', offerDescription: 'Agenda una valoración estética inicial sin costo al consultar un tratamiento.', terms: 'Valoración con cita. Los tratamientos se determinan después de una consulta profesional.', text: 'Bienestar y estética con información clara, atención personal y planes responsables.', highlights: ['Valoración individual', 'Personal certificado', 'Plan de cuidado personalizado'], address: '113 Demo Plaza, Edinburg, TX', phone: '956-555-0113', photo: 'photo-1540555700478-4be289fbecef', galleryPhoto: 'photo-1519823551278-64ac92734fb1', openHour: 9, closeHour: 18, closedDay: 'Domingo' },
  { name: 'Pulso Fitness Lab', category: 'Fitness', subcategory: 'Gimnasio', city: 'McAllen, TX', description: 'Entrenamiento funcional, pesas y sesiones guiadas para distintos niveles de experiencia.', offerName: 'Pase de prueba', offerDescription: 'Prueba una sesión grupal sin costo antes de elegir tu plan.', terms: 'Una sesión de prueba por persona. Se requiere registro previo.', text: 'Entrena a tu ritmo con un equipo que te ayuda a establecer metas sostenibles.', highlights: ['Clases funcionales', 'Entrenadores certificados', 'Área de fuerza y movilidad'], address: '114 Demo Plaza, McAllen, TX', phone: '956-555-0114', photo: 'photo-1534438327276-14e5300c3a48', galleryPhoto: 'photo-1517836357463-d25dfeac3438', openHour: 5, closeHour: 21, closedDay: 'Domingo' },
  { name: 'Strike & Social RGV', category: 'Entretenimiento', subcategory: 'Boliche y juegos', city: 'Pharr, TX', description: 'Boliche, juegos de salón y espacios para cumpleaños, reuniones y noches entre amigos.', offerName: 'Una línea extra', offerDescription: 'Reserva una hora de boliche y recibe una línea adicional para el grupo.', terms: 'Se requiere reservación. Válido para grupos de hasta seis personas.', text: 'Juega, celebra y disfruta una tarde diferente con actividades para todo el grupo.', highlights: ['Boliche para familias', 'Paquetes de cumpleaños', 'Área de juegos'], address: '115 Demo Plaza, Pharr, TX', phone: '956-555-0115', photo: 'photo-1540747913346-19e32dc3e97e', galleryPhoto: 'photo-1511512578047-dfb367046420', openHour: 12, closeHour: 22, closedDay: 'Martes' },
  { name: 'Magnolia Paper & Gifts', category: 'Tiendas', subcategory: 'Arte y regalos', city: 'McAllen, TX', description: 'Papelería creativa, regalos hechos por artistas locales y detalles personalizados para eventos.', offerName: 'Detalle de artista local', offerDescription: 'Ahorra en una selección de tarjetas y regalos de creadores del Valle.', terms: 'Aplica en artículos marcados. No incluye pedidos personalizados.', text: 'Encuentra un regalo especial y apoya a quienes crean en nuestra comunidad.', highlights: ['Artistas del Valle', 'Empaque para regalo', 'Papelería personalizada'], address: '116 Demo Plaza, McAllen, TX', phone: '956-555-0116', photo: 'photo-1513364776144-60967b0f800f', galleryPhoto: 'photo-1452860606245-08befc0ff44b', openHour: 10, closeHour: 19, closedDay: 'Domingo' },
  { name: 'Sendero Outdoor Co.', category: 'Tiendas', subcategory: 'Aventura outdoor', city: 'Mission, TX', description: 'Equipo y asesoría para senderismo, campismo, ciclismo y aventuras al aire libre.', offerName: 'Kit de aventura', offerDescription: 'Descuento en un kit de hidratación al comprar una mochila participante.', terms: 'Válido en modelos seleccionados y sujeto a existencias.', text: 'Te ayudamos a prepararte para salir a explorar con el equipo adecuado.', highlights: ['Equipo para senderismo', 'Asesoría de talla y ajuste', 'Renta de accesorios'], address: '117 Demo Plaza, Mission, TX', phone: '956-555-0117', photo: 'photo-1553062407-98eeb64c6a62', galleryPhoto: 'photo-1472396961693-142e6e269027', openHour: 10, closeHour: 19, closedDay: 'Lunes' },
  { name: 'Casa Laurel Home Market', category: 'Hogar', subcategory: 'Decoración', city: 'Weslaco, TX', description: 'Decoración, textiles y piezas seleccionadas para hacer más personal cada espacio.', offerName: 'Renueva tu espacio', offerDescription: 'Ahorra en una selección de cojines y accesorios para el hogar.', terms: 'Válido en productos seleccionados. No aplica en muebles sobre pedido.', text: 'Ideas sencillas y piezas especiales para que tu casa se sienta más tuya.', highlights: ['Decoración de temporada', 'Piezas de proveedores locales', 'Asesoría para espacios pequeños'], address: '118 Demo Plaza, Weslaco, TX', phone: '956-555-0118', photo: 'photo-1600210492486-724fe5c67fb0', galleryPhoto: 'photo-1616486338812-3dadae4b4ace', openHour: 10, closeHour: 18, closedDay: 'Domingo' },
  { name: 'Flor de Río Atelier', category: 'Servicios', subcategory: 'Florería', city: 'Harlingen, TX', description: 'Arreglos florales de temporada para regalos, celebraciones y decoración de eventos.', offerName: 'Ramo de temporada', offerDescription: 'Incluye una tarjeta personalizada al ordenar un ramo de temporada.', terms: 'Ordena con al menos un día de anticipación. Las flores dependen de temporada.', text: 'Flores frescas y composiciones hechas a mano para celebrar los momentos importantes.', highlights: ['Flores de temporada', 'Entrega local programada', 'Diseño para eventos'], address: '119 Demo Plaza, Harlingen, TX', phone: '956-555-0119', photo: 'photo-1490750967868-88aa4486c946', galleryPhoto: 'photo-1520763185298-1b434c919102', openHour: 9, closeHour: 18, closedDay: 'Domingo' },
  { name: 'Brillo Norte Auto Spa', category: 'Servicios', subcategory: 'Detallado automotriz', city: 'Brownsville, TX', description: 'Lavado detallado, limpieza interior y protección para mantener tu vehículo en gran estado.', offerName: 'Limpieza interior VIP', offerDescription: 'Ahorra en el servicio de limpieza interior al reservar un detallado completo.', terms: 'Se requiere cita y evaluación del vehículo. No aplica en vehículos de gran tamaño.', text: 'Cuidado automotriz con atención al detalle desde el tablero hasta el acabado exterior.', highlights: ['Limpieza interior profunda', 'Productos seguros para pintura', 'Citas el mismo día según disponibilidad'], address: '120 Demo Plaza, Brownsville, TX', phone: '956-555-0120', photo: 'photo-1492144534655-ae79c964c9d7', galleryPhoto: 'photo-1507136566006-cfc505b114fc', openHour: 8, closeHour: 18, closedDay: 'Domingo' },
];

const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const cityKey = (name: string) => name.toLocaleLowerCase('es-MX').replace(/,?\s*(tx|texas)$/i, '').trim();
const demoVideos = [
  { url: 'https://www.pexels.com/video/authentic-mexican-cuisine-handcrafted-tacos-39030362/', title: 'Tacos preparados al momento' },
  { url: 'https://www.pexels.com/video/close-up-view-of-meat-being-grilled-3192260/', title: 'Cortes a la parrilla' },
  { url: 'https://www.pexels.com/video/a-barista-preparing-coffee-9046230/', title: 'Preparación de café de especialidad' },
  { url: 'https://www.pexels.com/video/a-person-making-a-smoothie-8844498/', title: 'Smoothies de fruta fresca' },
  { url: 'https://www.pexels.com/video/vegan-food-being-placed-on-table-6328269/', title: 'Cocina vegetal de temporada' },
  { url: 'https://www.pexels.com/video/a-person-making-a-bread-4186953/', title: 'Pan artesanal recién hecho' },
  { url: 'https://www.pexels.com/video/chef-making-sushi-8908336/', title: 'Sushi preparado por el chef' },
  { url: 'https://www.pexels.com/video/a-grill-with-meat-being-cooked-on-it-17598915/', title: 'BBQ al carbón' },
  { url: 'https://www.pexels.com/video/nightclub-bartender-pouring-evening-cocktail-32054975/', title: 'Coctelería para la noche' },
  { url: 'https://www.pexels.com/video/bartender-pouring-alcohol-into-cocktail-shaker-30197432/', title: 'Cócteles y tapas para compartir' },
  { url: 'https://www.pexels.com/video/relaxing-spa-treatment-for-skin-rejuvenation-30913900/', title: 'Ritual de cuidado facial' },
  { url: 'https://www.pexels.com/video/a-nail-technician-working-on-a-client-7754436/', title: 'Manicura y cuidado de uñas' },
  { url: 'https://www.pexels.com/video/close-up-of-a-woman-receiving-a-facial-treatment-13467956/', title: 'Tratamiento de bienestar y piel' },
  { url: 'https://www.pexels.com/video/energetic-woman-exercising-with-dumbbells-in-gym-37609128/', title: 'Entrenamiento de fuerza' },
  { url: 'https://www.pexels.com/video/bowling-ball-hitting-pins-7334243/', title: 'Noche de boliche y juegos' },
  { url: 'https://www.pexels.com/video/focused-artist-painting-in-studio-32320362/', title: 'Arte hecho por creadores locales' },
  { url: 'https://www.pexels.com/video/man-hiking-outdoor-trail-with-backpack-34237962/', title: 'Ideas para tu próxima aventura' },
  { url: 'https://www.pexels.com/video/modern-minimalist-living-room-interior-design-37522009/', title: 'Inspiración para renovar tu hogar' },
  { url: 'https://www.pexels.com/video/woman-holding-flowers-while-entering-a-flower-shop-6764457/', title: 'Arreglos florales de temporada' },
  { url: 'https://www.pexels.com/video/car-being-cleaned-in-a-carwash-4707154/', title: 'Cuidado y limpieza automotriz' },
];

const photoUrl = (photo: string) => 'https://images.unsplash.com/' + photo + '?auto=format&fit=crop&w=1200&q=82';
const time = (hour: number) => String(hour).padStart(2, '0') + ':00';

const dataSource = new DataSource({
  type: 'postgres',
  ...(process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || 5432),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'qpons',
      }),
  ssl: process.env.DB_SSL === 'true' ? true : undefined,
  entities: databaseEntities,
  synchronize: false,
});

async function seedDemoData() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error('Para cargar datos de demostración en producción, define ALLOW_DEMO_SEED=true temporalmente.');
  }

  await dataSource.initialize();
  try {
    await dataSource.transaction(async (manager) => {
      const categoryRepository = manager.getRepository(Category);
      const subcategoryRepository = manager.getRepository(Subcategory);
      const cityRepository = manager.getRepository(City);
      const companyRepository = manager.getRepository(Company);
      const storeRepository = manager.getRepository(Store);
      const couponRepository = manager.getRepository(Coupon);
      const serviceHourRepository = manager.getRepository(ServiceHour);

      const categoryRecords = await categoryRepository.find();
      const subcategoryRecords = await subcategoryRepository.find({ relations: { categoryId: true } });
      const cityRecords = await cityRepository.find();
      const categoryByName = new Map<string, Category>();
      const subcategoryByKey = new Map<string, Subcategory>();
      const cityByName = new Map<string, City>();

      for (const definition of categories) {
        let category = categoryRecords.find((item) => item.name.toLocaleLowerCase('es-MX') === definition.name.toLocaleLowerCase('es-MX'));
        if (!category) {
          category = await categoryRepository.save(categoryRepository.create({
            name: definition.name,
            order: categoryRecords.length + 1,
            active: true,
          }));
          categoryRecords.push(category);
        }
        categoryByName.set(definition.name, category);

        for (const subcategoryName of definition.subcategories) {
          const key = definition.name + '::' + subcategoryName;
          let subcategory = subcategoryRecords.find((item) =>
            item.name.toLocaleLowerCase('es-MX') === subcategoryName.toLocaleLowerCase('es-MX')
            && item.categoryId?.id === category?.id,
          );
          if (!subcategory) {
            subcategory = await subcategoryRepository.save(subcategoryRepository.create({
              name: subcategoryName,
              active: true,
              categoryId: category,
            }));
            subcategoryRecords.push(subcategory);
          }
          subcategoryByKey.set(key, subcategory);
        }
      }

      for (const definition of cities) {
        let city = cityRecords.find((item) => cityKey(item.name) === cityKey(definition.name));
        if (!city) {
          city = await cityRepository.save(cityRepository.create(definition));
          cityRecords.push(city);
        }
        cityByName.set(definition.name, city);
      }

      const expiresAt = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000);

      for (const [index, business] of demoBusinesses.entries()) {
        const video = demoVideos[index];
        if (!video) throw new Error('Falta un video de muestra para ' + business.name);
        const sequence = String(index + 1).padStart(2, '0');
        const demoKey = 'qpons-demo-business-' + sequence;
        const category = categoryByName.get(business.category);
        const subcategory = subcategoryByKey.get(business.category + '::' + business.subcategory);
        const city = cityByName.get(business.city);
        if (!category || !subcategory || !city) throw new Error('Falta una categoría, subcategoría o ciudad para ' + business.name);

        let company = await companyRepository.findOne({ where: { companyId: demoKey } });
        if (!company) company = companyRepository.create();
        Object.assign(company, {
          name: business.name,
          companyId: demoKey,
          description: business.description,
          phone: business.phone,
          keywords: [business.name, business.category, business.subcategory, business.city, 'demo', 'QPONS VIP'].join(', '),
          approvalStatus: 'approved' as const,
          categories: [category],
          subcategories: [subcategory],
          cityIds: [city],
        });
        company = await companyRepository.save(company);

        let store = await storeRepository.findOne({ where: { companyId: { id: company.id } } });
        if (!store) store = storeRepository.create();
        const offset = (index % 5) * 0.0012;
        const latitude = Number(city.latitude || 26.2034) + offset;
        const longitude = Number(city.longitude || -98.23) - offset;
        Object.assign(store, {
          name: business.name,
          address: business.address,
          description: business.description,
          phone: business.phone,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
          companyId: company,
          cityId: [city],
        });
        store = await storeRepository.save(store);

        const couponDocumentId = 'qpons-demo-coupon-' + sequence;
        let coupon = await couponRepository.findOne({ where: { documentId: couponDocumentId } });
        if (!coupon) coupon = couponRepository.create();
        Object.assign(coupon, {
          documentId: couponDocumentId,
          name: business.offerName,
          description: business.offerDescription,
          code: 'RGVVIP' + sequence,
          expiration: expiresAt,
          terms: business.terms,
          image_1: photoUrl(business.photo),
          image_2: photoUrl(business.galleryPhoto),
          storeId: store,
        });
        coupon = await couponRepository.save(coupon);

        const hours = await serviceHourRepository.find({ where: { storeId: { id: store.id } } });
        if (hours.length) await serviceHourRepository.remove(hours);
        const closedDay = business.closedDay;
        const openHour = business.openHour;
        const closeHour = business.closeHour;
        const serviceHours = dayNames.map((day, dayIndex) => {
          const isClosed = day === closedDay;
          const opening = openHour + (dayIndex === 5 && !isClosed ? 1 : 0);
          const closing = closeHour + (dayIndex === 5 && !isClosed ? 1 : 0);
          return serviceHourRepository.create({
            dayOfWeek: day,
            ...(isClosed ? {} : { openingTime: time(opening), closingTime: time(closing) }),
            companyId: company,
            storeId: store,
          });
        });
        await serviceHourRepository.save(serviceHours);

        company.publicProfileLayout = {
          theme: ['classic', 'midnight', 'forest'][index % 3],
          blocks: [
            { id: 'hero', visible: true },
            { id: 'contact', visible: true },
            { id: 'location', visible: true },
            { id: 'carousel', visible: index % 2 === 0 },
            { id: 'promotions', visible: index % 2 !== 0 },
            { id: 'text', visible: true },
            { id: 'image', visible: true },
            { id: 'gallery', visible: true },
            { id: 'videos', visible: true },
            { id: 'highlights', visible: true },
            { id: 'hours', visible: true },
            { id: 'branches', visible: false },
            { id: 'terms', visible: true },
          ],
          content: {
            text: business.text,
            imageUrl: photoUrl(business.galleryPhoto),
            imageAlt: 'Imagen de ' + business.name,
            videoUrl: video.url,
            videoTitle: video.title,
            highlights: business.highlights.join('\n'),
          },
          sales: {
            title: 'Promociones VIP',
            description: business.offerDescription,
            buttonLabel: 'Ver promoción',
            featuredCouponId: coupon.id,
          },
        };
        await companyRepository.save(company);
      }
    });
    console.log('Listo: 20 empresas demo, 20 sucursales, 20 cupones y 140 horarios quedaron cargados.');
  } finally {
    await dataSource.destroy();
  }
}

seedDemoData().catch((error: unknown) => {
  console.error('No se pudieron cargar los negocios demo:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
