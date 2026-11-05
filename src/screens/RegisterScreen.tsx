import React from 'react';
import PhasePlaceholder from '../components/PhasePlaceholder';

/** Phase 1 stand-in. Replaced with the full screen in Phase 2. */
export default function RegisterScreen() {
  return (
    <PhasePlaceholder
      title="Create Account"
      icon="person-add-outline"
      phase={2}
      description="Registration with full name, email and password validation arrives in Phase 2."
    />
  );
}
