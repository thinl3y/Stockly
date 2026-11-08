import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToPurchaseHistory } from '../services/historyService';
import { getErrorMessage } from '../utils/errors';
import type { PurchaseRecord } from '../types';

/**
 * Live purchase history (newest first) for the signed-in user.
 * Used by the History tab and the Home dashboard. Firestore shares one
 * server connection for identical queries, so using it twice is cheap.
 */
export function usePurchaseHistory() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [records, setRecords] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRecords([]);
    setError(null);
    if (!uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeToPurchaseHistory(
      uid,
      (next) => {
        setRecords(next);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(getErrorMessage(err));
        setLoading(false);
      },
    );
  }, [uid]);

  return { records, loading, error };
}
