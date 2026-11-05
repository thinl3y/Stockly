import React from 'react';
import { useRoute } from '@react-navigation/native';
import PhasePlaceholder from '../components/PhasePlaceholder';

/**
 * Phase 1 stand-in. In Phase 3 this becomes the item form, used by both the
 * "AddItem" route (new item) and the "EditItem" route (existing item).
 */
export default function AddItemScreen() {
  const route = useRoute();
  const isEdit = route.name === 'EditItem';

  return (
    <PhasePlaceholder
      title={isEdit ? 'Edit Item' : 'Add Item'}
      icon={isEdit ? 'create-outline' : 'add-circle-outline'}
      phase={3}
      description="Name, category, stock status, quantity, unit and notes with validation arrive in Phase 3."
      withSafeArea={false}
    />
  );
}
