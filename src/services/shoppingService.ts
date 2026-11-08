import {
  deleteDoc,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
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
import {
  historyCollection,
  itemDoc,
  shoppingCollection,
  shoppingDoc,
  shoppingIdForItem,
} from './paths';
import type { Category, InventoryItem, ShoppingListItem } from '../types';

/**
 * Firestore operations for users/{userId}/shoppingList, including the
 * purchase workflow that also writes purchaseHistory and updates items.
 */

export class AlreadyOnListError extends Error {
  constructor(name: string) {
    super(`${name} is already on your shopping list.`);
    this.name = 'AlreadyOnListError';
  }
}

export class AlreadyPurchasedError extends Error {
  constructor(name: string) {
    super(`${name} has already been marked as purchased.`);
    this.name = 'AlreadyPurchasedError';
  }
}

function toShoppingItem(id: string, data: Record<string, unknown>): ShoppingListItem {
  return {
    id,
    itemId: typeof data.itemId === 'string' && data.itemId ? data.itemId : null,
    name: typeof data.name === 'string' ? data.name : 'Unnamed item',
    category: toCategory(data.category),
    quantity: toQuantity(data.quantity),
    unit: toOptionalText(data.unit),
    purchased: data.purchased === true,
    createdAt: toDate(data.createdAt),
    purchasedAt: toDate(data.purchasedAt),
  };
}

/** Optional amount to buy, entered on the shopping list. */
export interface ShoppingAmount {
  quantity: number | null;
  unit: string | null;
}

const cleanAmount = (amount?: ShoppingAmount) => ({
  quantity: amount?.quantity ?? null,
  unit: amount?.unit?.trim() || null,
});

/* ------------------------------------------------------------------ */
/* Reading                                                             */
/* ------------------------------------------------------------------ */

/**
 * Live list of items still to buy (purchased == false), newest first.
 * Sorting happens on the device, so no composite Firestore index is needed.
 */
export function subscribeToPendingShoppingList(
  uid: string,
  onChange: (items: ShoppingListItem[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const pendingQuery = query(shoppingCollection(uid), where('purchased', '==', false));
  return onSnapshot(
    pendingQuery,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => toShoppingItem(d.id, d.data(READ_OPTIONS)))
        .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
      onChange(items);
    },
    (error) => {
      if (!getFirebaseAuth().currentUser) return; // expected during logout
      onError?.(error);
    },
  );
}

/* ------------------------------------------------------------------ */
/* Adding and removing                                                 */
/* ------------------------------------------------------------------ */

/**
 * Adds an inventory item to the shopping list.
 *
 * Uses a transaction on a fixed document ID (item_<itemId>), so:
 * - a pending entry for the same item is never duplicated, even with
 *   rapid repeated taps or two phones at once;
 * - an old, already-purchased entry is simply reused for the new trip.
 */
export async function addInventoryItemToShoppingList(
  item: InventoryItem,
  amount?: ShoppingAmount,
): Promise<void> {
  const uid = requireUid();
  const ref = shoppingDoc(uid, shoppingIdForItem(item.id));

  await runTransaction(getDb(), async (transaction) => {
    const existing = await transaction.get(ref);
    if (existing.exists() && existing.data().purchased === false) {
      throw new AlreadyOnListError(item.name);
    }
    transaction.set(ref, {
      itemId: item.id,
      name: item.name,
      category: item.category,
      ...cleanAmount(amount),
      purchased: false,
      createdAt: serverTimestamp(),
      purchasedAt: null,
    });
  });
}

/** Adds something that is not in the inventory (itemId = null). */
export async function addManualShoppingItem(input: {
  name: string;
  category: Category;
  quantity: number | null;
  unit: string | null;
}): Promise<WriteResult> {
  const uid = requireUid();
  const ref = doc(shoppingCollection(uid));
  return commitWrite(
    setDoc(ref, {
      itemId: null,
      name: input.name.trim(),
      category: input.category,
      ...cleanAmount(input),
      purchased: false,
      createdAt: serverTimestamp(),
      purchasedAt: null,
    }),
  );
}

/** Removes an entry from the shopping list without buying it. */
export async function removeFromShoppingList(shoppingItemId: string): Promise<WriteResult> {
  const uid = requireUid();
  return commitWrite(deleteDoc(shoppingDoc(uid, shoppingItemId)));
}

/* ------------------------------------------------------------------ */
/* Purchase workflow                                                   */
/* ------------------------------------------------------------------ */

/**
 * Marks a shopping entry as purchased. In ONE Firestore transaction:
 *
 *   1. Re-reads the entry. If it is already purchased (double tap, or
 *      another phone got there first) it stops, so history is never
 *      duplicated.
 *   2. Sets purchased = true and purchasedAt on the entry, which removes
 *      it from the pending list.
 *   3. Creates a purchaseHistory record with a copy of the name, category
 *      and quantity, so history survives if the item is later deleted.
 *   4. If the entry is linked to an inventory item that still exists,
 *      sets that item's status to "available".
 *
 * Either all of these happen or none do. A transaction needs a connection;
 * offline it fails with a clear "Cannot reach the server" message and
 * nothing is changed.
 */
export async function markAsPurchased(entry: ShoppingListItem): Promise<void> {
  const uid = requireUid();
  const db = getDb();
  const entryRef = shoppingDoc(uid, entry.id);
  const historyRef = doc(historyCollection(uid)); // ID generated on the device

  await runTransaction(db, async (transaction) => {
    // All reads must happen before any writes in a Firestore transaction.
    const entrySnap = await transaction.get(entryRef);
    if (!entrySnap.exists()) {
      throw new Error(`${entry.name} is no longer on your shopping list.`);
    }
    const current = toShoppingItem(entrySnap.id, entrySnap.data());
    if (current.purchased) throw new AlreadyPurchasedError(current.name);

    const linkedRef = current.itemId ? itemDoc(uid, current.itemId) : null;
    const linkedSnap = linkedRef ? await transaction.get(linkedRef) : null;

    transaction.update(entryRef, {
      purchased: true,
      purchasedAt: serverTimestamp(),
    });

    transaction.set(historyRef, {
      itemId: current.itemId,
      shoppingItemId: current.id,
      name: current.name,
      category: current.category,
      quantity: current.quantity,
      unit: current.unit,
      purchasedAt: serverTimestamp(),
    });

    if (linkedRef && linkedSnap?.exists()) {
      transaction.update(linkedRef, {
        status: 'available',
        updatedAt: serverTimestamp(),
      });
    }
  });
}

/* ------------------------------------------------------------------ */
/* Keeping linked entries in step with inventory                       */
/* ------------------------------------------------------------------ */

/**
 * After an item is renamed or recategorised, update its shopping entry to
 * match. Runs in the background; "not found" just means the item is not on
 * the list, which is fine.
 */
export function syncShoppingEntryWithItem(
  uid: string,
  itemId: string,
  name: string,
  category: Category,
): void {
  updateDoc(shoppingDoc(uid, shoppingIdForItem(itemId)), { name, category }).catch(() => {
    /* no shopping entry for this item */
  });
}
