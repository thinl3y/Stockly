import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../components/EmptyState';
import PurchaseInsights from '../components/PurchaseInsights';
import SearchBar from '../components/SearchBar';
import SegmentedControl from '../components/SegmentedControl';
import Toast, { useToast } from '../components/Toast';
import { useInventory } from '../contexts/InventoryContext';
import { useShopping } from '../contexts/ShoppingContext';
import { usePurchaseHistory } from '../hooks/usePurchaseHistory';
import {
  addInventoryItemToShoppingList,
  addManualShoppingItem,
  AlreadyOnListError,
} from '../services/shoppingService';
import { getCategoryIcon } from '../constants/inventory';
import { colors, radius, shadow, spacing, touchTarget, typography } from '../constants/theme';
import { getErrorMessage } from '../utils/errors';
import { dayKey, formatDayLabel, formatQuantity, formatTime } from '../utils/format';
import type { PurchaseRecord, TabScreenProps } from '../types';

type Props = TabScreenProps<'History'>;
type SortOrder = 'newest' | 'oldest';

interface DaySection {
  key: string;
  title: string;
  data: PurchaseRecord[];
}

export default function PurchaseHistoryScreen({ navigation }: Props) {
  const { getItemById } = useInventory();
  const { isItemOnList, hasPendingName } = useShopping();

  const { records, loading, error } = usePurchaseHistory();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOrder>('newest');
  const [rebuying, setRebuying] = useState<string | null>(null);
  const [toast, showToast] = useToast();
  const busy = useRef(false);

  const query = search.trim().toLowerCase();

  const sections = useMemo<DaySection[]>(() => {
    const filtered = query ? records.filter((r) => r.name.toLowerCase().includes(query)) : records;
    // Records arrive newest-first; reverse for oldest-first.
    const ordered = sort === 'newest' ? filtered : [...filtered].reverse();

    const result: DaySection[] = [];
    for (const record of ordered) {
      const key = record.purchasedAt ? dayKey(record.purchasedAt) : 'pending';
      const last = result[result.length - 1];
      if (last && last.key === key) last.data.push(record);
      else result.push({ key, title: formatDayLabel(record.purchasedAt), data: [record] });
    }
    return result;
  }, [records, query, sort]);

  const shownCount = sections.reduce((n, s) => n + s.data.length, 0);

  /** Puts a past purchase back on the shopping list. */
  const buyAgain = async (record: PurchaseRecord) => {
    if (busy.current) return;
    const linked = record.itemId ? getItemById(record.itemId) : undefined;
    if ((linked && isItemOnList(linked.id)) || hasPendingName(record.name)) {
      showToast(`${record.name} is already on your list.`);
      return;
    }
    busy.current = true;
    setRebuying(record.id);
    const amount = { quantity: record.quantity, unit: record.unit };
    try {
      if (linked) await addInventoryItemToShoppingList(linked, amount);
      else await addManualShoppingItem({ name: record.name, category: record.category, ...amount });
      showToast(`Added ${record.name} to your shopping list.`);
    } catch (err) {
      if (err instanceof AlreadyOnListError) showToast(err.message);
      else Alert.alert('Could not add item', getErrorMessage(err));
    } finally {
      busy.current = false;
      setRebuying(null);
    }
  };

  const renderRecord = ({ item: record }: { item: PurchaseRecord }) => {
    const quantity = formatQuantity(record.quantity, record.unit);
    return (
      <View style={styles.row}>
        <View style={styles.rowIcon}>
          <Ionicons name={getCategoryIcon(record.category)} size={20} color={colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.name} numberOfLines={1}>
            {record.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {record.category}
            {quantity ? `  ·  ${quantity}` : ''}
          </Text>
        </View>
        <Text style={styles.time}>{formatTime(record.purchasedAt)}</Text>
        <Pressable
          onPress={() => buyAgain(record)}
          disabled={rebuying !== null}
          style={({ pressed }) => [styles.again, pressed && styles.againPressed]}
          accessibilityRole="button"
          accessibilityLabel={`Buy ${record.name} again`}
        >
          {rebuying === record.id ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="cart-outline" size={20} color={colors.primary} />
          )}
        </Pressable>
      </View>
    );
  };

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your history…</Text>
        </View>
      );
    }
    if (error) {
      return (
        <EmptyState icon="cloud-offline-outline" title="Couldn't load your history" message={error} />
      );
    }
    if (records.length === 0) {
      return (
        <EmptyState
          icon="receipt-outline"
          title="No purchases yet"
          message="When you tick items off your shopping list, they are saved here with the date you bought them."
          actionLabel="Open shopping list"
          actionIcon="cart-outline"
          onAction={() => navigation.navigate('ShoppingList')}
        />
      );
    }
    return (
      <SectionList
        sections={sections}
        keyExtractor={(r) => r.id}
        renderItem={renderRecord}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>
              {section.data.length} {section.data.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
        )}
        ListHeaderComponent={query ? undefined : <PurchaseInsights records={records} />}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="No matching purchases"
            message="Try a different name."
            actionLabel="Clear search"
            actionIcon="close-circle-outline"
            onAction={() => setSearch('')}
          />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Purchase History
        </Text>
        <Text style={styles.subtitle}>
          {loading
            ? ' '
            : query
              ? `Showing ${shownCount} of ${records.length}`
              : `${records.length} ${records.length === 1 ? 'purchase' : 'purchases'}`}
        </Text>
      </View>

      {records.length > 0 && !loading && (
        <View style={styles.controls}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search by item name" />
          <SegmentedControl<SortOrder>
            value={sort}
            onChange={setSort}
            options={[
              { value: 'newest', label: 'Newest first', icon: 'arrow-down' },
              { value: 'oldest', label: 'Oldest first', icon: 'arrow-up' },
            ]}
          />
        </View>
      )}

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
  controls: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
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
    paddingBottom: 96,
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textPrimary,
  },
  sectionCount: {
    ...typography.small,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    marginBottom: spacing.sm,
    ...shadow,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  time: {
    ...typography.small,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  again: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  againPressed: {
    backgroundColor: colors.primaryLight,
  },
});
