import React, { ComponentRef, Ref, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, touchTarget, typography } from '../constants/theme';
import type { IoniconName } from '../constants/inventory';

/** Type for refs to a text field, e.g. `useRef<TextInputHandle>(null)`. */
export type TextInputHandle = ComponentRef<typeof TextInput>;

interface AppTextInputProps extends Omit<TextInputProps, 'ref'> {
  /** React 19 passes refs as a normal prop, so no forwardRef is needed. */
  ref?: Ref<TextInputHandle>;
  label: string;
  icon?: IoniconName;
  error?: string | null;
  /** Adds a show/hide toggle for password fields. */
  isPassword?: boolean;
}

export default function AppTextInput({
  ref,
  label,
  icon,
  error,
  isPassword = false,
  style,
  onFocus,
  onBlur,
  ...rest
}: AppTextInputProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(isPassword);

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, { borderColor }]}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={focused ? colors.primary : colors.textMuted}
            style={styles.icon}
          />
        )}
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={hidden}
          accessibilityLabel={label}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {isPassword && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  field: {
    minHeight: touchTarget + 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  error: {
    ...typography.caption,
    color: colors.dangerText,
    marginTop: spacing.xs,
  },
});
