import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../components/AppButton';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import StatusSelector from '../components/StatusSelector';
import { useInventory } from '../contexts/InventoryContext';
import { deleteItem, updateItemStatus } from '../services/inventoryService';
import { addInventoryItemToShoppingList, AlreadyOnListError } from '../services/shoppingService';
import { useShopping } from '../contexts/ShoppingContext';
import { getCategoryIcon, getStatusMeta, IoniconName } from '../constants/inventory';
import { colors, radius, shadow, spacing, touchTarget, typography } from '../constants/theme';
import { confirmDeleteItem } from '../utils/confirm';
import { getErrorMessage } from '../utils/errors';
import { formatDate, formatQuantity } from '../utils/format';
import type { AppScreenProps, StockStatus } from '../types';

type Props = AppScreenProps<'ItemDetails'>;

function DetailRow({
  icon,
  label,
  value,
  muted,
}: {
  icon: IoniconName;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={20} color={colors.textSecondary} style={styles.detailIcon} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, muted && styles.muted]} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

export default function ItemDetailsScreen({ navigation, route }: Props) {
  const { itemId } = route.params;
  const { loading, getItemById } = useInventory();
  const item = getItemById(itemId);
  const { isItemOnList } = useShopping();
  const onList = isItemOnList(itemId);

  const [statusSaving, setStatusSaving] = useState<StockStatus | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const busyRef = useRef(false);

  // Edit button in the header.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: item
        ? () => (
            <Pressable
              onPress={() => navigation.navigate('EditItem', { itemId })}
              hitSlop={8}
              style={styles.headerButton}
              accessibilityRole="button"
              accessibilityLabel="Edit item"
            >
              <Ionicons name="create-outline" size={24} color={colors.primary} />
            </Pressable>
          )
        : undefined,
    });
  }, [navigation, item, itemId]);

  // Clear the "Status updated" note after a moment.
  useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(null), 2500);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  const changeStatus = async (status: StockStatus) => {
    if (!item || status === item.status || busyRef.current) return;
    busyRef.current = true;
    setStatusSaving(status);
    try {
      const result = await updateItemStatus(item.id, status);
      setStatusMessage(
        result === 'pending' ? 'Saved offline, will sync later' : `Marked as ${getStatusMeta(status).label}`,
      );
    } catch (error) {
      Alert.alert('Could not update status', getErrorMessage(error));
    } finally {
      busyRef.current = false;
      setStatusSaving(null);
    }
  };

  const addToShoppingList = async () => {
    if (!item || busyRef.current) return;
    busyRef.current = true;
    setAdding(true);
    try {
      await addInventoryItemToShoppingList(item);
    } catch (error) {
      if (error instanceof AlreadyOnListError) Alert.alert('Already added', error.message);
      else Alert.alert('Could not add to shopping list', getErrorMessage(error));
    } finally {
      busyRef.current = false;
      setAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!item || busyRef.current) return;
    if (!(await confirmDeleteItem(item.name))) return;
    busyRef.current = true;
    setDeleting(true);
    try {
      await deleteItem(item.id);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Could not delete item', getErrorMessage(error));
      busyRef.current = false;
      setDeleting(false);
    }
  };

  if (loading || deleting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        {deleting ? <Text style={styles.centerText}>Deleting…</Text> : null}
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="help-circle-outline"
          title="Item not found"
          message="It may have been deleted on another device."
          actionLabel="Back to inventory"
          actionIcon="arrow-back"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  const quantity = formatQuantity(item.quantity, item.unit);
  const needsRestock = item.status !== 'available';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Summary */}
      <View style={[styles.card, styles.hero]}>
        <View style={styles.heroIcon}>
          <Ionicons name={getCategoryIcon(item.category)} size={32} color={colors.primary} />
        </View>
        <Text style={styles.name} accessibilityRole="header">
          {item.name}
        </Text>
        <Text style={styles.category}>{item.category}</Text>
        <View style={styles.heroBadge}>
          <StatusBadge status={item.status} size="medium" />
        </View>
      </View>

      {/* Quick status change */}
      <Text style={styles.sectionTitle}>Update stock status</Text>
      <View style={styles.card}>
        <StatusSelector
          value={item.status}
          onChange={changeStatus}
          disabled={statusSaving !== null}
        />
        <Text style={styles.statusNote} accessibilityLiveRegion="polite">
          {statusSaving ? 'Saving…' : statusMessage ?? 'Tap a status to update it instantly.'}
        </Text>
      </View>

      {/* Shopping list */}
      <Text style={styles.sectionTitle}>Shopping list</Text>
      <View style={styles.card}>
        {onList ? (
          <View style={styles.onList}>
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            <Text style={styles.onListText}>This item is on your shopping list.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.shoppingHint}>
              {needsRestock
                ? `${item.name} is ${getStatusMeta(item.status).label.toLowerCase()}. Add it to your shopping list so you don't forget.`
                : 'Add this item to your shopping list when you need to buy more.'}
            </Text>
            <AppButton
              title="Add to Shopping List"
              icon="cart-outline"
              variant={needsRestock ? 'primary' : 'outline'}
              onPress={addToShoppingList}
              loading={adding}
            />
          </>
        )}
      </View>

      {/* Details */}
      <Text style={styles.sectionTitle}>Details</Text>
      <View style={[styles.card, styles.detailsCard]}>
        <DetailRow icon="cube-outline" label="Quantity" value={quantity ?? 'Not set'} muted={!quantity} />
        <View style={styles.divider} />
        <DetailRow
          icon="document-text-outline"
          label="Notes"
          value={item.notes ?? 'No notes'}
          muted={!item.notes}
        />
        <View style={styles.divider} />
        <DetailRow icon="calendar-outline" label="Added" value={formatDate(item.createdAt)} />
        <View style={styles.divider} />
        <DetailRow icon="time-outline" label="Last updated" value={formatDate(item.updatedAt)} />
      </View>

      <View style={styles.actions}>
        <AppButton
          title="Edit Item"
          icon="create-outline"
          variant="secondary"
          onPress={() => navigation.navigate('EditItem', { itemId })}
        />
        <AppButton
          title="Delete Item"
          icon="trash-outline"
          variant="dangerOutline"
          onPress={handleDelete}
          style={styles.deleteButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  centerText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  headerButton: {
    minWidth: touchTarget - 8,
    minHeight: touchTarget - 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  name: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  category: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  heroBadge: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  statusNote: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  onList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  onListText: {
    ...typography.bodyStrong,
    color: colors.primary,
    flex: 1,
  },
  shoppingHint: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  detailsCard: {
    paddingVertical: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  detailIcon: {
    marginRight: spacing.md,
    marginTop: 1,
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
    width: 104,
  },
  detailValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  muted: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  actions: {
    marginTop: spacing.xl,
  },
  deleteButton: {
    marginTop: spacing.md,
  },
});
