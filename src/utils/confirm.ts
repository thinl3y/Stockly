import { Alert } from 'react-native';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
}

/** Native confirmation dialog that resolves to true when confirmed. */
export function confirmAction({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
}: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      // Android: tapping outside the dialog counts as Cancel.
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

/** Standard confirmation used everywhere an item can be deleted. */
export function confirmDeleteItem(name: string): Promise<boolean> {
  return confirmAction({
    title: `Delete ${name}?`,
    message:
      'It will be removed from your inventory and your shopping list. Your purchase history is kept.',
    confirmLabel: 'Delete',
    destructive: true,
  });
}
