import { router } from 'expo-router';
import { useState } from 'react';

import { CountPickerScreen } from '@/components/count-picker-screen';

const publisherCounts = Array.from({ length: 50 }, (_, index) => index + 1);

export default function PublisherSelectScreen() {
  const [publisherCount, setPublisherCount] = useState(1);

  const confirmPublisherCount = () => {
    router.push({
      pathname: '/vehicles',
      params: { publishers: String(publisherCount) },
    });
  };

  return (
    <CountPickerScreen
      prompt="Welcome! To begin, please enter the number of publishers in your group:"
      selectedCount={publisherCount}
      counts={publisherCounts}
      onCountChange={setPublisherCount}
      onConfirm={confirmPublisherCount}
    />
  );
}
