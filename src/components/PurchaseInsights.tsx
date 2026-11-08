import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SegmentedControl from './SegmentedControl';
import { getCategoryIcon } from '../constants/inventory';
import { colors, radius, shadow, spacing, typography } from '../constants/theme';
import { computePurchaseStats, PERIOD_LABELS, StatsPeriod } from '../utils/stats';
import type { PurchaseRecord } from '../types';

/**
 * Basic purchase statistics (optional feature from the brief):
 * number of purchases in a chosen period and the most frequently bought items.
 */
export default function PurchaseInsights({ records }: { records: PurchaseRecord[] }) {
  const [period, setPeriod] = useState<StatsPeriod>('30d');
  const stats = useMemo(() => computePurchaseStats(records, period), [records, period]);
  const maxCount = stats.top[0]?.count ?? 1;

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Ionicons name="stats-chart" size={18} color={colors.primary} />
        <Text style={styles.title}>Insights</Text>
      </View>

      <SegmentedControl<StatsPeriod>
        value={period}
        onChange={setPeriod}
        options={[
          { value: '7d', label: '7 days' },
          { value: '30d', label: '30 days' },
          { value: 'all', label: 'All time' },
        ]}
      />

      <View style={styles.numbers}>
        <View style={styles.number}>
          <Text style={styles.value}>{stats.total}</Text>
          <Text style={styles.label}>{stats.total === 1 ? 'purchase' : 'purchases'}</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.number}>
          <Text style={styles.value}>{stats.distinctItems}</Text>
          <Text style={styles.label}>
            different {stats.distinctItems === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>

      <Text style={styles.subTitle}>Most bought · {PERIOD_LABELS[period].toLowerCase()}</Text>
      {stats.top.length === 0 ? (
        <Text style={styles.empty}>No purchases in this period.</Text>
      ) : (
        stats.top.map((item, index) => (
          <View
            key={item.name}
            style={styles.topRow}
            accessibilityLabel={`${index + 1}. ${item.name}, bought ${item.count} times`}
          >
            <Text style={styles.rank}>{index + 1}</Text>
            <Ionicons name={getCategoryIcon(item.category)} size={16} color={colors.textSecondary} />
            <View style={styles.flex}>
              <Text style={styles.topName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${(item.count / maxCount) * 100}%` }]} />
              </View>
            </View>
            <Text style={styles.count}>×{item.count}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
    ...shadow,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  numbers: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  number: {
    flex: 1,
    alignItems: 'center',
  },
  separator: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  value: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  subTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  empty: {
    ...typography.body,
    color: colors.textMuted,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  rank: {
    ...typography.label,
    color: colors.textMuted,
    width: 14,
  },
  topName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryLight,
    marginTop: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  count: {
    ...typography.label,
    color: colors.primary,
    minWidth: 28,
    textAlign: 'right',
  },
});
