import React from 'react';
import PhasePlaceholder from '../components/PhasePlaceholder';

/** Phase 1 stand-in. Replaced with the full screen in Phase 4. */
export default function ShoppingListScreen() {
  return (
    <PhasePlaceholder
      title="Shopping List"
      icon="cart-outline"
      phase={4}
      description="Pending items, add from inventory or manually, and mark as purchased arrive in Phase 4."
    />
  );
}
