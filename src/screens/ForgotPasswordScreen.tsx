import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AuthLayout from '../components/AuthLayout';
import AppTextInput from '../components/AppTextInput';
import AppButton from '../components/AppButton';
import FormMessage from '../components/FormMessage';
import { useAuth } from '../contexts/AuthContext';
import { colors, radius, spacing, typography } from '../constants/theme';
import { getErrorMessage } from '../utils/errors';
import { isNonEmpty, isValidEmail } from '../utils/validation';
import type { AuthStackParamList } from '../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation, route }: Props) {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState(route.params?.email ?? '');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const handleSend = async () => {
    if (submittingRef.current) return;

    if (!isNonEmpty(email)) return setError('Please enter your email address.');
    if (!isValidEmail(email)) return setError('Please enter a valid email address.');

    submittingRef.current = true;
    setSubmitting(true);
    setFormError(null);
    try {
      await resetPassword(email);
      setSentTo(email.trim());
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (sentTo) {
    return (
      <AuthLayout
        icon="mail-unread-outline"
        title="Check your inbox"
        subtitle="Follow the link in the email to choose a new password."
      >
        <View style={styles.sentBox}>
          <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          <Text style={styles.sentText}>
            If an account exists for <Text style={styles.bold}>{sentTo}</Text>, a password reset
            link is on its way. It can take a few minutes, and may land in your spam folder.
          </Text>
        </View>
        <AppButton title="Back to Log In" icon="arrow-back" onPress={() => navigation.goBack()} />
        <AppButton
          title="Use a different email"
          variant="ghost"
          onPress={() => setSentTo(null)}
          style={styles.secondary}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon="key-outline"
      title="Reset your password"
      subtitle="Enter the email you signed up with and we will send you a reset link."
    >
      <FormMessage type="error" message={formError} />
      <AppTextInput
        label="Email address"
        icon="mail-outline"
        placeholder="you@example.com"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (error) setError(null);
          if (formError) setFormError(null);
        }}
        error={error}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        editable={!submitting}
        onSubmitEditing={handleSend}
        autoFocus={!route.params?.email}
      />
      <AppButton
        title="Send Reset Link"
        icon="paper-plane-outline"
        onPress={handleSend}
        loading={submitting}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  sentBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.xl,
  },
  sentText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  bold: {
    fontWeight: '700',
  },
  secondary: {
    marginTop: spacing.sm,
  },
});
