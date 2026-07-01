import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { GroupSessionProvider } from '@/context/group-session-context';
import { GlobalDestructiveActionConfirmationModal } from '@/views/destructive-action-confirmation-modal';
import { GlobalStorageActionFeedbackModal } from '@/views/storage-action-feedback-modal';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GroupSessionProvider>
        <Stack screenOptions={{ gestureEnabled: false, headerShown: false }} />
        <GlobalDestructiveActionConfirmationModal />
        <GlobalStorageActionFeedbackModal />
        <StatusBar style="light" />
      </GroupSessionProvider>
    </GestureHandlerRootView>
  );
}
