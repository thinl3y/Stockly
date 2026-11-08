import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AuthLayout from '../components/AuthLayout';
import AppTextInput, { TextInputHandle } from '../components/AppTextInput';
import AppButton from '../components/AppButton';
import FormMessage from '../components/FormMessage';
import TextLink from '../components/TextLink';
import { useAuth } from '../contexts/AuthContext';
import { spacing } from '../constants/theme';
import { getErrorMessage } from '../utils/errors';
import { isNonEmpty, isValidEmail } from '../utils/validation';
import type { AuthStackParamList } from '../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const passwordRef = useRef<TextInputHandle>(null);

  const validate = (): FieldErrors => {
    const found: FieldErrors = {};
    if (!isNonEmpty(email)) found.email = 'Please enter your email address.';
    else if (!isValidEmail(email)) found.email = 'Please enter a valid email address.';
    if (!password) found.password = 'Please enter your password.';
    return found;
  };

  const handleLogin = async () => {
    if (submittingRef.current) return;

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    submittingRef.current = true;
    setSubmitting(true);
    setFormError(null);
    try {
      await login(email, password);
      // RootNavigator switches to the main app when the user is set.
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      icon="log-in-outline"
      title="Welcome back"
      subtitle="Log in to see what you have and what you need."
      footer={
        <TextLink
          prompt="Don't have an account?"
          label="Sign up"
          onPress={() => navigation.replace('Register')}
          disabled={submitting}
        />
      }
    >
      <FormMessage type="error" message={formError} />

      <AppTextInput
        label="Email address"
        icon="mail-outline"
        placeholder="you@example.com"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
          if (formError) setFormError(null);
        }}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        editable={!submitting}
        onSubmitEditing={() => passwordRef.current?.focus()}
        submitBehavior="submit"
      />
      <AppTextInput
        ref={passwordRef}
        label="Password"
        icon="lock-closed-outline"
        placeholder="Your password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
          if (formError) setFormError(null);
        }}
        error={errors.password}
        isPassword
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        editable={!submitting}
        onSubmitEditing={handleLogin}
      />

      <View style={styles.forgotRow}>
        <TextLink
          label="Forgot password?"
          onPress={() => navigation.navigate('ForgotPassword', { email: email.trim() })}
          disabled={submitting}
        />
      </View>

      <AppButton title="Log In" onPress={handleLogin} loading={submitting} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
});
