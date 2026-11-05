import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStatusMeta } from '../constants/inventory';
import { radius, spacing, typography } from '../constants/theme';
import type { StockStatus } from '../types';

interface StatusBadgeProps {
  status: StockStatus;
  size?: 'small' | 'medium';
}

/** Coloured pill: green = Available, amber = Low Stock, red = Out of Stock. */
export default function StatusBadge({ status, size = 'small' }: StatusBadgeProps) {
  const meta = getStatusMeta(status);
  const isMedium = size === 'medium';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: meta.background },
        isMedium && styles.medium,
      ]}
      accessibilityLabel={`Status: ${meta.label}`}
    >
      <Ionicons name={meta.icon} size={isMedium ? 16 : 13} color={meta.color} />
      <Text
        style={[styles.text, { color: meta.textColor }, isMedium && styles.mediumText]}
      >
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  medium: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  text: {
    ...typography.small,
    fontWeight: '600',
  },
  mediumText: {
    fontSize: 14,
  },
});
