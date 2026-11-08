import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { getFirebaseAuth } from './firebase';
import { createUserProfile, ensureUserProfile, updateUserFullName } from './userService';

/**
 * Firebase Authentication operations.
 * Screens call these through AuthContext, never directly.
 */

/** Creates the account, sets the display name and saves the profile document. */
export async function registerUser(
  fullName: string,
  email: string,
  password: string,
): Promise<User> {
  const auth = getFirebaseAuth();
  const name = fullName.trim();
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);

  // The account now exists. Saving the name is done in parallel; if one of
  // these fails, ensureUserProfile() repairs it on the next login.
  await Promise.all([
    updateProfile(user, { displayName: name }),
    createUserProfile(user.uid, name, user.email ?? email),
  ]);
  return user;
}

export async function loginUser(email: string, password: string): Promise<User> {
  const { user } = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  );

  const fallbackName = user.displayName || (user.email ?? email).split('@')[0];
  try {
    await ensureUserProfile(user.uid, fallbackName, user.email ?? email);
  } catch (error) {
    // Logging in should not fail just because the profile check did.
    if (__DEV__) console.warn('[Stockly] Could not verify user profile', error);
  }
  return user;
}

export async function logoutUser(): Promise<void> {
  await signOut(getFirebaseAuth());
}

/**
 * Sends a password reset email.
 * Note: with Firebase's email-enumeration protection (on by default), this
 * succeeds even if no account uses that address, so the UI shows a neutral
 * "if an account exists" message.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
}

/** Updates the name in both Firebase Auth and the Firestore profile. */
export async function changeFullName(fullName: string): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('You need to be signed in to do that.');
  const name = fullName.trim();
  // Auth first: it fails fast when offline, so the user sees an error
  // instead of a spinner. Then the Firestore profile document.
  await updateProfile(user, { displayName: name });
  await updateUserFullName(user.uid, name);
}
