import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc,
} from 'firebase/firestore';
import { getDb, getFirebaseAuth } from './firebase';
import type { UserProfile } from '../types';

/**
 * Firestore operations for the profile document: users/{userId}
 */

const userDoc = (uid: string) => doc(getDb(), 'users', uid);

const toDate = (value: unknown): Date | null =>
  value instanceof Timestamp ? value.toDate() : null;

/** Creates the profile document right after registration. */
export async function createUserProfile(
  uid: string,
  fullName: string,
  email: string,
): Promise<void> {
  await setDoc(userDoc(uid), {
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    createdAt: serverTimestamp(),
  });
}

/**
 * Makes sure a profile document exists (e.g. if the account was created
 * but saving the profile failed because of a network drop).
 */
export async function ensureUserProfile(
  uid: string,
  fallbackName: string,
  email: string,
): Promise<void> {
  const snapshot = await getDoc(userDoc(uid));
  if (!snapshot.exists()) {
    await createUserProfile(uid, fallbackName, email);
  }
}

/** Updates the user's full name. */
export async function updateUserFullName(uid: string, fullName: string): Promise<void> {
  await updateDoc(userDoc(uid), { fullName: fullName.trim() });
}

/**
 * Listens to the profile document and calls `onChange` whenever it changes.
 * `onChange(null)` means the document does not exist yet.
 */
export function subscribeToUserProfile(
  uid: string,
  onChange: (profile: UserProfile | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    userDoc(uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        onChange(null);
        return;
      }
      const data = snapshot.data();
      onChange({
        uid,
        fullName: typeof data.fullName === 'string' ? data.fullName : '',
        email: typeof data.email === 'string' ? data.email : '',
        createdAt: toDate(data.createdAt),
      });
    },
    (error) => {
      // After logout, open listeners briefly receive "permission-denied".
      // That is expected, so it is ignored instead of shown to the user.
      if (!getFirebaseAuth().currentUser) return;
      onError?.(error);
    },
  );
}
