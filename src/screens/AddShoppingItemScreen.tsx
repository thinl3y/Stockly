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
import AppButton from '../components/AppButton';
import AppTextInput from '../components/AppTextInput';
import CategorySelector from '../components/CategorySelector';
import EmptyState from '../components/EmptyState';
import FormMessage from '../components/FormMessage';
import FormScrollView from '../components/FormScrollView';
import QuantityUnitFields, { UNIT_MAX_LENGTH } from '../components/QuantityUnitFields';
import SearchBar from '../components/SearchBar';
import SegmentedControl from '../components/SegmentedControl';
import StatusBadge from '../components/StatusBadge';
import Toast, { useToast } from '../components/Toast';
import { useInventory } from '../contexts/InventoryContext';
import { useShopping } from '../contexts/ShoppingContext';
import {
  addInventoryItemToShoppingList,
  addManualShoppingItem,
  AlreadyOnListError,
} from '../services/shoppingService';
import { PENDING_SYNC_MESSAGE } from '../services/firestoreHelpers';
import { getCategoryIcon } from '../constants/inventory';
import { colors, radius, shadow, spacing, typography } from '../constants/theme';
import { getErrorMessage } from '../utils/errors';
import { isNonEmpty, parseOptionalQuantity } from '../utils/validation';
import type { AppScreenProps, Category, InventoryItem } from '../types';

type Props = AppScreenProps<'AddShoppingItem'>;
type Tab = 'inventory' | 'manual';

const statusRank = { out_of_stock: 0, low_stock: 1, available: 2 } as const;
const NAME_MAX = 60;

/* ------------------------------------------------------------------ */
/* Tab 1: pick from inventory                                          */
/* ------------------------------------------------------------------ */

