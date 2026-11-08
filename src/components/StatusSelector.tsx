import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STOCK_STATUSES } from '../constants/inventory';
import { colors, radius, spacing, typography } from '../constants/theme';
import type { StockStatus } from '../types';

interface StatusSelectorProps {
  value: StockStatus | null;
  onChange: (status: StockStatus) => void;
  disabled?: boolean;
}

/**
 * Three large buttons — Available / Low Stock / Out of Stock — coloured
 * green, amber and red. Used in the item form and on Item Details.
 */
export default function StatusSelector({ value, onChange, disabled }: StatusSelectorProps) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Stock status">
      {STOCK_STATUSES.map((status) => {
        const selected = value === status.value;
        return (
          <Pressable
            key={status.value}
            onPress={() => onChange(status.value)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={status.label}
            style={({ pressed }) => [
              styles.option,
              selected
                ? { backgroundColor: status.background, borderColor: status.color }
                : styles.unselected,
              pressed && styles.pressed,
              disabled && styles.disabled,
            ]}
          >
            <Ionicons
              name={selected ? status.icon : `${status.icon}-outline` as typeof status.icon}
              size={22}
              color={selected ? status.color : colors.textMuted}
            />
            <Text
              style={[styles.label, { color: selected ? status.textColor : colors.textSecondary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {status.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 64,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  unselected: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    ...typography.label,
  },
});
