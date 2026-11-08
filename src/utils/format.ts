/** "12 Mar 2026" style date, or an em dash if the date is missing. */
export function formatDate(date: Date | null | undefined): string {
  if (!date) return '—';
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "2 kg", "3", "1 pack" — or null when there is nothing to show. */
export function formatQuantity(
  quantity: number | null | undefined,
  unit: string | null | undefined,
): string | null {
  if (quantity === null || quantity === undefined) {
    return unit?.trim() ? unit.trim() : null;
  }
  return unit?.trim() ? `${quantity} ${unit.trim()}` : String(quantity);
}

/** "6:42 pm" style time, or an empty string if the date is missing. */
export function formatTime(date: Date | null | undefined): string {
  if (!date) return '';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** Local calendar day as "YYYY-MM-DD", used to group records by day. */
export function dayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** "Today", "Yesterday", or e.g. "Thu, 5 Nov 2026". */
export function formatDayLabel(date: Date | null | undefined, now: Date = new Date()): string {
  if (!date) return 'Just now';
  const today = dayKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const key = dayKey(date);
  if (key === today) return 'Today';
  if (key === dayKey(yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
