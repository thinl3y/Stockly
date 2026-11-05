import React from 'react';
import PhasePlaceholder from '../components/PhasePlaceholder';

/** Phase 1 stand-in. Replaced with the full screen in Phase 3. */
export default function ItemDetailsScreen() {
  return (
    <PhasePlaceholder
      title="Item Details"
      icon="document-text-outline"
      phase={3}
      description="Full item details, status changes, add to shopping list and delete arrive in Phase 3."
      withSafeArea={false}
    />
  );
}
