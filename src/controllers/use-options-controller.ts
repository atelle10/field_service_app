import { router } from 'expo-router';

import { useGroupSession } from '@/context/group-session-context';
import type { AppPreferences } from '@/models/group-assignment';

export function useOptionsController() {
  const {
    clearPersistentCache,
    preferences,
    storageUsageBytes,
    updateAppPreferences,
  } = useGroupSession();

  const goHome = () => {
    router.navigate('/results');
  };

  const goToPublishers = () => {
    router.navigate('/publishers');
  };

  const goToHistory = () => {
    router.navigate('/history');
  };

  const goToOptions = () => {
    router.navigate('/options');
  };

  const goToInfo = () => {
    router.navigate('/info');
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
    goToHistory,
    goToInfo,
    goToOptions,
    goToPublishers,
    preferences,
    storageUsageBytes,
    updatePreference,
  };
}
