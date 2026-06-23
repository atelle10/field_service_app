import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import {
  DistributionStrategy,
  type DistributionResponse,
  type VehicleInput,
} from '@/models/group-assignment';
import {
  createDistributionSuggestion,
  createDefaultVehicles,
  createPlaceholderPassengers,
} from '@/services/group-assignment-service';

type ResultsState = {
  distribution: DistributionResponse | null;
  errorMessage: string;
  isLoading: boolean;
  publisherCount: number;
  rerunPromptVisible: boolean;
  vehicles: VehicleInput[];
};

export function useResultsController() {
  const { publishers, vehicles: vehicleParam } = useLocalSearchParams<{
    publishers?: string;
    vehicles?: string;
  }>();
  const [state, setState] = useState<ResultsState>(() =>
    createInitialResultsState(
      parsePositiveInteger(publishers, 1),
      parsePositiveInteger(vehicleParam, 1),
    ),
  );

  const updatePublisherCount = (publisherCount: number) => {
    setState((currentState) =>
      createResultsState(publisherCount, currentState.vehicles, false),
    );
  };

  const updateVehicleCount = (vehicleCount: number) => {
    setState((currentState) => {
      const vehicles = resizeVehicles(currentState.vehicles, vehicleCount);
      return createResultsState(currentState.publisherCount, vehicles, false);
    });
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
    setState((currentState) =>
      createResultsState(currentState.publisherCount, currentState.vehicles, false),
    );
  };

  const startOver = () => {
    router.replace('/select');
  };

  return {
    distribution: state.distribution,
    errorMessage: state.errorMessage,
    isLoading: state.isLoading,
    publisherCount: state.publisherCount,
    recalculateDistribution,
    rerunPromptVisible: state.rerunPromptVisible,
    startOver,
    updatePublisherCount,
    updateVehicleCount,
    updateVehicleCapacity,
    vehicleCount: state.vehicles.length,
    vehicles: state.vehicles,
  };
}

function createInitialResultsState(
  publisherCount: number,
  vehicleCount: number,
): ResultsState {
  return createResultsState(publisherCount, createDefaultVehicles(vehicleCount), false);
}

function createResultsState(
  publisherCount: number,
  vehicles: VehicleInput[],
  rerunPromptVisible: boolean,
): ResultsState {
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
      publisherCount,
      rerunPromptVisible,
      vehicles,
    };
  } catch (error) {
    return {
      distribution: null,
      errorMessage:
        error instanceof Error ? error.message : 'Unable to generate a distribution.',
      isLoading: false,
      publisherCount,
      rerunPromptVisible: false,
      vehicles,
    };
  }
}

function resizeVehicles(vehicles: VehicleInput[], vehicleCount: number) {
  if (vehicleCount <= vehicles.length) {
    return vehicles.slice(0, vehicleCount);
  }

  const additionalVehicles = createDefaultVehicles(vehicleCount).slice(vehicles.length);
  return [...vehicles, ...additionalVehicles];
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return parsedValue;
}
