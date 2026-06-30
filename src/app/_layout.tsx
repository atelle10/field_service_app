import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { GroupSessionProvider } from '@/context/group-session-context';
import { GlobalDestructiveActionConfirmationModal } from '@/views/destructive-action-confirmation-modal';
import { GlobalStorageActionFeedbackModal } from '@/views/storage-action-feedback-modal';

export default function RootLayout() {
  return (
    <GroupSessionProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <GlobalDestructiveActionConfirmationModal />
      <GlobalStorageActionFeedbackModal />
      <StatusBar style="light" />
    </GroupSessionProvider>
  );
}
