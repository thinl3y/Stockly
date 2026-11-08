import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../constants/theme';
import type { IoniconName } from '../constants/inventory';

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: IoniconName;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Two or three side-by-side options, e.g. "From inventory | New item". */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.selected]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
          >
            {option.icon ? (
              <Ionicons
                name={option.icon}
                size={16}
                color={selected ? colors.primary : colors.textSecondary}
              />
            ) : null}
            <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },
  selected: {
    backgroundColor: colors.card,
  },
  label: {
    ...typography.label,
    fontSize: 14,
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.primary,
  },
});
