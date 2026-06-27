import { router } from 'expo-router';

import { useGroupSession } from '@/context/group-session-context';

export function usePublishersController() {
  const {
    addPublisherProfile,
    clearPersistentCache,
    deleteAllPublisherProfiles,
    hasActiveSession,
    publisherProfiles,
    removePublisherProfile,
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

  return {
    addPublisherProfile,
    clearPersistentCache,
    deleteAllPublisherProfiles,
    goHome,
    goToPublishers,
    publisherProfiles,
    removePublisherProfile,
  };
}
