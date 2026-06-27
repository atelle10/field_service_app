import { Modal, Pressable, Text, View } from 'react-native';

import {
  type StorageActionFeedback,
  useGroupSession,
} from '@/context/group-session-context';
import { styles } from '@/views/storage-action-feedback-modal.styles';

export function GlobalStorageActionFeedbackModal() {
  const { dismissStorageActionFeedback, storageActionFeedback } = useGroupSession();

  return (
    <StorageActionFeedbackModal
      feedback={storageActionFeedback}
      onClose={dismissStorageActionFeedback}
    />
  );
}

function StorageActionFeedbackModal({
  feedback,
  onClose,
}: {
  feedback: StorageActionFeedback | null;
  onClose: () => void;
}) {
  const isError = feedback?.tone === 'error';

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={feedback !== null}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            isError ? styles.cardError : styles.cardSuccess,
          ]}>
          <Text
            style={[
              styles.title,
              isError ? styles.titleError : styles.titleSuccess,
            ]}>
            {feedback?.title}
          </Text>
          <Text style={styles.message}>{feedback?.message}</Text>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.button,
              isError ? styles.buttonError : styles.buttonSuccess,
              pressed && styles.buttonPressed,
            ]}>
            <Text
              style={[
                styles.buttonText,
                isError ? styles.buttonTextError : styles.buttonTextSuccess,
              ]}>
              OK
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
