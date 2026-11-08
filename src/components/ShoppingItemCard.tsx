import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryIcon } from '../constants/inventory';
import { colors, radius, shadow, spacing, touchTarget, typography } from '../constants/theme';
import { formatDate, formatQuantity } from '../utils/format';
import type { ShoppingListItem } from '../types';

interface ShoppingItemCardProps {
  item: ShoppingListItem;
  /** True while this entry's purchase is being saved. */
  purchasing: boolean;
  onPurchase: () => void;
  onRemove: () => void;
  disabled?: boolean;
}

/** A pending shopping entry: tick the circle to mark it purchased. */
export default function ShoppingItemCard({
  item,
  purchasing,
  onPurchase,
  onRemove,
  disabled,
}: ShoppingItemCardProps) {
  const quantity = formatQuantity(item.quantity, item.unit);

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPurchase}
        disabled={purchasing || disabled}
        style={({ pressed }) => [styles.check, pressed && styles.checkPressed]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: false, busy: purchasing, disabled: purchasing || disabled }}
        accessibilityLabel={`Mark ${item.name} as purchased`}
      >
        {purchasing ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <View style={styles.circle} />
        )}
      </Pressable>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name={getCategoryIcon(item.category)} size={14} color={colors.textSecondary} />
          <Text style={styles.meta} numberOfLines={1}>
            {item.category}
          </Text>
          {quantity ? (
            <View style={styles.qty}>
              <Text style={styles.qtyText}>{quantity}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.added}>Added {formatDate(item.createdAt)}</Text>
          {item.itemId ? (
            <View style={styles.linked} accessibilityLabel="Linked to your inventory">
              <Ionicons name="link" size={12} color={colors.primary} />
              <Text style={styles.linkedText}>Inventory</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Pressable
        onPress={onRemove}
        disabled={purchasing || disabled}
        style={({ pressed }) => [styles.remove, pressed && styles.removePressed]}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.name} from shopping list`}
      >
        <Ionicons name="close" size={20} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
    marginBottom: spacing.md,
    ...shadow,
  },
  check: {
    width: touchTarget + 4,
    height: touchTarget + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkPressed: {
    opacity: 0.6,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  body: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  name: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  qty: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  qtyText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '700',
  },
  added: {
    ...typography.small,
    color: colors.textMuted,
  },
  linked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  linkedText: {
    ...typography.small,
    color: colors.primary,
  },
  remove: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePressed: {
    backgroundColor: colors.background,
  },
});
