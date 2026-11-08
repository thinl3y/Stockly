import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../constants/theme';

interface FormMessageProps {
  type: 'error' | 'success' | 'info';
  message: string | null | undefined;
}

const VARIANTS = {
  error: { icon: 'alert-circle', fg: colors.dangerText, bg: colors.dangerLight },
  success: { icon: 'checkmark-circle', fg: colors.primary, bg: colors.primaryLight },
  info: { icon: 'information-circle', fg: colors.warningText, bg: colors.warningLight },
} as const;

/** Inline banner for form-level errors (e.g. from Firebase) and confirmations. */
export default function FormMessage({ type, message }: FormMessageProps) {
  if (!message) return null;
  const v = VARIANTS[type];

  return (
    <View
      style={[styles.box, { backgroundColor: v.bg }]}
      accessibilityRole={type === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={v.icon} size={20} color={v.fg} />
      <Text style={[styles.text, { color: v.fg }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  text: {
    ...typography.caption,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
