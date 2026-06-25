import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

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

const MIN_CALCULATION_LOADING_MS = 2000;

type ResultsState = {
  distribution: DistributionResponse | null;
  errorMessage: string;
  isLoading: boolean;
  publisherCount: number;
  rerunPromptVisible: boolean;
  staleMessage: string;
  vehicles: VehicleInput[];
};

export function useResultsController() {
  const { publishers, vehicles: vehicleParam } = useLocalSearchParams<{
    publishers?: string;
    vehicles?: string;
  }>();
  const initialPublisherCount = parsePositiveInteger(publishers, 1);
  const initialVehicleCount = parsePositiveInteger(vehicleParam, 1);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const calculationIdRef = useRef(0);
  const [state, setState] = useState<ResultsState>(() =>
    createInitialResultsState(initialPublisherCount, initialVehicleCount),
  );

  const scheduleCalculationResult = useCallback(
    (
      calculationId: number,
      publisherCount: number,
      vehicles: VehicleInput[],
      rerunPromptVisible: boolean,
    ) => {
      const startedAt = Date.now();
      const nextState = createResultsState(publisherCount, vehicles, rerunPromptVisible);
      const remainingDelay = Math.max(
        MIN_CALCULATION_LOADING_MS - (Date.now() - startedAt),
        0,
      );

      timeoutRef.current = setTimeout(() => {
        if (calculationIdRef.current !== calculationId) {
          return;
        }

        setState(nextState);
        timeoutRef.current = null;
      }, remainingDelay);
    },
    [],
  );

  const calculateDistribution = useCallback(
    (publisherCount: number, vehicles: VehicleInput[], rerunPromptVisible: boolean) => {
      const calculationId = calculationIdRef.current + 1;
      calculationIdRef.current = calculationId;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setState(createLoadingResultsState(publisherCount, vehicles, rerunPromptVisible));
      scheduleCalculationResult(calculationId, publisherCount, vehicles, rerunPromptVisible);
    },
    [scheduleCalculationResult],
  );

  useEffect(() => {
    const calculationId = calculationIdRef.current + 1;
    calculationIdRef.current = calculationId;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    scheduleCalculationResult(
      calculationId,
      initialPublisherCount,
      createDefaultVehicles(initialVehicleCount),
      false,
    );
  }, [scheduleCalculationResult, initialPublisherCount, initialVehicleCount]);

  useEffect(
    () => () => {
      calculationIdRef.current += 1;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const updatePublisherCount = (publisherCount: number) => {
    setState((currentState) =>
      markResultsStale({
        ...currentState,
        errorMessage: '',
        publisherCount,
      }),
    );
  };

  const updateVehicleCount = (vehicleCount: number) => {
    setState((currentState) =>
      markResultsStale({
        ...currentState,
        errorMessage: '',
        vehicles: resizeVehicles(currentState.vehicles, vehicleCount),
      }),
    );
  };

  const updateVehicleCapacity = (vehicleId: string, capacity: number) => {
    setState((currentState) =>
      markResultsStale({
        ...currentState,
        errorMessage: '',
        vehicles: currentState.vehicles.map((vehicle) =>
          vehicle.id === vehicleId ? { ...vehicle, capacity: Math.max(0, capacity) } : vehicle,
        ),
      }),
    );
  };

  const recalculateDistribution = () => {
    if (!state.rerunPromptVisible) {
      return;
    }

    calculateDistribution(state.publisherCount, state.vehicles, false);
  };

  const startOver = () => {
    router.replace('/select');
  };

  const goHome = () => {
    return;
  };

  return {
    distribution: state.distribution,
    errorMessage: state.errorMessage,
    goHome,
    isLoading: state.isLoading,
    publisherCount: state.publisherCount,
    recalculateDistribution,
    rerunPromptVisible: state.rerunPromptVisible,
    startOver,
    staleMessage: state.staleMessage,
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
  return createLoadingResultsState(
    publisherCount,
    createDefaultVehicles(vehicleCount),
    false,
  );
}

function createLoadingResultsState(
  publisherCount: number,
  vehicles: VehicleInput[],
  rerunPromptVisible: boolean,
): ResultsState {
  return {
    distribution: null,
    errorMessage: '',
    isLoading: true,
    publisherCount,
    rerunPromptVisible,
    staleMessage: '',
    vehicles,
  };
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
      staleMessage: '',
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
      staleMessage: '',
      vehicles,
    };
  }
}

function markResultsStale(state: ResultsState): ResultsState {
  const overCapacityMessage = createOverCapacityMessage(state);

  return {
    ...state,
    rerunPromptVisible: true,
    staleMessage:
      overCapacityMessage ??
      'Selections changed - press Recalculate to update this distribution.',
  };
}

function createOverCapacityMessage(state: ResultsState) {
  const assignments = state.distribution?.assignments ?? [];

  for (const vehicle of state.vehicles) {
    const assignment = assignments.find(
      (vehicleAssignment) => vehicleAssignment.vehicleId === vehicle.id,
    );
    const assignedCount = assignment?.passengerIds.length ?? 0;

    if (assignedCount > vehicle.capacity) {
      return `${vehicle.label} has ${assignedCount} publishers assigned but only ${vehicle.capacity} seats. Press Recalculate to fix the distribution.`;
    }
  }

  return null;
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
