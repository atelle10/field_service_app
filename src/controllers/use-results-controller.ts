import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';

import {
  DistributionStrategy,
  type DistributionResponse,
  type VehicleInput,
} from '@/models/group-assignment';
import {
  createDistributionSuggestion,
  createDefaultVehicles,
  createPlaceholderPassengers,
  requestDistributionSuggestion,
} from '@/services/group-assignment-service';

type ResultsState = {
  distribution: DistributionResponse | null;
  errorMessage: string;
  isLoading: boolean;
  rerunPromptVisible: boolean;
  vehicles: VehicleInput[];
};

export function useResultsController() {
  const { publishers, vehicles: vehicleParam } = useLocalSearchParams<{
    publishers?: string;
    vehicles?: string;
  }>();
  const publisherCount = parsePositiveInteger(publishers, 1);
  const vehicleCount = parsePositiveInteger(vehicleParam, 1);
  const passengers = useMemo(
    () => createPlaceholderPassengers(publisherCount),
    [publisherCount],
  );
  const [state, setState] = useState<ResultsState>(() =>
    createInitialResultsState(publisherCount, vehicleCount),
  );

  const generateDistribution = async (nextVehicles: VehicleInput[]) => {
    setState((currentState) => ({
      ...currentState,
      errorMessage: '',
      isLoading: true,
    }));

    try {
      const suggestion = await requestDistributionSuggestion({
        passengers,
        vehicles: nextVehicles,
        strategy: DistributionStrategy.MinimizeCars,
      });

      setState((currentState) => ({
        ...currentState,
        distribution: suggestion,
        errorMessage: '',
        isLoading: false,
        rerunPromptVisible: false,
      }));
    } catch (error) {
      setState((currentState) => ({
        ...currentState,
        distribution: null,
        errorMessage:
          error instanceof Error ? error.message : 'Unable to generate a distribution.',
        isLoading: false,
      }));
    }
  };

  const updateVehicleCapacity = (vehicleId: string, capacity: number) => {
    const normalizedCapacity = Math.max(0, capacity);
    setState((currentState) => ({
      ...currentState,
      rerunPromptVisible: true,
      vehicles: currentState.vehicles.map((vehicle) =>
        vehicle.id === vehicleId ? { ...vehicle, capacity: normalizedCapacity } : vehicle,
      ),
    }));
  };

  const recalculateDistribution = () => {
    void generateDistribution(state.vehicles);
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/vehicles');
  };

  return {
    distribution: state.distribution,
    errorMessage: state.errorMessage,
    isLoading: state.isLoading,
    publisherCount,
    recalculateDistribution,
    rerunPromptVisible: state.rerunPromptVisible,
    updateVehicleCapacity,
    vehicles: state.vehicles,
    goBack,
  };
}

function createInitialResultsState(
  publisherCount: number,
  vehicleCount: number,
): ResultsState {
  const vehicles = createDefaultVehicles(vehicleCount);

  try {
    const distribution = createDistributionSuggestion({
      passengers: createPlaceholderPassengers(publisherCount),
      vehicles,
      strategy: DistributionStrategy.MinimizeCars,
    });

    return {
      distribution,
      errorMessage: '',
      isLoading: false,
      rerunPromptVisible: false,
      vehicles,
    };
  } catch (error) {
    return {
      distribution: null,
      errorMessage:
        error instanceof Error ? error.message : 'Unable to generate a distribution.',
      isLoading: false,
      rerunPromptVisible: false,
      vehicles,
    };
  }
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return parsedValue;
}
