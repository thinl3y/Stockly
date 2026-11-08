/**
 * Turns Firebase error codes into short, friendly messages.
 * Unknown errors fall back to the original message so nothing is hidden.
 */
const MESSAGES: Record<string, string> = {
  // Registration
  'auth/email-already-in-use': 'An account with this email already exists. Try logging in instead.',
  'auth/invalid-email': 'That email address does not look right.',
  'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  'auth/missing-password': 'Please enter your password.',

  // Login. Newer Firebase projects return "invalid-credential" for both
  // a wrong password and an unknown email, to avoid revealing which accounts exist.
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/invalid-login-credentials': 'Incorrect email or password.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',

  // Connection and setup
  'auth/network-request-failed': 'No internet connection. Check your network and try again.',
  'auth/operation-not-allowed':
    'Email/Password sign-in is not enabled. Turn it on in Firebase console > Authentication > Sign-in method.',
  'auth/configuration-not-found':
    'Firebase Authentication is not set up. Open Authentication in the Firebase console and click Get started.',
  'auth/invalid-api-key': 'The Firebase API key in .env is not valid.',
  'auth/requires-recent-login': 'Please log out and log in again, then retry.',

  // Firestore
  'permission-denied':
    'Permission denied. Check that the Firestore security rules from firestore.rules are published.',
  unavailable: 'Cannot reach the server. Check your internet connection.',
  'not-found': 'This item no longer exists. It may have been deleted.',
  'deadline-exceeded': 'The server took too long to respond. Please try again.',
};

export function getErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  if (code.startsWith('auth/api-key-not-valid')) {
    return MESSAGES['auth/invalid-api-key'];
  }
  if (code && MESSAGES[code]) return MESSAGES[code];
  if (code.startsWith('firestore/') && MESSAGES[code.slice(10)]) {
    return MESSAGES[code.slice(10)];
  }

  if (error instanceof Error && error.message) {
    // Firebase messages look like "Firebase: Error (auth/xyz)."; strip the prefix.
    return error.message.replace(/^Firebase:\s*/, '');
  }
  return 'Something went wrong. Please try again.';
}
