# Qpons VIP

Aplicacion movil y web creada con Expo y React Native.

La estructura del codigo, el recorrido de datos, los endpoints, la base de datos y los pasos para ejecutar el proyecto estan explicados en el [Manual de codigo](docs/MANUAL_CODIGO.md).

## Requisitos

- Node.js con npm instalado.

## Instalacion automatica

Al crear un entorno de GitHub Codespaces o VS Code Dev Containers, `npm ci` se ejecuta automaticamente y deja instaladas las dependencias.


```bash
npm ci
```

Este comando instala las versiones exactas guardadas en `package-lock.json`. No es necesario incluir ni descargar `node_modules`.

## Ejecutar

Para abrir la version web en el navegador:

```bash
npm run web
```

Para iniciar Expo y usar la aplicacion con Expo Go:

```bash
npm start
```

Escanea el codigo QR que aparece en la terminal con Expo Go. Los comandos deben ejecutarse desde la carpeta del proyecto.

## Google Maps

El perfil público muestra el mapa de la sucursal. En el panel del negocio, la sección **Sucursales** permite elegir el punto exacto tocando el mapa o arrastrando el marcador; también se puede usar el GPS. Copia `.env.example` a `.env.local` y configura las claves de Google Maps. `.env.local` está ignorado por Git y no debe subirse al repositorio.

En Google Cloud habilita **Maps SDK for Android**, **Maps Static API** y **Maps JavaScript API**, con facturación activa. La API JavaScript se usa en web para seleccionar el punto exacto y convertirlo en dirección. Para publicar, usa claves separadas y restringe la de Android por el identificador de la app y su certificado; restringe la clave web por los dominios permitidos. Expo toma la clave Android desde `GOOGLE_MAPS_ANDROID_API_KEY` y los mapas web desde `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`.

Después de cambiar la clave nativa, genera de nuevo el build de Android para que se aplique la configuración de Google Maps.

## Backend NestJS + PostgreSQL

El backend usa NestJS como API y PostgreSQL como base de datos. La configuración está en `backend/.env` y las entidades principales siguen el modelo de Qpons.

```powershell
cd backend
Copy-Item .env.example .env
# Edita .env con la contraseña de PostgreSQL
npm install
npm run start:dev
```

Endpoints principales:

- `GET /api/health/database`
- `GET /api/categories`
- `GET /api/subcategories`
- `GET /api/cities`
- `GET /api/companies`
- `GET /api/stores`
- `GET /api/service-hours`
- `GET /api/coupons`
- `GET /api/alerts`
- `GET /api/store-config`
