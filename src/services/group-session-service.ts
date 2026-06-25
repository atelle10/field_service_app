import {
  DistributionStrategy,
  type DistributionResponse,
  type VehicleInput,
} from '@/models/group-assignment';
import {
  createDefaultVehicles,
  createDistributionSuggestion,
  createPlaceholderPassengers,
} from '@/services/group-assignment-service';

export type ActiveResultsState = {
  distribution: DistributionResponse | null;
  errorMessage: string;
  isLoading: boolean;
  publisherCount: number;
  rerunPromptVisible: boolean;
  staleMessage: string;
  vehicles: VehicleInput[];
};

export type ResultsHistoryEntry = {
  id: string;
  createdAt: string;
  distribution: DistributionResponse;
  publisherCount: number;
  vehicles: VehicleInput[];
};

export type GroupSessionState = {
  activeSession: ActiveResultsState | null;
  resultsHistory: ResultsHistoryEntry[];
};

export type DistributionValidationResult =
  | { ok: true; vehicles: VehicleInput[] }
  | { ok: false; errorMessage: string };

export function createEmptyGroupSessionState(): GroupSessionState {
  return {
    activeSession: null,
    resultsHistory: [],
  };
}

export function validateNewDistribution(
  publisherCount: number,
  vehicleCount: number,
): DistributionValidationResult {
  const vehicles = createDefaultVehicles(vehicleCount);
  const result = createCompletedResultsState(publisherCount, vehicles, false);

  if (result.errorMessage) {
    return { ok: false, errorMessage: result.errorMessage };
  }

  return { ok: true, vehicles };
}

export function createLoadingResultsState(
  publisherCount: number,
  vehicles: VehicleInput[],
  rerunPromptVisible: boolean,
): ActiveResultsState {
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

export function createCompletedResultsState(
  publisherCount: number,
  vehicles: VehicleInput[],
  rerunPromptVisible: boolean,
): ActiveResultsState {
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

export function completeActiveCalculation(
  sessionState: GroupSessionState,
  publisherCount: number,
  vehicles: VehicleInput[],
  rerunPromptVisible: boolean,
  historyMetadata: { createdAt: string; id: string },
): GroupSessionState {
  const activeSession = createCompletedResultsState(
    publisherCount,
    vehicles,
    rerunPromptVisible,
  );
  const historyEntry =
    activeSession.distribution === null
      ? null
      : createResultsHistoryEntry(
          activeSession,
          activeSession.distribution,
          historyMetadata,
        );

  return {
    activeSession,
    resultsHistory: historyEntry
      ? [...sessionState.resultsHistory, historyEntry]
      : sessionState.resultsHistory,
  };
}

export function markResultsStale(state: ActiveResultsState): ActiveResultsState {
  const overCapacityMessage = createOverCapacityMessage(state);

  return {
    ...state,
    rerunPromptVisible: true,
    staleMessage:
      overCapacityMessage ??
      'Selections changed - press Recalculate to update this distribution.',
  };
}

export function resizeVehicles(vehicles: VehicleInput[], vehicleCount: number) {
  if (vehicleCount <= vehicles.length) {
    return vehicles.slice(0, vehicleCount);
  }

  const additionalVehicles = createDefaultVehicles(vehicleCount).slice(vehicles.length);
  return [...vehicles, ...additionalVehicles];
}

function createResultsHistoryEntry(
  activeSession: ActiveResultsState,
  distribution: DistributionResponse,
  metadata: { createdAt: string; id: string },
): ResultsHistoryEntry {
  return {
    id: metadata.id,
    createdAt: metadata.createdAt,
    publisherCount: activeSession.publisherCount,
    vehicles: activeSession.vehicles,
    distribution,
  };
}

function createOverCapacityMessage(state: ActiveResultsState) {
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
