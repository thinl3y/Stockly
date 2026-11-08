import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../components/AppButton';
import AppTextInput from '../components/AppTextInput';
import FormMessage from '../components/FormMessage';
import { useAuth } from '../contexts/AuthContext';
import { useInventory } from '../contexts/InventoryContext';
import { colors, radius, shadow, spacing, touchTarget, typography } from '../constants/theme';
import type { IoniconName } from '../constants/inventory';
import { getErrorMessage } from '../utils/errors';
import { formatDate } from '../utils/format';
import { getInitials } from '../utils/greeting';

function InfoRow({ icon, label, value }: { icon: IoniconName; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.infoBody}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, profile, displayName, logout, updateFullName } = useAuth();

  const { counts, loading: itemsLoading, error: countError } = useInventory();
  const itemCount = itemsLoading ? null : counts.total;

  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);
  const loggingOutRef = useRef(false);

  const startEditing = () => {
    setNameDraft(displayName);
    setNameError(null);
    setNameSaved(false);
    setEditing(true);
  };

  const saveName = async () => {
    if (savingName) return;
    const name = nameDraft.trim();
    if (name.length < 2) return setNameError('Name must be at least 2 characters.');
    if (name.length > 100) return setNameError('Name must be 100 characters or fewer.');
    if (name === displayName) return setEditing(false);

    setSavingName(true);
    try {
      await updateFullName(name);
      setEditing(false);
      setNameSaved(true);
    } catch (error) {
      setNameError(getErrorMessage(error));
    } finally {
      setSavingName(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Log out of Stockly?', 'Your items stay saved. Log in again any time to see them.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          if (loggingOutRef.current) return;
          loggingOutRef.current = true;
          setLoggingOut(true);
          try {
            await logout();
            // RootNavigator returns to the Welcome screen automatically.
          } catch (error) {
            Alert.alert('Could not log out', getErrorMessage(error));
            loggingOutRef.current = false;
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  const email = profile?.email || user?.email || '';
  const memberSince = profile?.createdAt ?? (user?.metadata.creationTime
    ? new Date(user.metadata.creationTime)
    : null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.screenTitle} accessibilityRole="header">
            Profile
          </Text>

          {/* Identity card */}
          <View style={styles.card}>
            <View style={styles.identity}>
              <View style={styles.avatar} accessibilityLabel={`Avatar for ${displayName}`}>
                <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
              </View>
              {!editing && (
                <View style={styles.identityText}>
                  <Text style={styles.name} numberOfLines={2}>
                    {displayName || 'Stockly user'}
                  </Text>
                  <Text style={styles.email} numberOfLines={1}>
                    {email}
                  </Text>
                </View>
              )}
              {!editing && (
                <Pressable
                  onPress={startEditing}
                  style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Edit name"
                >
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                </Pressable>
              )}
            </View>

            {nameSaved && !editing ? (
              <View style={styles.savedSpacer}>
                <FormMessage type="success" message="Your name has been updated." />
              </View>
            ) : null}

            {editing && (
              <View style={styles.editForm}>
                <AppTextInput
                  label="Full name"
                  icon="person-outline"
                  value={nameDraft}
                  onChangeText={(text) => {
                    setNameDraft(text);
                    if (nameError) setNameError(null);
                  }}
                  error={nameError}
                  autoCapitalize="words"
                  autoFocus
                  maxLength={100}
                  returnKeyType="done"
                  onSubmitEditing={saveName}
                  editable={!savingName}
                />
                <View style={styles.editActions}>
                  <AppButton
                    title="Cancel"
                    variant="secondary"
                    onPress={() => setEditing(false)}
                    disabled={savingName}
                    fullWidth={false}
                    style={styles.editAction}
                  />
                  <AppButton
                    title="Save"
                    onPress={saveName}
                    loading={savingName}
                    fullWidth={false}
                    style={styles.editAction}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Stats */}
          <View style={[styles.card, styles.statCard]}>
            <View style={styles.statIcon}>
              <Ionicons name="layers" size={24} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.statLabel}>Total household items</Text>
              {countError ? (
                <Text style={styles.statError}>{countError}</Text>
              ) : itemCount === null ? (
                <ActivityIndicator color={colors.primary} style={styles.statLoader} />
              ) : (
                <Text style={styles.statValue}>{itemCount}</Text>
              )}
            </View>
          </View>

          {/* Account details */}
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={[styles.card, styles.infoCard]}>
            <InfoRow icon="mail-outline" label="Email" value={email || '—'} />
            <View style={styles.divider} />
            <InfoRow icon="calendar-outline" label="Member since" value={formatDate(memberSince)} />
          </View>

          <AppButton
            title="Log Out"
            icon="log-out-outline"
            variant="dangerOutline"
            onPress={confirmLogout}
            loading={loggingOut}
            style={styles.logout}
          />

          <Text style={styles.footer}>Stockly · Know what you have. Remember what you need.</Text>
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
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  screenTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadow,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.h2,
    color: colors.white,
  },
  identityText: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  name: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  email: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  editButton: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  pressed: {
    opacity: 0.8,
  },
  savedSpacer: {
    marginTop: spacing.lg,
    marginBottom: -spacing.lg,
  },
  editForm: {
    marginTop: spacing.xl,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  editAction: {
    flex: 1,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statValue: {
    ...typography.h1,
    color: colors.textPrimary,
    marginTop: 2,
  },
  statLoader: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  statError: {
    ...typography.caption,
    color: colors.dangerText,
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  infoCard: {
    paddingVertical: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoBody: {
    flex: 1,
  },
  infoLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 48,
  },
  logout: {
    marginTop: spacing.md,
  },
  footer: {
    ...typography.small,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
