import { Timestamp } from 'firebase/firestore';
import { CATEGORIES } from '../constants/inventory';
import type { Category } from '../types';

/** Firestore Timestamp → Date (or null while a server timestamp is pending). */
export const toDate = (value: unknown): Date | null =>
  value instanceof Timestamp ? value.toDate() : null;

/** Read options: show an estimated time for server timestamps still on their way. */
export const READ_OPTIONS = { serverTimestamps: 'estimate' } as const;

const CATEGORY_VALUES = CATEGORIES.map((c) => c.value);

/** Any stored value → a valid Category ("Others" if unknown). */
export const toCategory = (value: unknown): Category =>
  CATEGORY_VALUES.includes(value as Category) ? (value as Category) : 'Others';

/** Stored quantity → number or null. */
export const toQuantity = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

/** Stored optional text → trimmed string or null. */
export const toOptionalText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null;

/**
 * "synced"  – the server confirmed the write.
 * "pending" – the phone is offline or very slow. Firestore has already
 *             applied the change on the device (lists update at once) and
 *             will send it to the server when the connection returns.
 */
export type WriteResult = 'synced' | 'pending';

const PENDING_AFTER_MS = 8000;

/**
 * Waits for a Firestore write, but not forever.
 * Without this, a Save button would spin indefinitely with no signal,
 * because Firestore only resolves a write once the server confirms it.
 * Real errors (e.g. permission denied) are still thrown.
 */
export function commitWrite(write: Promise<unknown>): Promise<WriteResult> {
  return new Promise<WriteResult>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      resolve('pending');
    }, PENDING_AFTER_MS);

    write.then(
      () => {
        clearTimeout(timer);
        if (!settled) resolve('synced');
      },
      (error) => {
        clearTimeout(timer);
        if (!settled) reject(error);
        else if (__DEV__) console.warn('[Stockly] Write failed after going pending', error);
      },
    );
  });
}

export const PENDING_SYNC_MESSAGE =
  'Saved on this phone. It will sync to your account when you are back online.';
