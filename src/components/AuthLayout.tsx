import React, { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, shadow, spacing, touchTarget, typography } from '../constants/theme';
import type { IoniconName } from '../constants/inventory';

interface AuthLayoutProps {
  icon: IoniconName;
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Content pinned under the form, e.g. "Already have an account? Log in". */
  footer?: ReactNode;
}

/**
 * Shared layout for Login, Register and Forgot Password.
 * KeyboardAvoidingView with "padding" on both platforms is what Expo
 * recommends; it keeps the focused field visible above the keyboard.
 */
export default function AuthLayout({ icon, title, subtitle, children, footer }: AuthLayoutProps) {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {navigation.canGoBack() && (
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [styles.back, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </Pressable>
          )}

          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name={icon} size={28} color={colors.primary} />
            </View>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.card}>{children}</View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
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
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  back: {
    width: touchTarget - 4,
    height: touchTarget - 4,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadow,
  },
  pressed: {
    opacity: 0.8,
  },
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadow,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
});
