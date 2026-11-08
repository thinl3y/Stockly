import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToPendingShoppingList } from '../services/shoppingService';
import { getErrorMessage } from '../utils/errors';
import type { ShoppingListItem } from '../types';

/**
 * ONE live listener on the user's pending shopping entries, shared by the
 * Shopping List tab (and its badge), Item Details, Add Shopping Item and,
 * in Phase 5, the Home dashboard.
 */
export interface ShoppingContextValue {
  /** Entries still to buy, newest first. */
  pending: ShoppingListItem[];
  loading: boolean;
  error: string | null;
  /** True if this inventory item has a pending shopping entry. */
  isItemOnList: (itemId: string) => boolean;
  /** True if a pending entry already uses this name (case-insensitive). */
  hasPendingName: (name: string) => boolean;
}

const ShoppingContext = createContext<ShoppingContextValue | undefined>(undefined);

const normalise = (name: string) => name.trim().toLowerCase();

export function ShoppingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [pending, setPending] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPending([]);
    setError(null);
    if (!uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeToPendingShoppingList(
      uid,
      (items) => {
        setPending(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(getErrorMessage(err));
        setLoading(false);
      },
    );
  }, [uid]);

  const value = useMemo<ShoppingContextValue>(() => {
    const itemIds = new Set(pending.map((p) => p.itemId).filter(Boolean) as string[]);
    const names = new Set(pending.map((p) => normalise(p.name)));
    return {
      pending,
      loading,
      error,
      isItemOnList: (itemId) => itemIds.has(itemId),
      hasPendingName: (name) => names.has(normalise(name)),
    };
  }, [pending, loading, error]);

  return <ShoppingContext.Provider value={value}>{children}</ShoppingContext.Provider>;
}

export function useShopping(): ShoppingContextValue {
  const context = useContext(ShoppingContext);
  if (!context) throw new Error('useShopping must be used inside <ShoppingProvider>.');
  return context;
}
