import React, { useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AuthLayout from '../components/AuthLayout';
import AppTextInput, { TextInputHandle } from '../components/AppTextInput';
import AppButton from '../components/AppButton';
import FormMessage from '../components/FormMessage';
import TextLink from '../components/TextLink';
import { useAuth } from '../contexts/AuthContext';
import { spacing } from '../constants/theme';
import { getErrorMessage } from '../utils/errors';
import { isNonEmpty, isValidEmail, MIN_PASSWORD_LENGTH } from '../utils/validation';
import type { AuthStackParamList } from '../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

type Field = 'fullName' | 'email' | 'password' | 'confirmPassword';
type FieldErrors = Partial<Record<Field, string>>;

function validate(values: Record<Field, string>): FieldErrors {
  const errors: FieldErrors = {};
  const name = values.fullName.trim();

  if (!isNonEmpty(name)) errors.fullName = 'Please enter your full name.';
  else if (name.length < 2) errors.fullName = 'Name must be at least 2 characters.';
  else if (name.length > 100) errors.fullName = 'Name must be 100 characters or fewer.';

  if (!isNonEmpty(values.email)) errors.email = 'Please enter your email address.';
  else if (!isValidEmail(values.email)) errors.email = 'Please enter a valid email address.';

  if (!values.password) errors.password = 'Please create a password.';
  else if (values.password.length < MIN_PASSWORD_LENGTH)
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;

  if (!values.confirmPassword) errors.confirmPassword = 'Please confirm your password.';
  else if (values.confirmPassword !== values.password)
    errors.confirmPassword = 'Passwords do not match.';

  return errors;
}

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();

  const [values, setValues] = useState<Record<Field, string>>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const emailRef = useRef<TextInputHandle>(null);
  const passwordRef = useRef<TextInputHandle>(null);
  const confirmRef = useRef<TextInputHandle>(null);

  const setField = (field: Field) => (text: string) => {
    setValues((prev) => ({ ...prev, [field]: text }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (formError) setFormError(null);
  };

  const handleRegister = async () => {
    if (submittingRef.current) return; // ignore double taps

    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    submittingRef.current = true;
    setSubmitting(true);
    setFormError(null);
    try {
      await register(values.fullName, values.email, values.password);
      // Success: AuthContext sees the new user and RootNavigator
      // switches to the main app automatically.
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      icon="person-add-outline"
      title="Create your account"
      subtitle="Start keeping track of your household essentials."
      footer={
        <TextLink
          prompt="Already have an account?"
          label="Log in"
          onPress={() => navigation.replace('Login')}
          disabled={submitting}
        />
      }
    >
      <FormMessage type="error" message={formError} />

      <AppTextInput
        label="Full name"
        icon="person-outline"
        placeholder="e.g. Tenzin Wangmo"
        value={values.fullName}
        onChangeText={setField('fullName')}
        error={errors.fullName}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        maxLength={100}
        editable={!submitting}
        onSubmitEditing={() => emailRef.current?.focus()}
        submitBehavior="submit"
      />
      <AppTextInput
        ref={emailRef}
        label="Email address"
        icon="mail-outline"
        placeholder="you@example.com"
        value={values.email}
        onChangeText={setField('email')}
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
        placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
        value={values.password}
        onChangeText={setField('password')}
        error={errors.password}
        isPassword
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        editable={!submitting}
        onSubmitEditing={() => confirmRef.current?.focus()}
        submitBehavior="submit"
      />
      <AppTextInput
        ref={confirmRef}
        label="Confirm password"
        icon="shield-checkmark-outline"
        placeholder="Type your password again"
        value={values.confirmPassword}
        onChangeText={setField('confirmPassword')}
        error={errors.confirmPassword}
        isPassword
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        editable={!submitting}
        onSubmitEditing={handleRegister}
      />

      <AppButton
        title="Create Account"
        onPress={handleRegister}
        loading={submitting}
        style={styles.button}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: spacing.sm,
  },
});
