import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { useGroupSession } from '@/context/group-session-context';
import { translate } from '@/i18n';
import { vehicleCountOptions } from '@/models/group-assignment';

export function useVehicleSelectionController() {
  const { publishers } = useLocalSearchParams<{ publishers?: string }>();
  const { beginNewDistribution, preferences } = useGroupSession();
  const [vehicleCount, setVehicleCount] = useState(1);

  const publisherCount = useMemo(() => {
    const parsedPublisherCount = Number(publishers);
    return Number.isFinite(parsedPublisherCount) && parsedPublisherCount > 0
      ? parsedPublisherCount
      : 1;
  }, [publishers]);

  const confirmVehicleCount = () => {
    const result = beginNewDistribution(publisherCount, vehicleCount);

    if (!result.ok) {
      Alert.alert(
        translate(preferences.language, 'notEnoughSeats'),
        result.errorMessage,
      );
      return;
    }

    router.replace('/results');
  };

  return {
    vehicleCount,
    vehicleCountOptions,
    language: preferences.language,
    setVehicleCount,
    confirmVehicleCount,
  };
}
