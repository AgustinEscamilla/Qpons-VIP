import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors as C } from '../../shared/theme/colors.js';

// Muestra las subcategorías recibidas desde PostgreSQL para filtrar el catálogo.
export function CatalogSubcategories({ subcategories = [], onSelect }) {
  const visibleSubcategories = subcategories.filter((subcategory) => subcategory.active !== false).slice(0, 6);

  if (!visibleSubcategories.length) {
    return <Text style={{ color: C.muted, fontSize: 11 }}>No hay subcategorías disponibles.</Text>;
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 10 }}>
      {visibleSubcategories.map((subcategory) => (
        <Pressable
          key={subcategory.id}
          onPress={() => onSelect?.(subcategory)}
          style={{ backgroundColor: C.pale, borderRadius: 16, paddingHorizontal: 11, paddingVertical: 8 }}
        >
          <Text style={{ color: C.navy, fontSize: 11, fontWeight: '600' }}>{subcategory.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// Muestra las ciudades reales y permite seleccionar la ubicación del catálogo.
export function CatalogCities({ cities = [], selectedCity, onSelect }) {
  const visibleCities = cities.slice(0, 4);

  if (!visibleCities.length) {
    return <Text style={{ color: C.muted, fontSize: 11 }}>No hay ciudades disponibles.</Text>;
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
      {visibleCities.map((city) => {
        const selected = selectedCity?.id === city.id;

        return (
          <Pressable
            key={city.id}
            onPress={() => onSelect?.(city)}
            style={{
              backgroundColor: selected ? C.navy : C.white,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: selected ? C.navy : '#EEF0F5',
              paddingHorizontal: 11,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: selected ? C.white : C.navy, fontSize: 11, fontWeight: '600' }}>
              {city.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
