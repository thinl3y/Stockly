import React from 'react';
import PhasePlaceholder from '../components/PhasePlaceholder';

/** Phase 1 stand-in. Replaced with the full screen in Phase 2. */
export default function ProfileScreen() {
  return (
    <PhasePlaceholder
      title="Profile"
      icon="person-circle-outline"
      phase={2}
      description="Your name, email, item count and logout arrive in Phase 2, with stats added in Phase 5."
    />
  );
}
