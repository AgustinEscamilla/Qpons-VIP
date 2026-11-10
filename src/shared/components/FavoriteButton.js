import React from 'react';
import { Pressable, Text } from 'react-native';
import { colors as C } from '../theme/colors.js';

export function FavoriteButton({ favorite, onPress, itemLabel = 'elemento', disabled = false, style }) {
  const action = favorite ? 'Quitar' : 'Agregar';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={action + ' ' + itemLabel + (favorite ? ' de favoritos' : ' a favoritos')}
      accessibilityState={{ selected: Boolean(favorite), disabled }}
      hitSlop={8}
      style={[
        {
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: favorite ? '#FFF0F3' : C.white,
          borderWidth: 1,
          borderColor: favorite ? '#FFD1DC' : '#E9EDF5',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.6 : 1,
          shadowColor: C.navy,
          shadowOpacity: 0.12,
          shadowRadius: 5,
          elevation: 2,
        },
        style,
      ]}
    >
      <Text style={{ color: favorite ? C.pink : C.navy, fontSize: 22, lineHeight: 25, fontWeight: '800' }}>
        {favorite ? '♥' : '♡'}
      </Text>
    </Pressable>
  );
}
