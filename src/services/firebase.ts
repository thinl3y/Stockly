import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Firebase configuration is read from environment variables in the `.env`
 * file at the project root (see `.env.example` and the README).
 * Nothing is hard-coded here.
 *
 * Expo only inlines variables that start with EXPO_PUBLIC_ and that are
 * written out in full like below, so do not refactor these into a loop.
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** Names of any config values that are missing from `.env`. */
export const missingFirebaseKeys: string[] = Object.entries(firebaseConfig)
  .filter(([, value]) => !value || value.trim() === '')
  .map(([key]) => key);

export const isFirebaseConfigured = missingFirebaseKeys.length === 0;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  try {
    // Store the signed-in session on the device so users stay logged in
    // after the app is closed and reopened.
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // initializeAuth throws if it already ran (e.g. after a Fast Refresh).
    auth = getAuth(app);
  }

  db = getFirestore(app);
} else if (__DEV__) {
  console.warn(
    `[Stockly] Firebase is not configured. Missing: ${missingFirebaseKeys.join(
      ', ',
    )}. Copy .env.example to .env, fill in your values and restart with "npx expo start --clear".`,
  );
}

const notConfiguredError = () =>
  new Error(
    'Firebase is not configured. Add your Firebase web app settings to the .env file and restart Expo.',
  );

/** Firebase Auth instance. Throws a clear error if `.env` is incomplete. */
export function getFirebaseAuth(): Auth {
  if (!auth) throw notConfiguredError();
  return auth;
}

/** Cloud Firestore instance. Throws a clear error if `.env` is incomplete. */
export function getDb(): Firestore {
  if (!db) throw notConfiguredError();
  return db;
}

/** The current user's UID. Throws if nobody is signed in. */
export function requireUid(): string {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) throw new Error('You need to be signed in to do that.');
  return uid;
}

/** Project ID, handy for showing which Firebase project the app is using. */
export const firebaseProjectId = firebaseConfig.projectId ?? null;
