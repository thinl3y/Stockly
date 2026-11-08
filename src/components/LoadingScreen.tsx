import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../constants/theme';

interface LoadingScreenProps {
  message?: string;
}

/** Full-screen loader, shown while a saved session is being restored. */
export default function LoadingScreen({ message = 'Loading…' }: LoadingScreenProps) {
  return (
    <View style={styles.container} accessibilityLabel={message}>
      <View style={styles.logo}>
        <Ionicons name="basket" size={40} color={colors.white} />
      </View>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
