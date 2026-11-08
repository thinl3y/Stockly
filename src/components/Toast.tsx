import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../constants/theme';

interface ToastProps {
  message: string | null;
}

/** Small confirmation bar pinned to the bottom of a screen. */
export default function Toast({ message }: ToastProps) {
  if (!message) return null;
  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={styles.toast} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <Ionicons name="checkmark-circle" size={20} color={colors.white} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

/** `const [toast, showToast] = useToast();` then `<Toast message={toast} />`. */
export function useToast(durationMs = 2800): [string | null, (message: string) => void] {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const show = useCallback(
    (text: string) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(text);
      timer.current = setTimeout(() => setMessage(null), durationMs);
    },
    [durationMs],
  );

  return [message, show];
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing.lg,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.textPrimary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    maxWidth: '100%',
  },
  text: {
    ...typography.bodyStrong,
    color: colors.white,
    flexShrink: 1,
  },
});
