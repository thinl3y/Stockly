import React from 'react';
import { StyleSheet, View } from 'react-native';
import Chip from './Chip';
import { CATEGORIES } from '../constants/inventory';
import { spacing } from '../constants/theme';
import type { Category } from '../types';

interface CategorySelectorProps {
  value: Category | null;
  onChange: (category: Category) => void;
}

/** Wrapping row of category chips for the Add/Edit form. */
export default function CategorySelector({ value, onChange }: CategorySelectorProps) {
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel="Category">
      {CATEGORIES.map((category) => (
        <Chip
          key={category.value}
          label={category.value}
          icon={category.icon}
          selected={value === category.value}
          onPress={() => onChange(category.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
