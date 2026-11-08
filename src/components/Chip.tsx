import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../constants/theme';
import type { IoniconName } from '../constants/inventory';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IoniconName;
  /** Small number shown after the label, e.g. how many items match. */
  count?: number;
  /** Accent colour used for the dot/icon (e.g. status colours). */
  accent?: string;
}

/** Selectable pill used by the filters and the category picker. */
export default function Chip({ label, selected, onPress, icon, count, accent }: ChipProps) {
  const fg = selected ? colors.white : colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={count !== undefined ? `${label}, ${count}` : label}
      hitSlop={{ top: 4, bottom: 4 }}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.selected : styles.unselected,
        pressed && styles.pressed,
      ]}
    >
      {accent && !icon ? (
        <View style={[styles.dot, { backgroundColor: selected ? colors.white : accent }]} />
      ) : null}
      {icon ? (
        <Ionicons name={icon} size={16} color={selected ? colors.white : accent ?? colors.primary} />
      ) : null}
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
      {count !== undefined ? (
        <View style={[styles.count, selected && styles.countSelected]}>
          <Text style={[styles.countText, selected && styles.countTextSelected]}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  unselected: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    ...typography.label,
    fontSize: 14,
  },
  count: {
    minWidth: 20,
    paddingHorizontal: 6,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countSelected: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  countText: {
    ...typography.small,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  countTextSelected: {
    color: colors.white,
  },
});
