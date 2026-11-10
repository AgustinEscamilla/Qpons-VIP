import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors as C } from '../../shared/theme/colors.js';

// Permite elegir desde el registro si la cuenta será de cliente o de negocio.
export function RegistrationRoleSelector({ role, onChange, visible = false }) {
  if (!visible) return null;

  const options = [
    { key: 'customer', label: 'Registro como cliente' },
    { key: 'business', label: 'Registro como negocio' },
  ];

  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14, backgroundColor: C.pale, borderRadius: 28, padding: 5 }}>
      {options.map((option) => {
        const selected = role === option.key;

        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            style={{ flex: 1, backgroundColor: selected ? C.navy : C.white, borderRadius: 23, paddingVertical: 13, paddingHorizontal: 8 }}
          >
            <Text style={{ color: selected ? C.white : C.navy, textAlign: 'center', fontSize: 12, fontWeight: '700' }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
