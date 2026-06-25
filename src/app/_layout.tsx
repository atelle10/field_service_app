import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { GroupSessionProvider } from '@/context/group-session-context';

export default function RootLayout() {
  return (
    <GroupSessionProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="light" />
    </GroupSessionProvider>
  );
}
