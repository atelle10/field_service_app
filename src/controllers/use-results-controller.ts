import { router } from 'expo-router';

import { useGroupSession } from '@/context/group-session-context';
import type { PublisherProfile } from '@/models/group-assignment';
import {
  getPassengerDisplayName as getPassengerDisplayNameFromState,
} from '@/services/group-session-service';

export function useResultsController() {
  const {
    activeSession,
    assignPublisherName,
    assignPublisherProfile,
    hasActiveSession,
    movePassengerToVehicle,
    preferences,
    recalculateDistribution,
    refreshStorageUsage,
    restorePassengerDefaultLabel,
    saveCurrentResult,
    updatePublisherCount,
    updateVehicleCapacity,
    updateVehicleCount,
    updateVehicleLabel,
  } = useGroupSession();

  const startOver = () => {
    router.replace('/select');
  };

  const goHome = () => {
    router.navigate('/results');
  };

  const goToPublishers = () => {
    router.navigate('/publishers');
  };

  const goToHistory = () => {
    router.navigate('/history');
  };

  const goToOptions = () => {
    router.navigate('/options');
  };

  const goToInfo = () => {
    router.navigate('/info');
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
    goToHistory,
    goToInfo,
    goToPublishers,
    goToOptions,
    hasActiveSession,
    isLoading: activeSession?.isLoading ?? false,
    movePassengerToVehicle,
    preferences,
    publisherCount: activeSession?.publisherCount ?? 0,
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
    updatePublisherCount,
    updateVehicleCount,
    updateVehicleCapacity,
    updateVehicleLabel,
    vehicleCount: activeSession?.vehicles.length ?? 0,
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
