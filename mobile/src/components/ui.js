import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../theme';

export function LoadingScreen({ label = 'Loading Atelier...' }) {
  return (
    <View style={styles.loadingWrap}>
      <ActivityIndicator color={colors.secondary} />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

export function AppButton({ title, onPress, variant = 'primary', disabled, style }) {
  const isOutline = variant === 'outline';
  const isSecondary = variant === 'secondary';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        isOutline && styles.btnOutline,
        isSecondary && styles.btnSecondary,
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      <Text
        style={[
          styles.btnText,
          isOutline && { color: colors.primary },
          isSecondary && { color: colors.onSecondary },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

export function AppInput({ label, style, ...props }) {
  return (
    <View style={styles.inputWrap}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.outlineVariant}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

export function Header({
  title = 'Lumina',
  showBack = false,
  right,
  transparent = false,
}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + 8 },
        transparent ? styles.headerTransparent : styles.headerSolid,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {showBack ? (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={styles.brand}>{title}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>{right}</View>
      </View>
    </View>
  );
}

export function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: 12,
  },
  loadingText: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  btnSecondary: {
    backgroundColor: colors.secondary,
  },
  btnText: {
    ...typography.caps,
    color: colors.onPrimary,
  },
  inputWrap: { marginBottom: 20 },
  inputLabel: { ...typography.label, marginBottom: 8 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.onSurface,
  },
  header: {
    paddingHorizontal: spacing.mobile,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerSolid: {
    backgroundColor: 'rgba(250,249,245,0.95)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  headerTransparent: {
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brand: {
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: -0.5,
    color: colors.primary,
  },
  backBtn: { paddingRight: 4 },
  backText: { fontSize: 22, color: colors.primary },
  errorBox: {
    backgroundColor: colors.errorContainer,
    borderWidth: 1,
    borderColor: 'rgba(186,26,26,0.2)',
    padding: 14,
    marginBottom: 16,
  },
  errorText: { color: colors.onErrorContainer, fontSize: 14 },
});
