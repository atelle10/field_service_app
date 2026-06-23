import { router } from 'expo-router';
import { useState } from 'react';

import { publisherCountOptions } from '@/models/group-assignment';

export function usePublisherSelectionController() {
  const [publisherCount, setPublisherCount] = useState(1);

  const confirmPublisherCount = () => {
    router.push({
      pathname: '/vehicles',
      params: { publishers: String(publisherCount) },
    });
  };

  return {
    publisherCount,
    publisherCountOptions,
    setPublisherCount,
    confirmPublisherCount,
  };
}
