import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { GroupSessionProvider } from '@/context/group-session-context';
import { GlobalStorageActionFeedbackModal } from '@/views/storage-action-feedback-modal';

export default function RootLayout() {
  return (
    <GroupSessionProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <GlobalStorageActionFeedbackModal />
      <StatusBar style="light" />
    </GroupSessionProvider>
  );
}
