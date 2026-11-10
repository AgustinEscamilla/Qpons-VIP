import React from 'react';
import { Stack } from 'expo-router';
import '../../global.css';

// Navigator universal; el hook cambia de seccion sin desmontar la aplicacion.
export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
