import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';
import { getCategoryIcon, getStatusMeta } from '../constants/inventory';
import { colors, radius, shadow, spacing, touchTarget, typography } from '../constants/theme';
import { formatQuantity } from '../utils/format';
import type { InventoryItem } from '../types';

interface ItemCardProps {
  item: InventoryItem;
  onPress?: () => void;
  /** Shows a "⋯" button (Edit / Delete menu) instead of the chevron. */
  onMorePress?: () => void;
}

/** One household item row, used in Inventory and on the dashboard. */
export default function ItemCard({ item, onPress, onMorePress }: ItemCardProps) {
  const quantity = formatQuantity(item.quantity, item.unit);
  const statusColor = getStatusMeta(item.status).color;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onMorePress}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.category}, ${getStatusMeta(item.status).label}`}
      accessibilityHint={onMorePress ? 'Long press for edit and delete options' : undefined}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {/* Coloured edge so status is visible at a glance, not by colour alone */}
      <View style={[styles.edge, { backgroundColor: statusColor }]} />

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

      {onMorePress ? (
        <Pressable
          onPress={onMorePress}
          style={({ pressed }) => [styles.more, pressed && styles.morePressed]}
          accessibilityRole="button"
          accessibilityLabel={`More options for ${item.name}`}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
        </Pressable>
      ) : onPress ? (
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
    paddingVertical: spacing.lg,
    paddingLeft: spacing.lg + 4,
    paddingRight: spacing.sm,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow,
  },
  pressed: {
    opacity: 0.9,
  },
  edge: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
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
    marginRight: spacing.xs,
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
  more: {
    width: touchTarget - 4,
    height: touchTarget - 4,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePressed: {
    backgroundColor: colors.background,
  },
});
