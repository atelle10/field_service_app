import { router } from 'expo-router';
import { useState } from 'react';

import { useGroupSession } from '@/context/group-session-context';
import { publisherCountOptions } from '@/models/group-assignment';

export function usePublisherSelectionController() {
  const { preferences } = useGroupSession();
  const [publisherCount, setPublisherCount] = useState(1);

  const confirmPublisherCount = () => {
    router.replace({
      pathname: '/vehicles',
      params: { publishers: String(publisherCount) },
    });
  };

  return {
    publisherCount,
    publisherCountOptions,
    language: preferences.language,
    setPublisherCount,
    confirmPublisherCount,
  };
}
