import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '../services/firebase';
import {
  changeFullName,
  loginUser,
  logoutUser,
  registerUser,
  sendPasswordReset,
} from '../services/authService';
import { subscribeToUserProfile } from '../services/userService';
import type { UserProfile } from '../types';

/**
 * Holds the signed-in user for the whole app and exposes the auth actions.
 *
 * - `user` comes from Firebase Auth. Firebase restores it from AsyncStorage
 *   on launch, which is what keeps people logged in between app restarts.
 * - `profile` is the live users/{uid} Firestore document (full name etc.).
 * - Screens call register/login/logout/resetPassword; errors are thrown so
 *   each screen can show them next to its own form.
 */
export interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  /** True until Firebase has told us whether a saved session exists. */
  initializing: boolean;
  isConfigured: boolean;
  /** Best available name: profile name, then Auth display name, then email. */
  displayName: string;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateFullName: (fullName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(isFirebaseConfigured);

  // 1. Watch the Firebase Auth session.
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (firebaseUser) => {
      setUser(firebaseUser);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  // 2. While someone is signed in, keep their profile document in sync.
  const uid = user?.uid ?? null;
  useEffect(() => {
    if (!uid) {
      setProfile(null);
      return;
    }
    const unsubscribe = subscribeToUserProfile(uid, setProfile, (error) => {
      if (__DEV__) console.warn('[Stockly] Profile listener error', error);
    });
    return unsubscribe;
  }, [uid]);

  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      await registerUser(fullName, email, password);
    },
    [],
  );

  const login = useCallback(async (email: string, password: string) => {
    await loginUser(email, password);
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordReset(email);
  }, []);

  const updateFullName = useCallback(async (fullName: string) => {
    await changeFullName(fullName);
  }, []);

  const displayName =
    profile?.fullName?.trim() ||
    user?.displayName?.trim() ||
    user?.email?.split('@')[0] ||
    '';

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      initializing,
      isConfigured: isFirebaseConfigured,
      displayName,
      register,
      login,
      logout,
      resetPassword,
      updateFullName,
    }),
    [user, profile, initializing, displayName, register, login, logout, resetPassword, updateFullName],
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
