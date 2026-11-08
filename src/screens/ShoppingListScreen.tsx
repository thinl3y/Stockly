import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../components/EmptyState';
import ShoppingItemCard from '../components/ShoppingItemCard';
import StatusBadge from '../components/StatusBadge';
import Toast, { useToast } from '../components/Toast';
import { useInventory } from '../contexts/InventoryContext';
import { useShopping } from '../contexts/ShoppingContext';
import {
  addInventoryItemToShoppingList,
  AlreadyOnListError,
  AlreadyPurchasedError,
  markAsPurchased,
  removeFromShoppingList,
} from '../services/shoppingService';
import { colors, radius, shadow, spacing, touchTarget, typography } from '../constants/theme';
import { confirmAction } from '../utils/confirm';
import { getErrorMessage } from '../utils/errors';
import type { InventoryItem, ShoppingListItem, TabScreenProps } from '../types';

type Props = TabScreenProps<'ShoppingList'>;

const SUGGESTIONS_COLLAPSED = 3;
const statusRank = { out_of_stock: 0, low_stock: 1, available: 2 } as const;

export default function ShoppingListScreen({ navigation }: Props) {
  const { pending, loading, error, isItemOnList } = useShopping();
  const { items } = useInventory();

  const [purchasing, setPurchasing] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState<Set<string>>(new Set());
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [toast, showToast] = useToast();
  // Synchronous guard so a fast double tap cannot start two purchases.
  const inFlight = useRef<Set<string>>(new Set());

  // Low / out-of-stock inventory items that are not on the list yet.
  const suggestions = useMemo(
    () =>
      items
        .filter((i) => i.status !== 'available' && !isItemOnList(i.id))
        .sort((a, b) => statusRank[a.status] - statusRank[b.status]),
    [items, isItemOnList],
  );
  const visibleSuggestions = showAllSuggestions
    ? suggestions
    : suggestions.slice(0, SUGGESTIONS_COLLAPSED);

  const setBusy = (setter: typeof setPurchasing, id: string, busy: boolean) =>
    setter((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });

  const openAdd = (tab?: 'inventory' | 'manual') =>
    navigation.navigate('AddShoppingItem', tab ? { tab } : undefined);

  const handlePurchase = async (entry: ShoppingListItem) => {
    const key = `buy:${entry.id}`;
    if (inFlight.current.has(key)) return;
    inFlight.current.add(key);
    setBusy(setPurchasing, entry.id, true);
    try {
      await markAsPurchased(entry);
      showToast(
        entry.itemId
          ? `Bought ${entry.name}. Marked Available and saved to history.`
          : `Bought ${entry.name}. Saved to history.`,
      );
    } catch (err) {
      // Someone (or a second tap) already completed it: nothing to report.
      if (!(err instanceof AlreadyPurchasedError)) {
        Alert.alert('Could not mark as purchased', getErrorMessage(err));
      }
    } finally {
      inFlight.current.delete(key);
      setBusy(setPurchasing, entry.id, false);
    }
  };

  const handleRemove = async (entry: ShoppingListItem) => {
    const ok = await confirmAction({
      title: `Remove ${entry.name}?`,
      message: 'It will be taken off your shopping list without being added to your history.',
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    try {
      await removeFromShoppingList(entry.id);
    } catch (err) {
      Alert.alert('Could not remove item', getErrorMessage(err));
    }
  };

  const addSuggestion = async (item: InventoryItem, silent = false) => {
    const key = `add:${item.id}`;
    if (inFlight.current.has(key)) return false;
    inFlight.current.add(key);
    setBusy(setAdding, item.id, true);
    try {
      await addInventoryItemToShoppingList(item);
      if (!silent) showToast(`Added ${item.name} to your list.`);
      return true;
    } catch (err) {
      if (err instanceof AlreadyOnListError) return true;
      Alert.alert('Could not add item', getErrorMessage(err));
      return false;
    } finally {
      inFlight.current.delete(key);
      setBusy(setAdding, item.id, false);
    }
  };

  const addAllSuggestions = async () => {
    const toAdd = [...suggestions];
    let added = 0;
    for (const item of toAdd) {
      if (await addSuggestion(item, true)) added += 1;
      else break; // stop at the first real error (already shown)
    }
    if (added > 0) showToast(`Added ${added} ${added === 1 ? 'item' : 'items'} to your list.`);
  };

  const header = (
    <View>
      {suggestions.length > 0 && (
        <View style={styles.suggestCard}>
          <View style={styles.suggestHeader}>
            <View style={styles.suggestIcon}>
              <Ionicons name="alert-circle" size={20} color={colors.warning} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.suggestTitle}>Running low</Text>
              <Text style={styles.suggestSubtitle}>
                {suggestions.length} {suggestions.length === 1 ? 'item needs' : 'items need'}{' '}
                restocking
              </Text>
            </View>
            {suggestions.length > 1 && (
              <Pressable
                onPress={addAllSuggestions}
                disabled={adding.size > 0}
                style={({ pressed }) => [styles.addAll, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Add all running-low items to the list"
              >
                <Text style={styles.addAllText}>Add all</Text>
              </Pressable>
            )}
          </View>

          {visibleSuggestions.map((item) => (
            <View key={item.id} style={styles.suggestRow}>
              <View style={styles.flex}>
                <Text style={styles.suggestName} numberOfLines={1}>
                  {item.name}
                </Text>
                <StatusBadge status={item.status} />
              </View>
              <Pressable
                onPress={() => addSuggestion(item)}
                disabled={adding.has(item.id)}
                style={({ pressed }) => [styles.addOne, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Add ${item.name} to shopping list`}
              >
                {adding.has(item.id) ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="add" size={18} color={colors.primary} />
                    <Text style={styles.addOneText}>Add</Text>
                  </>
                )}
              </Pressable>
            </View>
          ))}

          {suggestions.length > SUGGESTIONS_COLLAPSED && (
            <Pressable
              onPress={() => setShowAllSuggestions((v) => !v)}
              style={styles.showMore}
              accessibilityRole="button"
            >
              <Text style={styles.showMoreText}>
                {showAllSuggestions ? 'Show less' : `Show all ${suggestions.length}`}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {pending.length > 0 && (
        <View style={styles.listLabelRow}>
          <Text style={styles.listLabel}>To buy</Text>
          <Text style={styles.listHint}>Tap ◯ when you have bought it</Text>
        </View>
      )}
    </View>
  );

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your list…</Text>
        </View>
      );
    }
    if (error) {
      return (
        <EmptyState icon="cloud-offline-outline" title="Couldn't load your list" message={error} />
      );
    }
    return (
      <FlatList
        data={pending}
        keyExtractor={(entry) => entry.id}
        renderItem={({ item: entry }) => (
          <ShoppingItemCard
            item={entry}
            purchasing={purchasing.has(entry.id)}
            onPurchase={() => handlePurchase(entry)}
            onRemove={() => handleRemove(entry)}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState
            icon="cart-outline"
            title="Your list is empty"
            message={
              suggestions.length > 0
                ? 'Add the running-low items above, or anything else you need.'
                : 'Add items from your inventory, or type something new.'
            }
            actionLabel="Add items"
            onAction={() => openAdd()}
          />
        }
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={styles.title} accessibilityRole="header">
            Shopping List
          </Text>
          <Text style={styles.subtitle}>
            {loading
              ? ' '
              : pending.length === 0
                ? 'Nothing to buy right now'
                : `${pending.length} ${pending.length === 1 ? 'item' : 'items'} to buy`}
          </Text>
        </View>
        <Pressable
          onPress={() => openAdd()}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Add to shopping list"
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </Pressable>
      </View>

      <View style={styles.flex}>{renderBody()}</View>
      <Toast message={toast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  pressed: {
    opacity: 0.8,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: 96, // room for the toast
    flexGrow: 1,
  },
  suggestCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.warningLight,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow,
  },
  suggestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  suggestIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  suggestTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  suggestSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  addAll: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    justifyContent: 'center',
  },
  addAllText: {
    ...typography.label,
    color: colors.white,
  },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  suggestName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  addOne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 72,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  addOneText: {
    ...typography.label,
    color: colors.primary,
  },
  showMore: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  showMoreText: {
    ...typography.label,
    color: colors.primary,
  },
  listLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  listLabel: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  listHint: {
    ...typography.small,
    color: colors.textMuted,
  },
});
