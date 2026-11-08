import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToItems } from '../services/inventoryService';
import { getErrorMessage } from '../utils/errors';
import type { InventoryItem, StockStatus } from '../types';

/**
 * Keeps ONE live Firestore listener on the signed-in user's items and shares
 * the result with every screen (Home, Inventory, Item Details, Profile).
 * Any add, edit, status change or delete shows up everywhere at once.
 */
export interface InventoryContextValue {
  items: InventoryItem[];
  /** True until the first snapshot arrives. */
  loading: boolean;
  error: string | null;
  counts: Record<StockStatus, number> & { total: number };
  getItemById: (id: string) => InventoryItem | undefined;
}

const InventoryContext = createContext<InventoryContextValue | undefined>(undefined);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Signed out: clear everything so the next user never sees old data.
    setItems([]);
    setError(null);
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToItems(
      uid,
      (next) => {
        setItems(next);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(getErrorMessage(err));
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [uid]);

  const value = useMemo<InventoryContextValue>(() => {
    const counts = { total: items.length, available: 0, low_stock: 0, out_of_stock: 0 };
    for (const item of items) counts[item.status] += 1;
    const byId = new Map(items.map((item) => [item.id, item]));
    return { items, loading, error, counts, getItemById: (id) => byId.get(id) };
  }, [items, loading, error]);

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory(): InventoryContextValue {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used inside <InventoryProvider>.');
  return context;
}
