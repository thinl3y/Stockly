const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

/** Firebase requires at least 6 characters. */
export const MIN_PASSWORD_LENGTH = 6;

export function isNonEmpty(value: string | null | undefined): boolean {
  return !!value && value.trim().length > 0;
}

/**
 * Parses an optional quantity field.
 * Returns `null` for an empty field, a number for valid input,
 * or `NaN` when the user typed something that is not a positive number.
 */
export function parseOptionalQuantity(text: string): number | null {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed === '') return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : NaN;
}
