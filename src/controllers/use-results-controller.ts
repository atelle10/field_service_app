import { router } from 'expo-router';
import { useEffect } from 'react';

import { useGroupSession } from '@/context/group-session-context';
import { getPassengerDisplayName as getPassengerDisplayNameFromState } from '@/services/group-session-service';

export function useResultsController() {
  const {
    activeSession,
    assignPublisherName,
    assignPublisherProfile,
    hasActiveSession,
    recalculateDistribution,
    restorePassengerDefaultLabel,
    updatePublisherCount,
    updateVehicleCapacity,
    updateVehicleCount,
    updateVehicleLabel,
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

  const getPassengerDisplayName = (passengerId: string) => {
    if (!activeSession) {
      return passengerId.replace('publisher-', 'Publisher ');
    }

    return getPassengerDisplayNameFromState(activeSession, passengerId);
  };

  const hasAssignedPublisherProfile = (passengerId: string) => {
    return Boolean(activeSession?.passengerPublisherIds[passengerId]);
  };

  return {
    assignPublisherName,
    assignPublisherProfile,
    distribution: activeSession?.distribution ?? null,
    errorMessage: activeSession?.errorMessage ?? '',
    getPassengerDisplayName,
    hasAssignedPublisherProfile,
    goHome,
    hasActiveSession,
    isLoading: activeSession?.isLoading ?? false,
    publisherCount: activeSession?.publisherCount ?? 1,
    publisherProfiles: activeSession?.publisherProfiles ?? [],
    recalculateDistribution,
    rerunPromptVisible: activeSession?.rerunPromptVisible ?? false,
    restorePassengerDefaultLabel,
    startOver,
    staleMessage: activeSession?.staleMessage ?? '',
    updatePublisherCount,
    updateVehicleCount,
    updateVehicleCapacity,
    updateVehicleLabel,
    vehicleCount: activeSession?.vehicles.length ?? 1,
    vehicles: activeSession?.vehicles ?? [],
  };
}
