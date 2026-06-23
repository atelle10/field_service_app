import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';

import { vehicleCountOptions } from '@/models/group-assignment';
import { createGroupAssignment } from '@/services/group-assignment-service';

export function useVehicleSelectionController() {
  const { publishers } = useLocalSearchParams<{ publishers?: string }>();
  const [vehicleCount, setVehicleCount] = useState(1);

  const publisherCount = useMemo(() => {
    const parsedPublisherCount = Number(publishers);
    return Number.isFinite(parsedPublisherCount) && parsedPublisherCount > 0
      ? parsedPublisherCount
      : 1;
  }, [publishers]);

  const confirmVehicleCount = () => {
    const assignment = createGroupAssignment({
      publisherCount,
      vehicleCount,
    });

    console.debug('Group counts confirmed', assignment);
  };

  return {
    vehicleCount,
    vehicleCountOptions,
    setVehicleCount,
    confirmVehicleCount,
  };
}
