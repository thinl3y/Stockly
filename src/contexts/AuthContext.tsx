import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '../services/firebase';

/**
 * Holds the signed-in Firebase user for the whole app.
 *
 * Phase 1: listens for auth state so navigation can switch between the
 * auth screens and the main app, and so a saved session is restored on
 * launch. Phase 2 adds register, login, logout and password reset here.
 */
export interface AuthContextValue {
  user: User | null;
  /** True until Firebase has told us whether a saved session exists. */
  initializing: boolean;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (firebaseUser) => {
      setUser(firebaseUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, initializing, isConfigured: isFirebaseConfigured }),
    [user, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return context;
}
