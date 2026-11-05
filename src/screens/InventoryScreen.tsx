import React from 'react';
import PhasePlaceholder from '../components/PhasePlaceholder';

/** Phase 1 stand-in. Replaced with the full screen in Phase 3. */
export default function InventoryScreen() {
  return (
    <PhasePlaceholder
      title="Inventory"
      icon="layers-outline"
      phase={3}
      description="Your household items with search, category and status filters arrive in Phase 3."
    />
  );
}
