/** Returns a greeting based on the device's local time. */
export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  return 'Good Evening'; // evenings and late nights
}

/** First name from a full name, e.g. "Kelden Dorji" -> "Kelden". */
export function getFirstName(fullName: string | null | undefined): string {
  const trimmed = fullName?.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0];
}

/** Initials for an avatar, e.g. "Tenzin Wangmo" -> "TW". */
export function getInitials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** "Saturday, 7 November" in the phone's language. */
export function formatToday(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}
