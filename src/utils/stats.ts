import type { Category, PurchaseRecord } from '../types';

/**
 * Purchase statistics, calculated on the device from purchase history.
 * Pure functions (no Firebase), so they are covered by `npm test`.
 */

export type StatsPeriod = '7d' | '30d' | 'all';

export const PERIOD_LABELS: Record<StatsPeriod, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  all: 'All time',
};

const DAY_MS = 24 * 60 * 60 * 1000;

export interface TopItem {
  name: string;
  category: Category;
  count: number;
}

export interface PurchaseStats {
  /** Number of purchases in the period. */
  total: number;
  /** Number of different items bought in the period. */
  distinctItems: number;
  /** Most frequently bought items, most frequent first. */
  top: TopItem[];
}

/** Start of the period, or null for "all time". */
export function periodStart(period: StatsPeriod, now: Date = new Date()): Date | null {
  if (period === 'all') return null;
  const days = period === '7d' ? 7 : 30;
  return new Date(now.getTime() - days * DAY_MS);
}

/** Records whose purchase time is inside the period (pending times count as "now"). */
export function recordsInPeriod(
  records: PurchaseRecord[],
  period: StatsPeriod,
  now: Date = new Date(),
): PurchaseRecord[] {
  const start = periodStart(period, now);
  if (!start) return records;
  return records.filter((r) => (r.purchasedAt ?? now).getTime() >= start.getTime());
}

export function computePurchaseStats(
  records: PurchaseRecord[],
  period: StatsPeriod,
  now: Date = new Date(),
  topCount = 3,
): PurchaseStats {
  const inPeriod = recordsInPeriod(records, period, now);

  // Group by name, ignoring case and extra spaces ("Rice" == " rice ").
  const groups = new Map<string, TopItem & { latest: number }>();
  for (const record of inPeriod) {
    const key = record.name.trim().toLowerCase();
    const time = (record.purchasedAt ?? now).getTime();
    const group = groups.get(key);
    if (!group) {
      groups.set(key, { name: record.name.trim(), category: record.category, count: 1, latest: time });
    } else {
      group.count += 1;
      if (time > group.latest) {
        // Show the most recent spelling and category.
        group.latest = time;
        group.name = record.name.trim();
        group.category = record.category;
      }
    }
  }

  const top = [...groups.values()]
    .sort((a, b) => b.count - a.count || b.latest - a.latest)
    .slice(0, topCount)
    .map(({ name, category, count }) => ({ name, category, count }));

  return { total: inPeriod.length, distinctItems: groups.size, top };
}

/** Purchases made in the current calendar month. */
export function countThisMonth(records: PurchaseRecord[], now: Date = new Date()): number {
  return records.filter((r) => {
    const d = r.purchasedAt ?? now;
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
}
