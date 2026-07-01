import { router } from 'expo-router';

import { useGroupSession } from '@/context/group-session-context';
import type { PublisherProfile } from '@/models/group-assignment';

export function usePublishersController() {
  const {
    addPublisherProfile,
    deleteAllPublisherProfiles,
    preferences,
    publisherProfiles,
    removePublisherProfile,
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

  return {
    addPublisherProfile,
    deleteAllPublisherProfiles,
    goHome,
    goToHistory,
    goToInfo,
    goToPublishers,
    goToOptions,
    publisherProfiles: getSortedPublishers(
      publisherProfiles,
      preferences.sortPublishersAlphabetically,
    ),
    removePublisherProfile,
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
