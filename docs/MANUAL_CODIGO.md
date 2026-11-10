# Manual de codigo de QPONS VIP

Este documento explica como se organiza y funciona la aplicacion para poder mantenerla, ejecutarla y presentarla. La app tiene una interfaz para celular y otra adaptada a computadora; ambas consumen la misma API y comparten las reglas de negocio.

## 1. Tecnologias y recorrido general

- **Aplicacion:** Expo SDK 57, React Native y JavaScript. Expo Router abre la aplicacion en Android, iOS y web.
- **API:** NestJS con TypeScript. Los controladores reciben HTTP y delegan el trabajo a servicios.
- **Datos:** PostgreSQL, conectado desde TypeORM mediante entidades y relaciones.
- **Autenticacion:** registro con codigo OTP por correo, contrasenas con hash bcrypt y sesiones JWT.
- **Mapas:** Expo Location en dispositivo y Google Maps JavaScript API en navegador. Las sucursales guardan latitud y longitud.

Flujo de una consulta publica:

```text
Pantalla o componente
  -> src/services/api/*.service.js
  -> src/services/api/client.js
  -> HTTP /api/... del backend
  -> Controller de NestJS
  -> Service de dominio
  -> TypeORM Repository
  -> PostgreSQL
```

Una respuesta vuelve por el mismo camino hasta la pantalla. Los formularios del panel negocio incluyen estados de carga, errores y confirmacion cuando corresponde.

## 2. Estructura del repositorio

```text
App.js                         Entrada de compatibilidad; la app Expo usa Expo Router
src/
|-- app/                       Rutas de Expo Router
|   |-- _layout.js             Navegador raiz y estilos globales
|   `-- index.js               Ruta que monta la aplicacion QPONS
|-- App.js                     Composicion de pantallas y estado global de la app
|-- features/
|   |-- auth/                  Acceso, registro, verificacion OTP y recuperacion
|   |-- business/              Panel, sucursales, cupones y ficha publica editable
|   |-- catalog/               Catalogo, filtros, cercania, videos y vista de escritorio
|   |-- coupons/               Cupones del usuario, detalle, QR y escaner
|   |-- location/              Ubicacion del cliente y seleccion de ubicacion de sucursal
|   `-- profile/               Perfil, favoritos y pantallas de miembro
|-- services/api/              Cliente HTTP y funciones por dominio
`-- shared/
    |-- components/            Controles compartidos de interfaz
    |-- hooks/                 Navegacion y hooks reutilizables
    |-- theme/                 Colores compartidos
    `-- utils/                 Validaciones reutilizables

backend/src/
|-- app.module.ts              Une los modulos de la API
|-- main.ts                    Configura CORS, prefijo /api, uploads y puerto
|-- auth/                      Registro, OTP, JWT, permisos y perfil de usuario
|-- business/                  Operaciones privadas de los negocios
|-- catalog/                   Consultas publicas para explorar la app
|-- config/                    Carga de variables de entorno
`-- database/
    |-- connection/            Configuracion de TypeORM y PostgreSQL
    |-- entities/              Entidades que representan tablas y relaciones
    `-- seed-demo.ts            Carga opcional de datos de demostracion
```

Las carpetas agrupan archivos relacionados cuando hay suficientes piezas para formar una funcionalidad. `common/` no se creo porque en esta version no hay una funcion transversal de backend que necesite ese modulo; no se agregan carpetas vacias. Los archivos se separan por responsabilidad. No se agrega codigo artificial para alcanzar un minimo de lineas.

## 3. Inicio de la app y navegacion

1. Expo usa `expo-router/entry`, configurado como `main` en `package.json`.
2. `src/app/_layout.js` crea el navegador raiz sin encabezado y carga los estilos globales.
3. `src/app/index.js` renderiza `src/App.js`.
4. `src/App.js` compone las pantallas, detecta el ancho para decidir entre experiencia movil y escritorio, y mantiene sesiones, ubicacion, favoritos y seleccion de contenido.
5. `src/shared/hooks/useAppNavigation.js` cambia la pantalla usando el parametro `screen` de la ruta raiz. Asi la app conserva su estado en memoria mientras el usuario navega.

Para anadir una pantalla, agrega su componente a la funcionalidad correspondiente e integralo en `src/App.js` y en la lista permitida de `appScreens`. No pongas componentes de uso general dentro de `src/app/`: Expo Router interpreta los archivos ahi como rutas.

La interfaz movil usa componentes React Native. En web se habilitan distribuciones mas amplias cuando el ancho llega al umbral de escritorio; las funciones y los datos siguen siendo los mismos.

## 4. Frontend por funcionalidad

### `src/features/auth/`

Contiene el acceso de cliente y negocio, seleccion de tipo de cuenta, formulario de registro, verificacion de correo y recuperacion. Las pantallas llaman a `authApi`; no deben implementar consultas HTTP directamente.

### `src/features/catalog/`

Carga y muestra empresas, sucursales, categorias, subcategorias, cupones, horarios, avisos y videos. `useCatalog.js` concentra la carga y los estados de la informacion. Las vistas movil y escritorio reutilizan esos datos y aplican filtros de busqueda, categoria, ciudad y cercania.

