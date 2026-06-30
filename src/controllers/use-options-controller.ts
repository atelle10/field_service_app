import { router } from 'expo-router';

import { useGroupSession } from '@/context/group-session-context';
import type { AppPreferences } from '@/models/group-assignment';

export function useOptionsController() {
  const {
    clearPersistentCache,
    hasActiveSession,
    preferences,
    storageUsageBytes,
    updateAppPreferences,
  } = useGroupSession();

  const goHome = () => {
    if (hasActiveSession) {
      router.navigate('/results');
      return;
    }

    router.replace('/select');
  };

  const goToPublishers = () => {
    router.navigate('/publishers');
  };

  const goToOptions = () => {
    router.navigate('/options');
  };

  const updatePreference = <Key extends keyof AppPreferences>(
    key: Key,
    value: AppPreferences[Key],
  ) => {
    updateAppPreferences({
      ...preferences,
      [key]: value,
    });
  };

  return {
    clearPersistentCache,
    goHome,
    goToOptions,
    goToPublishers,
    preferences,
    storageUsageBytes,
    updatePreference,
  };
}
