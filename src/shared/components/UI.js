import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { colors as C } from '../theme/colors.js';

export function Label({ children, style }) {
  return <Text style={[{ color: C.navy, fontSize: 16, fontWeight: '600' }, style]}>{children}</Text>;
}

export function Button({ children, onPress, secondary = false, disabled = false, style }) {
  return <Pressable onPress={onPress} disabled={disabled} accessibilityState={{ disabled }} style={[{ backgroundColor: secondary ? C.pale : C.navy, borderRadius: 28, paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center', marginTop: 12, opacity: disabled ? 0.55 : 1 }, style]}><Text style={{ color: secondary ? C.navy : C.white, fontSize: 16, fontWeight: '700' }}>{children}</Text></Pressable>;
}

export function Card({ children, style }) {
  return <View style={[{ backgroundColor: C.white, borderRadius: 24, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: '#F0F2F8' }, style]}>{children}</View>;
}

export function Field({ label, value, placeholder, secureTextEntry, onChangeText, error, keyboardType, autoCapitalize, autoComplete, maxLength, multiline }) {
  const [passwordVisible, setPasswordVisible] = React.useState(false);

  return <View style={{ marginTop: 16 }}>{!!label && <Label>{label}</Label>}<View style={{ position: 'relative', justifyContent: 'center' }}><TextInput defaultValue={onChangeText ? undefined : value} value={onChangeText ? value : undefined} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={C.muted} secureTextEntry={secureTextEntry && !passwordVisible} keyboardType={keyboardType} autoCapitalize={autoCapitalize} autoComplete={autoComplete} maxLength={maxLength} multiline={multiline} textAlignVertical={multiline ? 'top' : 'center'} style={{ marginTop: 9, height: multiline ? 100 : 54, borderRadius: multiline ? 18 : 28, backgroundColor: C.pale, paddingHorizontal: 18, paddingVertical: multiline ? 14 : 0, paddingRight: secureTextEntry ? 54 : 18, fontSize: 16, color: C.navy, borderWidth: error ? 1 : 0, borderColor: C.pink }} />{secureTextEntry ? <Pressable onPress={() => setPasswordVisible((visible) => !visible)} accessibilityRole="button" accessibilityLabel={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'} hitSlop={10} style={{ position: 'absolute', right: 17, top: 9, height: 54, width: 30, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.muted, fontSize: 18 }}>{passwordVisible ? '◉' : '◎'}</Text></Pressable> : null}</View>{error ? <Text accessibilityRole="alert" style={{ color: C.pink, fontSize: 11, marginTop: 5, marginLeft: 4 }}>{error}</Text> : null}</View>;
}

export function Header({ title, back }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}><Pressable onPress={back} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 23, color: C.navy }}>‹</Text></Pressable><Text style={{ fontSize: 16, fontWeight: '700', color: C.navy }}>{title}</Text><Text style={{ color: C.pink, fontWeight: '800' }}>Q</Text></View>;
}
