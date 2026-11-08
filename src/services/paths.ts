import { collection, doc } from 'firebase/firestore';
import { getDb } from './firebase';

/**
 * One place that knows the Firestore layout. Every path starts at
 * users/{uid}, which is what the security rules protect.
 */

export const itemsCollection = (uid: string) => collection(getDb(), 'users', uid, 'items');
export const itemDoc = (uid: string, itemId: string) =>
  doc(getDb(), 'users', uid, 'items', itemId);

export const shoppingCollection = (uid: string) =>
  collection(getDb(), 'users', uid, 'shoppingList');
export const shoppingDoc = (uid: string, shoppingItemId: string) =>
  doc(getDb(), 'users', uid, 'shoppingList', shoppingItemId);

/**
 * A shopping entry that comes from an inventory item always uses the same
 * document ID. Two taps on "Add to shopping list" therefore point at the
 * same document, so duplicates are impossible.
 */
export const shoppingIdForItem = (itemId: string) => `item_${itemId}`;

export const historyCollection = (uid: string) =>
  collection(getDb(), 'users', uid, 'purchaseHistory');