### `src/features/business/`

`BusinessPanel.js` coordina las secciones privadas y sus operaciones. `BusinessPanelSections.js` contiene secciones visuales reutilizadas. Los formularios de sucursales, horarios, cupones y avisos viven separados para que cada archivo tenga una tarea concreta. `BusinessOperations.js` es una fachada de exportacion para que el panel importe esos formularios desde un solo lugar.

`BusinessProfileView.js` presenta la ficha publica. `publicProfileLayout.js` define los bloques permitidos, temas y valores por defecto. El editor guarda visibilidad, orden, contenido y tema en el backend. La previsualizacion movil/escritorio representa la ficha que consultan los clientes.

### `src/features/location/`

La ubicacion del cliente puede venir del GPS o de los datos del perfil. La ubicacion de sucursal se selecciona en el mapa o con GPS y se envia como coordenadas al backend. Los archivos `.native.js` y `.web.js` permiten ofrecer una implementacion adecuada a cada plataforma.

### `src/features/coupons/` y `src/features/profile/`

Agrupan detalle/QR de cupones y funciones de miembro como favoritos, edicion de perfil y vistas de computadora. El boton de favorito y otros elementos compartidos viven en `src/shared/components/`.

## 5. Servicios HTTP del frontend

- `src/services/api/client.js`: define la URL base, agrega el token Bearer, convierte errores HTTP en errores legibles y prepara cargas multipart.
- `auth.service.js`: registro, login, verificacion, reenvio OTP y perfil.
- `catalog.service.js`: consultas publicas para el catalogo.
- `business.service.js`: operaciones autenticadas del panel de negocio.

La URL base se lee de `EXPO_PUBLIC_API_URL`. Si no se configura, el cliente usa `http://localhost:3000/api`. En un telefono fisico, `localhost` apunta al propio telefono: configura `EXPO_PUBLIC_API_URL=http://IP_DE_TU_COMPUTADORA:3000/api` en `.env.local` y conecta ambos equipos a una red que permita la comunicacion.

## 6. Backend NestJS

`backend/src/main.ts` crea Nest, habilita CORS, antepone `/api` a las rutas, expone `/uploads/` para imagenes guardadas localmente y escucha en el puerto configurado.

- `AppModule` ensambla configuracion, base de datos, catalogo, autenticacion y negocio.
- `AuthController` y `AuthService` gestionan cuentas, OTP, tokens y perfil.
- `CatalogController` y `CatalogService` sirven datos publicos de exploracion.
- `BusinessController` aplica guards de JWT y rol; `BusinessService` verifica propiedad, valida y guarda cambios de empresa, sucursales, horarios, cupones y ficha publica.
- `DatabaseModule` crea una unica conexion de TypeORM usando `ConfigService`.
- `entities/index.ts` exporta las entidades y la lista que TypeORM registra.

Los controladores definen las rutas HTTP. Los servicios contienen las reglas de negocio. Las entidades describen la forma persistida de los datos. Evita poner consultas SQL o reglas de negocio en pantallas o controladores.

### Autenticacion y verificacion

`POST /api/auth/register` crea la cuenta pendiente y solicita un codigo de seis digitos. El backend almacena un hash del codigo, aplica expiracion, limite de intentos y espera para reenvio. `POST /api/auth/verify-registration` compara el codigo y activa la cuenta. En registro de negocio crea la empresa con estado pendiente de aprobacion. `POST /api/auth/login` comprueba la contrasena y devuelve un JWT. Las rutas privadas leen `Authorization: Bearer <token>`.

En desarrollo local, `OTP_DEV_MODE=true` permite mostrar el codigo de desarrollo. Para una demo temporal en produccion, `OTP_TEST_MODE=true` y `OTP_TEST_EMAILS` permiten mostrar el codigo solo a las direcciones autorizadas, separadas por comas. Desactiva el modo de prueba al terminar. Para enviar correos reales se configuran `RESEND_API_KEY` y `OTP_FROM_EMAIL`.

### Rutas principales

