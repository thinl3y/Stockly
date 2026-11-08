import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import ItemCard from '../components/ItemCard';
import SearchBar from '../components/SearchBar';
import { useInventory } from '../contexts/InventoryContext';
import { deleteItem } from '../services/inventoryService';
import { CATEGORIES, STOCK_STATUSES } from '../constants/inventory';
import { colors, radius, shadow, spacing, touchTarget, typography } from '../constants/theme';
import { confirmDeleteItem } from '../utils/confirm';
import { getErrorMessage } from '../utils/errors';
import type { Category, InventoryItem, StockStatus, TabScreenProps } from '../types';

type Props = TabScreenProps<'Inventory'>;

export default function InventoryScreen({ navigation, route }: Props) {
  const { items, loading, error, counts } = useInventory();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [status, setStatus] = useState<StockStatus | null>(null);

  // Lets other screens open Inventory pre-filtered, e.g. "Low Stock" from Home.
  const requestedStatus = route.params?.status;
  useEffect(() => {
    if (requestedStatus) {
      setStatus(requestedStatus);
      setCategory(null);
      setSearch('');
      navigation.setParams({ status: undefined });
    }
  }, [requestedStatus, navigation]);

  const query = search.trim().toLowerCase();

  // Items matching search + category (before the status filter), used for the status counts.
  const matchingSearchAndCategory = useMemo(
    () =>
      items.filter((item) => {
        if (category && item.category !== category) return false;
        if (!query) return true;
        return (
          item.name.toLowerCase().includes(query) ||
          (item.notes?.toLowerCase().includes(query) ?? false)
        );
      }),
    [items, category, query],
  );

  const visibleItems = useMemo(
    () =>
      status
        ? matchingSearchAndCategory.filter((item) => item.status === status)
        : matchingSearchAndCategory,
    [matchingSearchAndCategory, status],
  );

  const statusCounts = useMemo(() => {
    const result: Record<StockStatus, number> = { available: 0, low_stock: 0, out_of_stock: 0 };
    for (const item of matchingSearchAndCategory) result[item.status] += 1;
    return result;
  }, [matchingSearchAndCategory]);

  const filtersActive = !!query || category !== null || status !== null;
  const clearFilters = () => {
    setSearch('');
    setCategory(null);
    setStatus(null);
  };

  const openAdd = () => navigation.navigate('AddItem');
  const openDetails = (item: InventoryItem) =>
    navigation.navigate('ItemDetails', { itemId: item.id });

  const handleDelete = useCallback(async (item: InventoryItem) => {
    if (!(await confirmDeleteItem(item.name))) return;
    try {
      await deleteItem(item.id);
    } catch (err) {
      Alert.alert('Could not delete item', getErrorMessage(err));
    }
  }, []);

  const showActions = useCallback(
    (item: InventoryItem) => {
      const edit = () => navigation.navigate('EditItem', { itemId: item.id });
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            title: item.name,
            options: ['Edit', 'Delete', 'Cancel'],
            destructiveButtonIndex: 1,
            cancelButtonIndex: 2,
          },
          (index) => {
            if (index === 0) edit();
            if (index === 1) handleDelete(item);
          },
        );
      } else {
        Alert.alert(item.name, undefined, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item) },
          { text: 'Edit', onPress: edit },
        ]);
      }
    },
    [navigation, handleDelete],
  );

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your items…</Text>
        </View>
      );
    }
    if (error) {
      return (
        <EmptyState icon="cloud-offline-outline" title="Couldn't load your items" message={error} />
      );
    }
    if (items.length === 0) {
      return (
        <EmptyState
          icon="basket-outline"
          title="No items yet"
          message="Add the groceries, toiletries and supplies you keep at home to start tracking them."
          actionLabel="Add your first item"
          onAction={openAdd}
        />
      );
    }
    return (
      <FlatList
        data={visibleItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onPress={() => openDetails(item)}
            onMorePress={() => showActions(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="No matching items"
            message="Try a different search or clear the filters."
            actionLabel="Clear filters"
            actionIcon="close-circle-outline"
            onAction={clearFilters}
          />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={styles.title} accessibilityRole="header">
            Inventory
          </Text>
          <Text style={styles.subtitle}>
            {loading
              ? ' '
              : filtersActive
                ? `Showing ${visibleItems.length} of ${counts.total}`
                : `${counts.total} ${counts.total === 1 ? 'item' : 'items'}`}
          </Text>
        </View>
        <Pressable
          onPress={openAdd}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Add item"
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </Pressable>
      </View>

      {items.length > 0 && !loading && (
        <View style={styles.filters}>
          <View style={styles.searchWrap}>
            <SearchBar value={search} onChangeText={setSearch} placeholder="Search items or notes" />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            keyboardShouldPersistTaps="handled"
          >
            <Chip label="All" selected={category === null} onPress={() => setCategory(null)} />
            {CATEGORIES.map((c) => (
              <Chip
                key={c.value}
                label={c.value}
                icon={c.icon}
                selected={category === c.value}
                onPress={() => setCategory(category === c.value ? null : c.value)}
              />
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            keyboardShouldPersistTaps="handled"
          >
            <Chip
              label="Any status"
              selected={status === null}
              onPress={() => setStatus(null)}
              count={matchingSearchAndCategory.length}
            />
            {STOCK_STATUSES.map((s) => (
              <Chip
                key={s.value}
                label={s.label}
                accent={s.color}
                selected={status === s.value}
                onPress={() => setStatus(status === s.value ? null : s.value)}
                count={statusCounts[s.value]}
              />
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.flex}>{renderBody()}</View>
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
    opacity: 0.85,
  },
  filters: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  searchWrap: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xs,
  },
  chipRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
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
});
