import React from 'react';
import PhasePlaceholder from '../components/PhasePlaceholder';

/** Phase 1 stand-in. Replaced with the full screen in Phase 5. */
export default function HomeScreen() {
  return (
    <PhasePlaceholder
      title="Home"
      icon="home-outline"
      phase={5}
      description="Greeting, live inventory summary cards, needs-attention list and quick actions arrive in Phase 5."
    />
  );
}
