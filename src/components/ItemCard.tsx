import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';
import { getCategoryIcon } from '../constants/inventory';
import { colors, radius, shadow, spacing, typography } from '../constants/theme';
import { formatQuantity } from '../utils/format';
import type { InventoryItem } from '../types';

interface ItemCardProps {
  item: InventoryItem;
  onPress?: () => void;
  onLongPress?: () => void;
}

/** One household item row, used in Inventory and on the dashboard. */
export default function ItemCard({ item, onPress, onLongPress }: ItemCardProps) {
  const quantity = formatQuantity(item.quantity, item.unit);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.category}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={getCategoryIcon(item.category)} size={22} color={colors.primary} />
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {item.category}
          {quantity ? `  ·  ${quantity}` : ''}
        </Text>
        {item.notes ? (
          <Text style={styles.notes} numberOfLines={1}>
            {item.notes}
          </Text>
        ) : null}
        <View style={styles.badgeRow}>
          <StatusBadge status={item.status} />
        </View>
      </View>

      {onPress ? (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow,
  },
  pressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  body: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notes: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  badgeRow: {
    marginTop: spacing.sm,
  },
});
