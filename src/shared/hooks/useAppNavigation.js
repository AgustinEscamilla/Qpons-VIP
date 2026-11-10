import { router, useLocalSearchParams } from 'expo-router';

export const appScreens = [
  'Acceso', 'AccesoNegocio', 'Crear cuenta', 'Verificar', 'Recuperar', 'Inicio', 'InicioAnterior',
  'Buscar', 'Cupones', 'Favoritos', 'Negocio', 'DetalleNegocio', 'Perfil', 'Cupón QR',
  'Escanear QR', 'PanelNegocio',
];

// Mantiene la sección visible en la URL sin reemplazar la ruta raíz de la aplicación.
export function useAppNavigation(initialScreen = 'Inicio') {
  const params = useLocalSearchParams();
  // `screen` es reservado por Expo Router; `view` identifica nuestras secciones.
  const routeView = params.view ?? params.screen;
  const screenParam = Array.isArray(routeView) ? routeView[0] : routeView;
  const screen = typeof screenParam === 'string' && appScreens.includes(screenParam) ? screenParam : initialScreen;

  function goTo(destination) {
    // Actualiza la sección en la ruta actual para conservar el estado de App.
    router.setParams({
      ...(params.screen !== undefined ? { screen: undefined } : {}),
      view: destination === initialScreen ? undefined : destination,
    });
  }

  return { screen, goTo };
}
