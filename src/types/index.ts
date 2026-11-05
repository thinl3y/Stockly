/**
 * Shared data types for Stockly.
 * Firestore Timestamps are converted to JavaScript Dates inside the service
 * layer, so screens and components only ever work with plain Date objects.
 */

export type StockStatus = 'available' | 'low_stock' | 'out_of_stock';

export type Category =
  | 'Groceries'
  | 'Toiletries'
  | 'Cleaning Supplies'
  | 'Kitchen Essentials'
  | 'Others';

/** users/{userId} */
export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  createdAt: Date | null;
}

/** users/{userId}/items/{itemId} */
export interface InventoryItem {
  id: string;
  name: string;
  category: Category;
  status: StockStatus;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** Fields the user fills in when creating or editing an item. */
export type InventoryItemInput = Pick<
  InventoryItem,
  'name' | 'category' | 'status' | 'quantity' | 'unit' | 'notes'
>;

/** users/{userId}/shoppingList/{shoppingItemId} */
export interface ShoppingListItem {
  id: string;
  /** null when the entry was added manually and is not linked to inventory. */
  itemId: string | null;
  name: string;
  category: Category;
  quantity: number | null;
  unit: string | null;
  purchased: boolean;
  createdAt: Date | null;
  purchasedAt: Date | null;
}

export type ShoppingListItemInput = Pick<
  ShoppingListItem,
  'itemId' | 'name' | 'category' | 'quantity' | 'unit'
>;

/** users/{userId}/purchaseHistory/{purchaseId} */
export interface PurchaseRecord {
  id: string;
  itemId: string | null;
  shoppingItemId: string;
  name: string;
  category: Category;
  quantity: number | null;
  unit: string | null;
  purchasedAt: Date | null;
}

export * from './navigation';
