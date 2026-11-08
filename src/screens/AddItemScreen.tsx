import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import AppButton from '../components/AppButton';
import AppTextInput, { TextInputHandle } from '../components/AppTextInput';
import CategorySelector from '../components/CategorySelector';
import EmptyState from '../components/EmptyState';
import FormMessage from '../components/FormMessage';
import FormScrollView from '../components/FormScrollView';
import QuantityUnitFields from '../components/QuantityUnitFields';
import StatusSelector from '../components/StatusSelector';
import { useInventory } from '../contexts/InventoryContext';
import { addItem, updateItem } from '../services/inventoryService';
import { PENDING_SYNC_MESSAGE } from '../services/firestoreHelpers';
import { colors, radius, shadow, spacing, typography } from '../constants/theme';
import { confirmAction } from '../utils/confirm';
import { getErrorMessage } from '../utils/errors';
import { isNonEmpty, parseOptionalQuantity } from '../utils/validation';
import type { AppScreenProps, Category, InventoryItem, StockStatus } from '../types';

type Props = AppScreenProps<'AddItem' | 'EditItem'>;

const LIMITS = { name: 60, unit: 20, notes: 300, quantity: 100000 };

interface FormValues {
  name: string;
  category: Category | null;
  status: StockStatus | null;
  quantity: string;
  unit: string;
  notes: string;
}

type FieldErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY_FORM: FormValues = {
  name: '',
  category: null,
  status: 'available',
  quantity: '',
  unit: '',
  notes: '',
};

function itemToForm(item: InventoryItem): FormValues {
  return {
    name: item.name,
    category: item.category,
    status: item.status,
    quantity: item.quantity === null ? '' : String(item.quantity),
    unit: item.unit ?? '',
    notes: item.notes ?? '',
  };
}

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  const name = values.name.trim();
  if (!isNonEmpty(name)) errors.name = 'Please enter the item name.';
  else if (name.length > LIMITS.name) errors.name = `Keep the name under ${LIMITS.name} characters.`;

  if (!values.category) errors.category = 'Please choose a category.';
  if (!values.status) errors.status = 'Please choose a stock status.';

  const quantity = parseOptionalQuantity(values.quantity);
  if (Number.isNaN(quantity)) errors.quantity = 'Enter a number, e.g. 2 or 1.5.';
  else if (quantity !== null && quantity > LIMITS.quantity) errors.quantity = 'That quantity is too large.';

  if (values.unit.trim().length > LIMITS.unit) errors.unit = `Max ${LIMITS.unit} characters.`;
  if (values.notes.trim().length > LIMITS.notes) errors.notes = `Max ${LIMITS.notes} characters.`;
  return errors;
}

/**
 * Add Item and Edit Item share this form. The route name decides the mode:
 * "AddItem" creates a new item, "EditItem" loads and updates an existing one.
 */
