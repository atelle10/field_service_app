import { router } from 'expo-router';
import { useEffect } from 'react';

import { useGroupSession } from '@/context/group-session-context';

export function useResultsController() {
  const {
    activeSession,
    hasActiveSession,
    recalculateDistribution,
    updatePublisherCount,
    updateVehicleCapacity,
    updateVehicleCount,
  } = useGroupSession();

  useEffect(() => {
    if (!hasActiveSession) {
      router.replace('/select');
    }
  }, [hasActiveSession]);

  const startOver = () => {
    router.replace('/select');
  };

  const goHome = () => {
    if (hasActiveSession) {
      router.navigate('/results');
      return;
    }

    router.replace('/select');
  };

  return {
    distribution: activeSession?.distribution ?? null,
    errorMessage: activeSession?.errorMessage ?? '',
    goHome,
    hasActiveSession,
    isLoading: activeSession?.isLoading ?? false,
    publisherCount: activeSession?.publisherCount ?? 1,
    recalculateDistribution,
    rerunPromptVisible: activeSession?.rerunPromptVisible ?? false,
    startOver,
    staleMessage: activeSession?.staleMessage ?? '',
    updatePublisherCount,
    updateVehicleCount,
    updateVehicleCapacity,
    vehicleCount: activeSession?.vehicles.length ?? 1,
    vehicles: activeSession?.vehicles ?? [],
  };
}
