import React, { Ref, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import AppTextInput, { TextInputHandle } from './AppTextInput';
import Chip from './Chip';
import { UNIT_SUGGESTIONS } from '../constants/inventory';
import { spacing } from '../constants/theme';

export const UNIT_MAX_LENGTH = 20;

interface QuantityUnitFieldsProps {
  quantity: string;
  unit: string;
  onChangeQuantity: (text: string) => void;
  onChangeUnit: (text: string) => void;
  quantityError?: string;
  unitError?: string;
  editable?: boolean;
  quantityLabel?: string;
  quantityRef?: Ref<TextInputHandle>;
  /** Called when "next" is pressed on the unit keyboard. */
  onUnitSubmit?: () => void;
}

/** Optional quantity + unit with quick unit chips (pcs, pack, kg, …). */
export default function QuantityUnitFields({
  quantity,
  unit,
  onChangeQuantity,
  onChangeUnit,
  quantityError,
  unitError,
  editable = true,
  quantityLabel = 'Quantity',
  quantityRef,
  onUnitSubmit,
}: QuantityUnitFieldsProps) {
  const unitRef = useRef<TextInputHandle>(null);

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.quantity}>
          <AppTextInput
            ref={quantityRef}
            label={quantityLabel}
            placeholder="e.g. 2"
            value={quantity}
            onChangeText={onChangeQuantity}
            error={quantityError}
            keyboardType="decimal-pad"
            maxLength={9}
            editable={editable}
            returnKeyType="next"
            onSubmitEditing={() => unitRef.current?.focus()}
            submitBehavior="submit"
          />
        </View>
        <View style={styles.flex}>
          <AppTextInput
            ref={unitRef}
            label="Unit"
            placeholder="e.g. kg"
            value={unit}
            onChangeText={onChangeUnit}
            error={unitError}
            autoCapitalize="none"
            maxLength={UNIT_MAX_LENGTH}
            editable={editable}
            returnKeyType={onUnitSubmit ? 'next' : 'done'}
            onSubmitEditing={onUnitSubmit}
            submitBehavior={onUnitSubmit ? 'submit' : 'blurAndSubmit'}
          />
        </View>
      </View>
      <View style={styles.chips}>
        {UNIT_SUGGESTIONS.map((suggestion) => (
          <Chip
            key={suggestion}
            label={suggestion}
            selected={unit === suggestion}
            onPress={() => onChangeUnit(unit === suggestion ? '' : suggestion)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quantity: {
    width: 120,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
});