export default function AddItemScreen({ navigation, route }: Props) {
  const isEdit = route.name === 'EditItem';
  const itemId = isEdit ? (route.params as { itemId: string }).itemId : null;

  const { items, loading, getItemById } = useInventory();
  const existing = itemId ? getItemById(itemId) : undefined;

  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [initial, setInitial] = useState<FormValues>(EMPTY_FORM);
  const [loaded, setLoaded] = useState(!isEdit);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savingRef = useRef(false);

  const quantityRef = useRef<TextInputHandle>(null);
  const notesRef = useRef<TextInputHandle>(null);

  // Edit mode: fill the form once, when the item is first available.
  useEffect(() => {
    if (isEdit && !loaded && existing) {
      const form = itemToForm(existing);
      setValues(form);
      setInitial(form);
      setLoaded(true);
    }
  }, [isEdit, loaded, existing]);

  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  // Ask before throwing away unsaved changes (back button, swipe, Cancel).
  usePreventRemove(dirty && !saved && !saving, ({ data }) => {
    confirmAction({
      title: 'Discard changes?',
      message: 'You have unsaved changes to this item.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      destructive: true,
    }).then((discard) => {
      if (discard) navigation.dispatch(data.action);
    });
  });

  // Close the screen after a successful save (once the guard is released).
  useEffect(() => {
    if (saved) navigation.goBack();
  }, [saved, navigation]);

  const setField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (formError) setFormError(null);
  };

  const handleSave = async () => {
    if (savingRef.current) return; // ignore double taps

    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError('Please fix the highlighted fields.');
      return;
    }

    const name = values.name.trim();

    // Gentle duplicate check when adding a new item.
    if (!isEdit) {
      const duplicate = items.find((i) => i.name.trim().toLowerCase() === name.toLowerCase());
      if (duplicate) {
        const addAnyway = await confirmAction({
          title: `You already have "${duplicate.name}"`,
          message: 'Do you want to add another item with the same name?',
          confirmLabel: 'Add anyway',
        });
        if (!addAnyway) return;
      }
    }

    const input = {
      name,
      category: values.category as Category,
      status: values.status as StockStatus,
      quantity: parseOptionalQuantity(values.quantity),
      unit: values.unit,
      notes: values.notes,
    };

    savingRef.current = true;
    setSaving(true);
    setFormError(null);
    try {
      const result = isEdit && itemId ? await updateItem(itemId, input) : (await addItem(input)).result;
      if (result === 'pending') Alert.alert('Saved offline', PENDING_SYNC_MESSAGE);
      setSaved(true);
    } catch (error) {
      setFormError(getErrorMessage(error));
      savingRef.current = false;
      setSaving(false);
    }
  };

  // ----- Edit mode: loading / item missing -----
  if (isEdit && !loaded) {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    return (
      <View style={styles.center}>
        <EmptyState
          icon="help-circle-outline"
          title="Item not found"
          message="It may have been deleted."
          actionLabel="Go back"
          actionIcon="arrow-back"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <FormScrollView>
      <FormMessage type="error" message={formError} />

      <View style={styles.card}>
        <AppTextInput
          label="Item name *"
          icon="pricetag-outline"
          placeholder="e.g. Rice, Toothpaste, Dish soap"
          value={values.name}
          onChangeText={(text) => setField('name', text)}
          error={errors.name}
          autoCapitalize="sentences"
          maxLength={LIMITS.name}
          returnKeyType="next"
          editable={!saving}
          autoFocus={!isEdit}
          onSubmitEditing={() => quantityRef.current?.focus()}
          submitBehavior="blurAndSubmit"
        />

        <Text style={styles.label}>Category *</Text>
        <CategorySelector value={values.category} onChange={(c) => setField('category', c)} />
        {errors.category ? <Text style={styles.error}>{errors.category}</Text> : null}

        <Text style={[styles.label, styles.spaced]}>Stock status *</Text>
        <StatusSelector
          value={values.status}
          onChange={(s) => setField('status', s)}
          disabled={saving}
        />
        {errors.status ? <Text style={styles.error}>{errors.status}</Text> : null}
      </View>

      <Text style={styles.sectionTitle}>Optional details</Text>
      <View style={styles.card}>
        <QuantityUnitFields
          quantity={values.quantity}
          unit={values.unit}
          onChangeQuantity={(text) => setField('quantity', text)}
          onChangeUnit={(text) => setField('unit', text)}
          quantityError={errors.quantity}
          unitError={errors.unit}
          editable={!saving}
          quantityRef={quantityRef}
          onUnitSubmit={() => notesRef.current?.focus()}
        />

        <AppTextInput
          ref={notesRef}
          label="Notes"
          icon="document-text-outline"
          placeholder="e.g. Brand, size, where it's kept"
          value={values.notes}
          onChangeText={(text) => setField('notes', text)}
          error={errors.notes}
          multiline
          maxLength={LIMITS.notes}
          editable={!saving}
          style={styles.notes}
        />
        <Text style={styles.counter}>
          {values.notes.length}/{LIMITS.notes}
        </Text>
      </View>

      <View style={styles.actions}>
        <AppButton
          title="Cancel"
          variant="secondary"
          onPress={() => navigation.goBack()}
          disabled={saving}
          fullWidth={false}
          style={styles.flex}
        />
        <AppButton
          title={isEdit ? 'Save Changes' : 'Save Item'}
          icon="checkmark"
          onPress={handleSave}
          loading={saving}
          fullWidth={false}
          style={styles.flex}
        />
      </View>
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
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
  spaced: {
    marginTop: spacing.xl,
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
  notes: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  counter: {
    ...typography.small,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: -spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
