import { onSnapshot, orderBy, query, Unsubscribe } from 'firebase/firestore';
import { getFirebaseAuth } from './firebase';
import { READ_OPTIONS, toCategory, toDate, toOptionalText, toQuantity } from './firestoreHelpers';
import { historyCollection } from './paths';
import type { PurchaseRecord } from '../types';

/**
 * Read-only access to users/{userId}/purchaseHistory.
 * Records are created by markAsPurchased() in shoppingService and are
 * never edited (the security rules forbid updates).
 */

function toPurchaseRecord(id: string, data: Record<string, unknown>): PurchaseRecord {
  return {
    id,
    itemId: typeof data.itemId === 'string' && data.itemId ? data.itemId : null,
    shoppingItemId: typeof data.shoppingItemId === 'string' ? data.shoppingItemId : '',
    name: typeof data.name === 'string' ? data.name : 'Unnamed item',
    category: toCategory(data.category),
    quantity: toQuantity(data.quantity),
    unit: toOptionalText(data.unit),
    purchasedAt: toDate(data.purchasedAt),
  };
}

/** Live purchase history, newest first. */
export function subscribeToPurchaseHistory(
  uid: string,
  onChange: (records: PurchaseRecord[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(historyCollection(uid), orderBy('purchasedAt', 'desc')),
    (snapshot) => {
      onChange(snapshot.docs.map((d) => toPurchaseRecord(d.id, d.data(READ_OPTIONS))));
    },
    (error) => {
      if (!getFirebaseAuth().currentUser) return; // expected during logout
      onError?.(error);
    },
  );
}
