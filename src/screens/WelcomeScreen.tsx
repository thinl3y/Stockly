import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppButton from '../components/AppButton';
import { colors, radius, shadow, spacing, typography } from '../constants/theme';
import type { IoniconName } from '../constants/inventory';
import {
  firebaseProjectId,
  isFirebaseConfigured,
  missingFirebaseKeys,
} from '../services/firebase';
import type { AuthStackParamList } from '../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const FEATURES: { icon: IoniconName; title: string; text: string }[] = [
  {
    icon: 'layers-outline',
    title: 'Track your essentials',
    text: 'Groceries, toiletries and cleaning supplies in one place.',
  },
  {
    icon: 'alert-circle-outline',
    title: 'Spot what is running low',
    text: 'See low and out-of-stock items at a glance.',
  },
  {
    icon: 'cart-outline',
    title: 'Shop without forgetting',
    text: 'Build a shopping list and keep a purchase history.',
  },
];

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.logoOuter}>
            <View style={styles.logoInner}>
              <Ionicons name="basket" size={48} color={colors.white} />
            </View>
          </View>
          <Text style={styles.appName} accessibilityRole="header">
            Stockly
          </Text>
          <Text style={styles.tagline}>
            Know what you have.{'\n'}Remember what you need.
          </Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={22} color={colors.primary} />
              </View>
              <View style={styles.featureBody}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            </View>
          ))}
        </View>

        {!isFirebaseConfigured && (
          <View style={styles.configWarning} accessibilityRole="alert">
            <Ionicons name="warning-outline" size={20} color={colors.dangerText} />
            <Text style={styles.configWarningText}>
              Firebase is not set up yet. Missing: {missingFirebaseKeys.join(', ')}.
              Add them to the .env file and restart Expo.
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <AppButton
            title="Get Started"
            icon="arrow-forward"
            onPress={() => navigation.navigate('Register')}
            accessibilityHint="Create a new Stockly account"
          />
          <AppButton
            title="I already have an account"
            variant="ghost"
            onPress={() => navigation.navigate('Login')}
            style={styles.loginButton}
          />
          {__DEV__ && isFirebaseConfigured ? (
            <Text style={styles.devNote}>Connected to Firebase project: {firebaseProjectId}</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
  },
  logoOuter: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  logoInner: {
    width: 92,
    height: 92,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  appName: {
    ...typography.display,
    color: colors.textPrimary,
  },
  tagline: {
    ...typography.body,
    fontSize: 17,
    lineHeight: 25,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  features: {
    marginTop: spacing.xxxl,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    ...shadow,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureBody: {
    flex: 1,
  },
  featureTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  featureText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  configWarning: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerLight,
  },
  configWarningText: {
    ...typography.caption,
    color: colors.dangerText,
    flex: 1,
  },
  actions: {
    marginTop: 'auto',
    paddingTop: spacing.xxl,
  },
  loginButton: {
    marginTop: spacing.sm,
  },
  devNote: {
    ...typography.small,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