| Metodo | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/health/database` | Comprueba conectividad con PostgreSQL |
| GET | `/api/categories`, `/api/subcategories`, `/api/cities` | Datos para filtros |
| GET | `/api/companies`, `/api/stores`, `/api/service-hours` | Comercios y sucursales |
| GET | `/api/coupons`, `/api/alerts`, `/api/store-config` | Promociones y configuracion publica |
| POST | `/api/auth/register` | Inicia registro y verificacion |
| POST | `/api/auth/verify-registration` | Confirma OTP y activa cuenta |
| POST | `/api/auth/resend-registration-code` | Reenvia OTP sujeto a espera |
| POST | `/api/auth/login` | Inicia sesion y entrega JWT |
| GET/PATCH | `/api/auth/me`, `/api/auth/profile` | Consulta o modifica el perfil autenticado |
| GET/POST/PATCH | `/api/business/...` | Panel privado de negocio y administracion |

El detalle actualizado de los endpoints se encuentra en `backend/src/*/*.controller.ts`. Las rutas `/api/business/companies/pending` y `/api/business/companies/:companyId/approval` requieren rol administrador; el resto del controlador de negocio requiere sesion y rol de negocio o administrador.

## 7. Datos y relaciones

Las clases en `backend/src/database/entities/` corresponden a tablas PostgreSQL:

- `User`: credenciales hasheadas, rol, estado de verificacion, perfil y empresa asociada.
- `Company`: informacion comercial, aprobacion, ciudades/categorias, configuracion de ficha y sucursales.
- `Store`: sucursal, direccion, telefono y coordenadas; pertenece a una empresa.
- `Coupon`: promocion, fechas, condiciones, imagenes, video y sucursal.
- `ServiceHour`: horario de empresa/sucursal y dia de la semana.
- `Category`, `Subcategory`, `City`: organizacion y zonas del catalogo.
- `Alert`, `StoreConfig`: avisos y configuracion de cliente.

Las relaciones `ManyToOne`, `OneToMany` y `ManyToMany` en TypeORM permiten traer elementos asociados y mantienen las llaves foraneas. Las coordenadas se guardan en latitud/longitud; la distancia se calcula en el cliente para ordenar negocios cercanos.

`DB_SYNCHRONIZE=true` permite que TypeORM sincronice el esquema durante desarrollo. Para produccion se debe desactivar y gestionar cambios de esquema con migraciones revisadas; no conviene dejar la sincronizacion automatica habilitada en una base productiva.

## 8. Ejecutar el proyecto

### Aplicacion

En la raiz del repositorio:

```powershell
npm ci
npm start
```

Para abrir web directamente:

```powershell
npm run web
```

Para abrir Android con Expo:

```powershell
npm run android
```

### API y base de datos

Instala PostgreSQL, crea una base llamada `qpons`, copia `backend/.env.example` a `backend/.env` y completa la contrasena local del usuario de PostgreSQL. Luego:

```powershell
cd backend
npm ci
npm run start:dev
```

La API queda en `http://localhost:3000/api`. Puedes revisar la conexion en `http://localhost:3000/api/health/database`. Para cargar los datos de demostracion incluidos, ejecuta `npm run seed:demo` dentro de `backend`; el script protege la base si `NODE_ENV=production`.

## 9. Variables de entorno y claves

Frontend, en `.env.local` (copia `.env.example`):

- `EXPO_PUBLIC_API_URL`: URL de NestJS visible para Expo.
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`: clave web restringida para Google Maps JavaScript API.
- `GOOGLE_MAPS_ANDROID_API_KEY`: clave nativa Android restringida por paquete y certificado.

Backend, en `backend/.env` (copia `backend/.env.example`):

- `PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`: servidor y base de datos.
- `DB_SYNCHRONIZE`: sincronizacion de esquema solo para desarrollo.
- `JWT_SECRET`: secreto aleatorio largo para firmar sesiones.
- `OTP_DEV_MODE`: muestra codigo de desarrollo solo localmente.
- `OTP_TEST_MODE`, `OTP_TEST_EMAILS`: habilitan temporalmente codigos visibles para correos autorizados en una demo.
- `RESEND_API_KEY`, `OTP_FROM_EMAIL`: entrega de codigo por correo.

Los archivos `.env` no se deben subir a Git. Nunca pongas claves, contrasenas, tokens ni codigos reales en el manual, comentarios, capturas o commits. Restringe las claves de Google Maps por API y origen permitido.

## 10. Convenciones para mantener el codigo

1. Mantener el flujo de datos en una direccion: pantalla -> servicio API -> backend -> persistencia.
2. Poner cada cambio en la funcionalidad a la que pertenece. Crear carpeta de funcionalidad cuando haya varios archivos relacionados; evitar carpetas de un solo archivo y niveles profundos innecesarios.
3. Separar componentes por responsabilidad y extraer helpers si tienen una finalidad clara. No dividir archivos unicamente para cumplir una cantidad minima de lineas.
4. Escribir comentarios en español que expliquen el proposito, una regla o una decision que no sea obvia. Evitar comentarios que repitan literalmente el nombre del metodo.
5. Mantener claves fuera del codigo fuente y usar variables de entorno.
6. Antes de entregar cambios, correr lint y typecheck; para backend tambien compilar Nest. Cuando se solicite validar comportamiento, ejecutar ademas las pruebas adecuadas.

## 11. Alcance actual y limites

- La app comparte catalogo, perfil publico y servicios entre celular y computadora, con presentaciones distintas por ancho/plataforma.
- Los bloques de la ficha son componentes predeterminados que el negocio puede ordenar, activar y personalizar; no es un editor libre de cualquier componente arbitrario.
- El codigo QR del cupon identifica la promocion. El panel indica que el registro real del canje/venta en caja requiere implementar un flujo de validacion de canje.
- Las imagenes subidas se guardan en `backend/uploads`. Para despliegue con varias instancias hace falta almacenamiento persistente compartido u object storage.
- El envio de correo real depende de credenciales y dominio verificado del proveedor.
- La disponibilidad de Google Maps depende de APIs habilitadas, facturacion y restricciones correctas de las claves.