function FromInventory({ onSwitchToManual }: { onSwitchToManual: () => void }) {
  const { items } = useInventory();
  const { isItemOnList } = useShopping();
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState<string | null>(null);
  const [toast, showToast] = useToast();
  const busy = useRef(false);

  // Out of stock first, then low stock, then available; A–Z within each.
  const sorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((i) => !q || i.name.toLowerCase().includes(q))
      .sort(
        (a, b) =>
          statusRank[a.status] - statusRank[b.status] ||
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      );
  }, [items, search]);

  const add = async (item: InventoryItem) => {
    if (busy.current) return;
    busy.current = true;
    setAdding(item.id);
    try {
      await addInventoryItemToShoppingList(item);
      showToast(`Added ${item.name}`);
    } catch (err) {
      if (err instanceof AlreadyOnListError) showToast(err.message);
      else Alert.alert('Could not add item', getErrorMessage(err));
    } finally {
      busy.current = false;
      setAdding(null);
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon="layers-outline"
        title="Your inventory is empty"
        message="Add something new to your shopping list instead."
        actionLabel="Type a new item"
        actionIcon="create-outline"
        onAction={onSwitchToManual}
      />
    );
  }

  return (
    <View style={styles.flex}>
      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search your inventory" />
      </View>
      <FlatList
        data={sorted}
        keyExtractor={(i) => i.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.pickList}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title="No matching items"
            message="Not in your inventory? Add it as a new item."
            actionLabel="Type a new item"
            actionIcon="create-outline"
            onAction={onSwitchToManual}
          />
        }
        renderItem={({ item }) => {
          const onList = isItemOnList(item.id);
          const isAdding = adding === item.id;
          return (
            <View style={styles.pickRow}>
              <View style={styles.pickIcon}>
                <Ionicons name={getCategoryIcon(item.category)} size={20} color={colors.primary} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.pickName} numberOfLines={1}>
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
                  onPress={() => add(item)}
                  disabled={adding !== null}
                  style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${item.name} to shopping list`}
                >
                  {isAdding ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Ionicons name="add" size={18} color={colors.white} />
                      <Text style={styles.addButtonText}>Add</Text>
                    </>
                  )}
                </Pressable>
              )}
            </View>
          );
        }}
      />
      <Toast message={toast} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Tab 2: type a new item                                              */
/* ------------------------------------------------------------------ */

interface ManualErrors {
  name?: string;
  category?: string;
  quantity?: string;
  unit?: string;
}

function ManualEntry({ onDone }: { onDone: () => void }) {
  const { items } = useInventory();
  const { hasPendingName, isItemOnList } = useShopping();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [errors, setErrors] = useState<ManualErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  // If the typed name matches an inventory item, offer to link it.
  const match = useMemo(() => {
    const q = name.trim().toLowerCase();
    return q ? items.find((i) => i.name.trim().toLowerCase() === q) : undefined;
  }, [items, name]);

  const clearError = (field: keyof ManualErrors) => {
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    if (formError) setFormError(null);
  };

  const handleAdd = async () => {
    if (savingRef.current) return;

    const found: ManualErrors = {};
    const trimmed = name.trim();
    const qty = parseOptionalQuantity(quantity);
    if (!isNonEmpty(trimmed)) found.name = 'Please enter what you need to buy.';
    else if (trimmed.length > NAME_MAX) found.name = `Keep the name under ${NAME_MAX} characters.`;
    if (!category && !match) found.category = 'Please choose a category.';
    if (Number.isNaN(qty)) found.quantity = 'Enter a number, e.g. 2 or 1.5.';
    if (unit.trim().length > UNIT_MAX_LENGTH) found.unit = `Max ${UNIT_MAX_LENGTH} characters.`;
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    // Duplicate check against what is already on the list.
    if ((match && isItemOnList(match.id)) || hasPendingName(trimmed)) {
      setFormError(`${match?.name ?? trimmed} is already on your shopping list.`);
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setFormError(null);
    const amount = { quantity: qty, unit: unit.trim() || null };
    try {
      if (match) {
        // Same name as an inventory item: link it, so buying it later
        // also marks the inventory item as Available.
        await addInventoryItemToShoppingList(match, amount);
      } else {
        const result = await addManualShoppingItem({
          name: trimmed,
          category: category as Category,
          ...amount,
        });
        if (result === 'pending') Alert.alert('Saved offline', PENDING_SYNC_MESSAGE);
      }
      onDone();
    } catch (err) {
      setFormError(
        err instanceof AlreadyOnListError ? err.message : getErrorMessage(err),
      );
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <FormScrollView>
      <FormMessage type="error" message={formError} />
      <View style={styles.card}>
        <AppTextInput
          label="What do you need? *"
          icon="pricetag-outline"
          placeholder="e.g. Bread, Light bulbs"
          value={name}
          onChangeText={(t) => {
            setName(t);
            clearError('name');
          }}
          error={errors.name}
          autoCapitalize="sentences"
          maxLength={NAME_MAX}
          autoFocus
          editable={!saving}
          returnKeyType="next"
          submitBehavior="blurAndSubmit"
        />

        {match ? (
          <FormMessage
            type="success"
            message={`"${match.name}" is in your inventory. It will be linked, so buying it marks it Available.`}
          />
        ) : (
          <>
            <Text style={styles.label}>Category *</Text>
            <CategorySelector
              value={category}
              onChange={(c) => {
                setCategory(c);
                clearError('category');
              }}
            />
            {errors.category ? <Text style={styles.error}>{errors.category}</Text> : null}
          </>
        )}
      </View>

      <Text style={styles.sectionTitle}>How much? (optional)</Text>
      <View style={styles.card}>
        <QuantityUnitFields
          quantity={quantity}
          unit={unit}
          onChangeQuantity={(t) => {
            setQuantity(t);
            clearError('quantity');
          }}
          onChangeUnit={(t) => {
            setUnit(t);
            clearError('unit');
          }}
          quantityError={errors.quantity}
          unitError={errors.unit}
          editable={!saving}
          quantityLabel="Amount to buy"
        />
      </View>

      <AppButton
        title="Add to Shopping List"
        icon="cart-outline"
        onPress={handleAdd}
        loading={saving}
        style={styles.submit}
      />
    </FormScrollView>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function AddShoppingItemScreen({ navigation, route }: Props) {
  const { items } = useInventory();
  const [tab, setTab] = useState<Tab>(
    route.params?.tab ?? (items.length > 0 ? 'inventory' : 'manual'),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.tabs}>
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'inventory', label: 'From inventory', icon: 'layers-outline' },
            { value: 'manual', label: 'New item', icon: 'create-outline' },
          ]}
        />
      </View>

      <View style={styles.flex}>
        {tab === 'inventory' ? (
          <FromInventory onSwitchToManual={() => setTab('manual')} />
        ) : (
          <ManualEntry onDone={() => navigation.goBack()} />
        )}
      </View>

      {tab === 'inventory' && (
        <View style={styles.footer}>
          <AppButton title="Done" onPress={() => navigation.goBack()} />
        </View>
      )}
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
  tabs: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchWrap: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  pickList: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 96,
    flexGrow: 1,
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow,
  },
  pickIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  pickName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  onList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
  },
  onListText: {
    ...typography.label,
    color: colors.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: 76,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  addButtonText: {
    ...typography.label,
    color: colors.white,
  },
  pressed: {
    opacity: 0.85,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.dangerText,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  submit: {
    marginTop: spacing.xl,
  },
});
