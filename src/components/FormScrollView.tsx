import React, { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { colors, spacing } from '../constants/theme';

interface FormScrollViewProps {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Scrollable container for screens that have a navigation header
 * (Add/Edit Item, Item Details) and contain text fields.
 *
 * - iOS: ScrollView's automaticallyAdjustKeyboardInsets keeps the focused
 *   field visible, including inside the Add Item modal sheet.
 * - Android: KeyboardAvoidingView with "padding", offset by the header
 *   height so the calculation matches the real screen position.
 */
export default function FormScrollView({ children, contentContainerStyle }: FormScrollViewProps) {
  const headerHeight = useHeaderHeight();

  const scroll = (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );

  if (Platform.OS === 'ios') return scroll;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior="padding"
      keyboardVerticalOffset={headerHeight}
    >
      {scroll}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
});
