import React from 'react';
import PhasePlaceholder from '../components/PhasePlaceholder';

/** Phase 1 stand-in. Replaced with the full screen in Phase 4. */
export default function PurchaseHistoryScreen() {
  return (
    <PhasePlaceholder
      title="Purchase History"
      icon="time-outline"
      phase={4}
      description="Past purchases with search and newest/oldest sorting arrive in Phase 4."
    />
  );
}
