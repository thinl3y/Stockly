import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppButton from './AppButton';
import { colors, radius, spacing, typography } from '../constants/theme';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last line of defence: if a screen throws while rendering, show a calm
 * "Something went wrong" page with a Try again button instead of a blank
 * app. Firebase errors are handled on each screen; this is for bugs.
 * (React only supports error boundaries as class components.)
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) console.error('[Stockly] Unhandled render error', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={styles.icon}>
            <Ionicons name="warning-outline" size={36} color={colors.warningText} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            Something went wrong
          </Text>
          <Text style={styles.message}>
            Your data is safe in your account. Tap below to reload the screen.
          </Text>
          {__DEV__ ? <Text style={styles.devError}>{this.state.error.message}</Text> : null}
          <AppButton title="Try again" icon="refresh" onPress={this.reset} style={styles.button} />
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: radius.pill,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  devError: {
    ...typography.caption,
    color: colors.dangerText,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  button: {
    marginTop: spacing.xl,
  },
});
