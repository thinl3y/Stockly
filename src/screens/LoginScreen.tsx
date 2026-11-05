import React from 'react';
import PhasePlaceholder from '../components/PhasePlaceholder';

/** Phase 1 stand-in. Replaced with the full screen in Phase 2. */
export default function LoginScreen() {
  return (
    <PhasePlaceholder
      title="Log In"
      icon="log-in-outline"
      phase={2}
      description="Email and password sign-in, forgot password and error messages arrive in Phase 2."
    />
  );
}
