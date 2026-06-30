import { router } from 'expo-router';
import { useEffect } from 'react';

import { useGroupSession } from '@/context/group-session-context';
import type { PublisherProfile } from '@/models/group-assignment';
import { getPassengerDisplayName as getPassengerDisplayNameFromState } from '@/services/group-session-service';

export function useResultsController() {
  const {
    activeSession,
    assignPublisherName,
    assignPublisherProfile,
    clearPersistentCache,
    hasActiveSession,
    movePassengerToVehicle,
    preferences,
    recalculateDistribution,
    refreshStorageUsage,
    restorePassengerDefaultLabel,
    saveCurrentResult,
    storageUsageBytes,
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

  const goToPublishers = () => {
    router.navigate('/publishers');
  };

  const goToOptions = () => {
    router.navigate('/options');
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
    clearPersistentCache,
    distribution: activeSession?.distribution ?? null,
    errorMessage: activeSession?.errorMessage ?? '',
    getPassengerDisplayName,
    hasAssignedPublisherProfile,
    goHome,
    goToPublishers,
    goToOptions,
    hasActiveSession,
    isLoading: activeSession?.isLoading ?? false,
    movePassengerToVehicle,
    preferences,
    publisherCount: activeSession?.publisherCount ?? 1,
    publisherProfiles: getSortedPublishers(
      activeSession?.publisherProfiles ?? [],
      preferences.sortPublishersAlphabetically,
    ),
    recalculateDistribution,
    refreshStorageUsage,
    rerunPromptVisible: activeSession?.rerunPromptVisible ?? false,
    restorePassengerDefaultLabel,
    saveCurrentResult,
    startOver,
    staleMessage: activeSession?.staleMessage ?? '',
    storageUsageBytes,
    updatePublisherCount,
    updateVehicleCount,
    updateVehicleCapacity,
    updateVehicleLabel,
    vehicleCount: activeSession?.vehicles.length ?? 1,
    vehicles: activeSession?.vehicles ?? [],
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
