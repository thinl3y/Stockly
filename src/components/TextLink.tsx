import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';

interface TextLinkProps {
  /** Plain text before the link, e.g. "Don't have an account?" */
  prompt?: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

/** "Prompt  Link" row with a comfortable touch area around the link. */
export default function TextLink({ prompt, label, onPress, disabled }: TextLinkProps) {
  return (
    <View style={styles.row}>
      {prompt ? <Text style={styles.prompt}>{prompt} </Text> : null}
      <Pressable
        onPress={onPress}
        disabled={disabled}
        hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
        accessibilityRole="link"
        accessibilityLabel={label}
      >
        {({ pressed }) => (
          <Text style={[styles.link, (pressed || disabled) && styles.dim]}>{label}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  prompt: {
    ...typography.body,
    color: colors.textSecondary,
  },
  link: {
    ...typography.bodyStrong,
    color: colors.primary,
  },
  dim: {
    opacity: 0.6,
  },
});
