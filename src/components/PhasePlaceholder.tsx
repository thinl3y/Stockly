import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmptyState from './EmptyState';
import { colors, radius, spacing, typography } from '../constants/theme';
import type { IoniconName } from '../constants/inventory';

interface PhasePlaceholderProps {
  title: string;
  icon: IoniconName;
  phase: 2 | 3 | 4 | 5;
  description: string;
  /** Set false for screens that already have a navigation header. */
  withSafeArea?: boolean;
}

/**
 * Temporary stand-in used only during Phase 1 so navigation can be tested
 * end to end. Each screen using it is fully replaced in its own phase,
 * and this file is deleted in Phase 5.
 */
export default function PhasePlaceholder({
  title,
  icon,
  phase,
  description,
  withSafeArea = true,
}: PhasePlaceholderProps) {
  const content = (
    <View style={styles.inner}>
      <View style={styles.pill}>
        <Text style={styles.pillText}>Built in Phase {phase}</Text>
      </View>
      <EmptyState icon={icon} title={title} message={description} />
    </View>
  );

  return withSafeArea ? (
    <SafeAreaView style={styles.container} edges={['top']}>
      {content}
    </SafeAreaView>
  ) : (
    <View style={styles.container}>{content}</View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  pillText: {
    ...typography.small,
    color: colors.warningText,
  },
});
