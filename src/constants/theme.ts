import { Platform, TextStyle, ViewStyle } from 'react-native';

/**
 * Stockly design tokens.
 * Every screen and component reads colours, spacing and type from here,
 * so the whole app stays visually consistent.
 */
export const colors = {
  primary: '#2E7D5B',
  primaryDark: '#21604A',
  primaryLight: '#E8F5EC',
  background: '#F8FAF8',
  card: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningText: '#B45309',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  dangerText: '#B91C1C',
  white: '#FFFFFF',
  overlay: 'rgba(31, 41, 55, 0.4)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/** Minimum touch target recommended by Apple (44pt) and Google (48dp). */
export const touchTarget = 48;

export const typography = {
  display: { fontSize: 36, fontWeight: '800', letterSpacing: -0.5 },
  h1: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },
  h2: { fontSize: 20, fontWeight: '700' },
  h3: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyStrong: { fontSize: 15, fontWeight: '600' },
  caption: { fontSize: 13, fontWeight: '400' },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  small: { fontSize: 12, fontWeight: '500' },
} satisfies Record<string, TextStyle>;

/** Subtle card shadow that looks the same on iOS and Android. */
export const shadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: '#1F2937',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  default: {
    elevation: 2,
  },
}) as ViewStyle;

export const theme = { colors, spacing, radius, typography, shadow, touchTarget };
export default theme;
