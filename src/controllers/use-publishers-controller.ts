import { router } from 'expo-router';

import { useGroupSession } from '@/context/group-session-context';
import type { PublisherProfile } from '@/models/group-assignment';

export function usePublishersController() {
  const {
    addPublisherProfile,
    clearPersistentCache,
    deleteAllPublisherProfiles,
    hasActiveSession,
    preferences,
    publisherProfiles,
    removePublisherProfile,
    storageUsageBytes,
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

  return {
    addPublisherProfile,
    clearPersistentCache,
    deleteAllPublisherProfiles,
    goHome,
    goToPublishers,
    goToOptions,
    publisherProfiles: getSortedPublishers(
      publisherProfiles,
      preferences.sortPublishersAlphabetically,
    ),
    removePublisherProfile,
    storageUsageBytes,
  };
}

function getSortedPublishers(
  publisherProfiles: PublisherProfile[],
  sortAlphabetically: boolean,
) {
  if (!sortAlphabetically) {
    return publisherProfiles;
  }

  return [...publisherProfiles].sort((a, b) => a.name.localeCompare(b.name));
}
