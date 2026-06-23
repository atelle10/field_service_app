import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert } from 'react-native';

import {
  DistributionStrategy,
  vehicleCountOptions,
} from '@/models/group-assignment';
import {
  createDefaultVehicles,
  createPlaceholderPassengers,
  requestDistributionSuggestion,
} from '@/services/group-assignment-service';

export function useVehicleSelectionController() {
  const { publishers } = useLocalSearchParams<{ publishers?: string }>();
  const [vehicleCount, setVehicleCount] = useState(1);

  const publisherCount = useMemo(() => {
    const parsedPublisherCount = Number(publishers);
    return Number.isFinite(parsedPublisherCount) && parsedPublisherCount > 0
      ? parsedPublisherCount
      : 1;
  }, [publishers]);

  const confirmVehicleCount = async () => {
    const passengers = createPlaceholderPassengers(publisherCount);
    const vehicles = createDefaultVehicles(vehicleCount);

    try {
      await requestDistributionSuggestion({
        passengers,
        vehicles,
        strategy: DistributionStrategy.MinimizeCars,
      });

      router.push({
        pathname: '/results',
        params: {
          publishers: String(publisherCount),
          vehicles: String(vehicleCount),
        },
      });
    } catch (error) {
      Alert.alert(
        'Not enough seats',
        error instanceof Error ? error.message : 'Please add more vehicles.',
      );
    }
  };

  return {
    vehicleCount,
    vehicleCountOptions,
    setVehicleCount,
    confirmVehicleCount,
  };
}
