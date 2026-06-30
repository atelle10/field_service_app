import { Modal, Pressable, Text, View } from 'react-native';

import {
  type DestructiveActionConfirmation,
  useGroupSession,
} from '@/context/group-session-context';
import { styles } from '@/views/destructive-action-confirmation-modal.styles';

export function GlobalDestructiveActionConfirmationModal() {
  const {
    confirmDestructiveAction,
    destructiveActionConfirmation,
    dismissDestructiveActionConfirmation,
  } = useGroupSession();

  return (
    <DestructiveActionConfirmationModal
      confirmation={destructiveActionConfirmation}
      onCancel={dismissDestructiveActionConfirmation}
      onConfirm={confirmDestructiveAction}
    />
  );
}

function DestructiveActionConfirmationModal({
  confirmation,
  onCancel,
  onConfirm,
}: {
  confirmation: DestructiveActionConfirmation | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={confirmation !== null}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{confirmation?.title}</Text>
          <Text style={styles.message}>{confirmation?.message}</Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.button,
                styles.cancelButton,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                styles.confirmButton,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.confirmButtonText}>
                {confirmation?.confirmLabel ?? 'Confirm'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
