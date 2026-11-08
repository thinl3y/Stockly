import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { getDb, getFirebaseAuth, requireUid } from './firebase';
import {
  commitWrite,
  READ_OPTIONS,
  toCategory,
  toDate,
  toOptionalText,
  toQuantity,
  WriteResult,
} from './firestoreHelpers';
import { itemDoc, itemsCollection, shoppingDoc, shoppingIdForItem } from './paths';
import { syncShoppingEntryWithItem } from './shoppingService';
import { STOCK_STATUSES } from '../constants/inventory';
import type { InventoryItem, InventoryItemInput, StockStatus } from '../types';

/**
 * Firestore operations for users/{userId}/items.
 * Screens never import firebase/firestore; they call these functions.
 */

const STATUS_VALUES = STOCK_STATUSES.map((s) => s.value);

/** Converts a Firestore document into an InventoryItem, tolerating bad data. */
function toInventoryItem(id: string, data: Record<string, unknown>): InventoryItem {
  const status = STATUS_VALUES.includes(data.status as StockStatus)
    ? (data.status as StockStatus)
    : 'available';

  return {
    id,
    name: typeof data.name === 'string' ? data.name : 'Unnamed item',
    category: toCategory(data.category),
    status,
    quantity: toQuantity(data.quantity),
    unit: toOptionalText(data.unit),
    notes: toOptionalText(data.notes),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

/** Trims text and turns empty optional fields into null before saving. */
function cleanInput(input: InventoryItemInput) {
  const unit = input.unit?.trim() || null;
  const notes = input.notes?.trim() || null;
  return {
    name: input.name.trim(),
    category: input.category,
    status: input.status,
    quantity: input.quantity ?? null,
    unit,
    notes,
  };
}

/** Live list of the user's items, sorted A–Z (case-insensitive). */
export function subscribeToItems(
  uid: string,
  onChange: (items: InventoryItem[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    itemsCollection(uid),
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => toInventoryItem(d.id, d.data(READ_OPTIONS)))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      onChange(items);
    },
    (error) => {
      // Listeners briefly fail with permission-denied during logout; ignore.
      if (!getFirebaseAuth().currentUser) return;
      onError?.(error);
    },
  );
}

/** Creates an item. Returns its new ID and whether the server confirmed it. */
export async function addItem(
  input: InventoryItemInput,
): Promise<{ id: string; result: WriteResult }> {
  const uid = requireUid();
  const ref = doc(itemsCollection(uid)); // ID is generated on the device
  const result = await commitWrite(
    setDoc(ref, {
      ...cleanInput(input),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
  return { id: ref.id, result };
}

/** Saves all editable fields of an item. */
export async function updateItem(itemId: string, input: InventoryItemInput): Promise<WriteResult> {
  const uid = requireUid();
  const data = cleanInput(input);
  const result = await commitWrite(
    updateDoc(itemDoc(uid, itemId), { ...data, updatedAt: serverTimestamp() }),
  );
  // Keep a pending shopping-list entry's name/category in step with the item.
  syncShoppingEntryWithItem(uid, itemId, data.name, data.category);
  return result;
}

/** Changes only the stock status (used by the quick status buttons). */
export async function updateItemStatus(itemId: string, status: StockStatus): Promise<WriteResult> {
  const uid = requireUid();
  return commitWrite(updateDoc(itemDoc(uid, itemId), { status, updatedAt: serverTimestamp() }));
}

/**
 * Deletes an item together with its shopping-list entry (if any), in one
 * atomic batch. Purchase history is a separate copy and is kept.
 */
export async function deleteItem(itemId: string): Promise<WriteResult> {
  const uid = requireUid();
  const batch = writeBatch(getDb());
  batch.delete(itemDoc(uid, itemId));
  batch.delete(shoppingDoc(uid, shoppingIdForItem(itemId)));
  return commitWrite(batch.commit());
}
