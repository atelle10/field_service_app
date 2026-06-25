import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { useGroupSession } from '@/context/group-session-context';
import { vehicleCountOptions } from '@/models/group-assignment';

export function useVehicleSelectionController() {
  const { publishers } = useLocalSearchParams<{ publishers?: string }>();
  const { beginNewDistribution } = useGroupSession();
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
        'Not enough seats',
        result.errorMessage,
      );
      return;
    }

    router.push('/results');
  };

  return {
    vehicleCount,
    vehicleCountOptions,
    setVehicleCount,
    confirmVehicleCount,
  };
}
