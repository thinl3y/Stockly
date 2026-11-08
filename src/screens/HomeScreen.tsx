import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../components/AppButton';
import StatusBadge from '../components/StatusBadge';
import SummaryCard from '../components/SummaryCard';
import Toast, { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useInventory } from '../contexts/InventoryContext';
import { useShopping } from '../contexts/ShoppingContext';
import { usePurchaseHistory } from '../hooks/usePurchaseHistory';
import { addInventoryItemToShoppingList, AlreadyOnListError } from '../services/shoppingService';
import { getCategoryIcon, IoniconName } from '../constants/inventory';
import { colors, radius, shadow, spacing, touchTarget, typography } from '../constants/theme';
import { getErrorMessage } from '../utils/errors';
import { formatToday, getFirstName, getGreeting, getInitials } from '../utils/greeting';
import { countThisMonth } from '../utils/stats';
import type { InventoryItem, TabScreenProps } from '../types';

type Props = TabScreenProps<'Home'>;

const ATTENTION_LIMIT = 5;
const statusRank = { out_of_stock: 0, low_stock: 1, available: 2 } as const;

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: IoniconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quick, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.quickIcon}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <Text style={styles.quickLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }: Props) {
  const { displayName } = useAuth();
  const { items, counts, loading: itemsLoading, error: itemsError } = useInventory();
  const { pending, loading: shoppingLoading, isItemOnList } = useShopping();
  const { records, loading: historyLoading } = usePurchaseHistory();

  const [adding, setAdding] = useState<string | null>(null);
  const [toast, showToast] = useToast();
  const busy = useRef(false);

  const firstName = getFirstName(displayName);
  const now = new Date();

  // Out of stock first, then low stock.
  const attention = useMemo(
    () =>
      items
        .filter((i) => i.status !== 'available')
        .sort((a, b) => statusRank[a.status] - statusRank[b.status]),
    [items],
  );
  const purchasesThisMonth = useMemo(() => countThisMonth(records), [records]);

  const openInventory = (status?: 'available' | 'low_stock' | 'out_of_stock') =>
    navigation.navigate('Inventory', status ? { status } : undefined);

  const addToList = async (item: InventoryItem) => {
    if (busy.current) return;
    busy.current = true;
    setAdding(item.id);
    try {
      await addInventoryItemToShoppingList(item);
      showToast(`Added ${item.name} to your shopping list.`);
    } catch (err) {
      if (err instanceof AlreadyOnListError) showToast(err.message);
      else Alert.alert('Could not add item', getErrorMessage(err));
    } finally {
      busy.current = false;
      setAdding(null);
    }
  };

  const inStockPercent = counts.total > 0 ? Math.round((counts.available / counts.total) * 100) : 0;

  const renderOverview = () => {
    if (itemsLoading) {
      return (
        <View style={[styles.card, styles.loadingCard]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.muted}>Loading your household…</Text>
        </View>
      );
    }
    if (itemsError) {
      return (
        <View style={[styles.card, styles.errorCard]}>
          <Ionicons name="cloud-offline-outline" size={22} color={colors.dangerText} />
          <Text style={styles.errorText}>{itemsError}</Text>
        </View>
      );
    }
    if (counts.total === 0) {
      return (
        <View style={[styles.card, styles.welcome]}>
          <View style={styles.welcomeIcon}>
            <Ionicons name="basket" size={32} color={colors.white} />
          </View>
          <Text style={styles.welcomeTitle}>Let's stock up</Text>
          <Text style={styles.welcomeText}>
            Add the groceries, toiletries and supplies you keep at home. Stockly will show what is
            running low and help you build your shopping list.
          </Text>
          <AppButton
            title="Add your first item"
            icon="add"
            onPress={() => navigation.navigate('AddItem')}
            style={styles.welcomeButton}
          />
        </View>
      );
    }
    return (
      <>
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <SummaryCard
              label="Total Items"
              value={counts.total}
              icon="layers"
              onPress={() => openInventory()}
            />
            <SummaryCard
              label="Available"
              value={counts.available}
              icon="checkmark-circle"
              onPress={() => openInventory('available')}
            />
          </View>
          <View style={styles.gridRow}>
            <SummaryCard
              label="Low Stock"
              value={counts.low_stock}
              icon="alert-circle"
              color={colors.warning}
              tint={colors.warningLight}
              onPress={() => openInventory('low_stock')}
            />
            <SummaryCard
              label="Out of Stock"
              value={counts.out_of_stock}
              icon="close-circle"
              color={colors.danger}
              tint={colors.dangerLight}
              onPress={() => openInventory('out_of_stock')}
            />
          </View>
        </View>

        {/* Stock health: share of items in each status */}
        <View
          style={[styles.card, styles.health]}
          accessibilityLabel={`${inStockPercent} percent of items are available`}
        >
          <View style={styles.healthHeader}>
            <Text style={styles.healthTitle}>Stock health</Text>
            <Text style={styles.healthValue}>{inStockPercent}% available</Text>
          </View>
          <View style={styles.bar}>
            {counts.available > 0 && (
              <View style={[styles.barPart, { flex: counts.available, backgroundColor: colors.primary }]} />
            )}
            {counts.low_stock > 0 && (
              <View style={[styles.barPart, { flex: counts.low_stock, backgroundColor: colors.warning }]} />
            )}
            {counts.out_of_stock > 0 && (
              <View style={[styles.barPart, { flex: counts.out_of_stock, backgroundColor: colors.danger }]} />
            )}
          </View>
        </View>
      </>
    );
  };

  const shoppingPreview = pending.slice(0, 3).map((p) => p.name).join(', ');
  const moreCount = pending.length - 3;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View style={styles.flex}>
            <Text style={styles.greeting}>{getGreeting(now)}!</Text>
            <Text style={styles.name} numberOfLines={1} accessibilityRole="header">
              {firstName || 'Welcome'}
            </Text>
            <Text style={styles.date}>{formatToday(now)}</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('Profile')}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
          >
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          </Pressable>
        </View>

        {renderOverview()}

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.quickRow}>
          <QuickAction
            icon="add-circle-outline"
            label="Add New Item"
            onPress={() => navigation.navigate('AddItem')}
          />
          <QuickAction icon="layers-outline" label="View Inventory" onPress={() => openInventory()} />
          <QuickAction
            icon="cart-outline"
            label="Open Shopping List"
            onPress={() => navigation.navigate('ShoppingList')}
          />
        </View>

        {/* Shopping list summary */}
        <Pressable
          onPress={() => navigation.navigate('ShoppingList')}
          style={({ pressed }) => [styles.card, styles.shopping, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Shopping list, ${pending.length} items waiting to be purchased`}
        >
          <View style={styles.shoppingIcon}>
            <Ionicons name="cart" size={24} color={colors.white} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.shoppingTitle}>
              {shoppingLoading
                ? 'Shopping list'
                : pending.length === 0
                  ? 'Nothing to buy right now'
                  : `${pending.length} ${pending.length === 1 ? 'item' : 'items'} to buy`}
            </Text>
            <Text style={styles.shoppingText} numberOfLines={1}>
              {pending.length === 0
                ? 'Your shopping list is empty.'
                : `${shoppingPreview}${moreCount > 0 ? ` +${moreCount} more` : ''}`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>

        {/* Needs attention */}
        {counts.total > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitleInline}>Needs attention</Text>
              {attention.length > 0 && (
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{attention.length}</Text>
                </View>
              )}
            </View>

            {attention.length === 0 ? (
              <View style={[styles.card, styles.allGood]}>
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                <Text style={styles.allGoodText}>
                  All stocked up. Nothing is running low right now.
                </Text>
              </View>
            ) : (
              <View style={[styles.card, styles.attentionCard]}>
                {attention.slice(0, ATTENTION_LIMIT).map((item, index) => {
                  const onList = isItemOnList(item.id);
                  return (
                    <View key={item.id}>
                      {index > 0 && <View style={styles.divider} />}
                      <Pressable
                        onPress={() => navigation.navigate('ItemDetails', { itemId: item.id })}
                        style={({ pressed }) => [styles.attentionRow, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel={`${item.name}, open details`}
                      >
                        <View style={styles.attentionIcon}>
                          <Ionicons
                            name={getCategoryIcon(item.category)}
                            size={20}
                            color={colors.primary}
                          />
                        </View>
                        <View style={styles.flex}>
                          <Text style={styles.attentionName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <StatusBadge status={item.status} />
                        </View>
                        {onList ? (
                          <View style={styles.onList} accessibilityLabel={`${item.name} is on your list`}>
                            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                            <Text style={styles.onListText}>On list</Text>
                          </View>
                        ) : (
                          <Pressable
                            onPress={() => addToList(item)}
                            disabled={adding !== null}
                            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
                            accessibilityRole="button"
                            accessibilityLabel={`Add ${item.name} to shopping list`}
                          >
                            {adding === item.id ? (
                              <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                              <>
                                <Ionicons name="cart-outline" size={16} color={colors.primary} />
                                <Text style={styles.addButtonText}>Add</Text>
                              </>
                            )}
                          </Pressable>
                        )}
                      </Pressable>
                    </View>
                  );
                })}
                {attention.length > ATTENTION_LIMIT && (
                  <Pressable
                    onPress={() => openInventory()}
                    style={styles.seeAll}
                    accessibilityRole="button"
                  >
                    <Text style={styles.seeAllText}>
                      See all {attention.length} in Inventory
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </>
        )}

        {/* Purchases this month (basic purchase statistics) */}
        <Pressable
          onPress={() => navigation.navigate('History')}
          style={({ pressed }) => [styles.card, styles.month, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`${purchasesThisMonth} purchases this month. Open history.`}
        >
          <View style={styles.monthIcon}>
            <Ionicons name="receipt-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.monthValue}>
              {historyLoading ? '–' : purchasesThisMonth}{' '}
              <Text style={styles.monthUnit}>
                {purchasesThisMonth === 1 ? 'purchase' : 'purchases'} this month
              </Text>
            </Text>
            <Text style={styles.muted}>See your history and most-bought items</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
      </ScrollView>
      <Toast message={toast} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.xl,
    paddingBottom: 96,
  },
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow,
  },
  muted: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  greeting: {
    ...typography.body,
    color: colors.textSecondary,
  },
  name: {
    ...typography.h1,
    fontSize: 28,
    color: colors.textPrimary,
  },
  date: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  avatarText: {
    ...typography.h3,
    color: colors.white,
  },
  loadingCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  errorCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.dangerLight,
  },
  errorText: {
    ...typography.body,
    color: colors.dangerText,
    flex: 1,
  },
  welcome: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  welcomeTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  welcomeText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  welcomeButton: {
    marginTop: spacing.lg,
  },
  grid: {
    gap: spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  health: {
    marginTop: spacing.md,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  healthTitle: {
    ...typography.label,
    color: colors.textPrimary,
  },
  healthValue: {
    ...typography.label,
    color: colors.primary,
  },
  bar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: colors.border,
    gap: 2,
  },
  barPart: {
    height: '100%',
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionTitleInline: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  countPill: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillText: {
    ...typography.small,
    fontWeight: '700',
    color: colors.warningText,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quick: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    ...shadow,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickLabel: {
    ...typography.label,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  shopping: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  shoppingIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shoppingTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  shoppingText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  allGood: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  allGoodText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  attentionCard: {
    paddingVertical: spacing.xs,
  },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  attentionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  attentionName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  onList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onListText: {
    ...typography.label,
    color: colors.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 72,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  addButtonText: {
    ...typography.label,
    color: colors.primary,
  },
  seeAll: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchTarget,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  seeAllText: {
    ...typography.label,
    color: colors.primary,
  },
  month: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  monthIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthValue: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  monthUnit: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
