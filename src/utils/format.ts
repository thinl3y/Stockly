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
