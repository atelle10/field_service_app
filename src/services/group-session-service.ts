import {
  DistributionStrategy,
  type DistributionResponse,
  type PublisherProfile,
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
  publisherProfiles: PublisherProfile[];
  passengerPublisherIds: Record<string, string>;
  rerunPromptVisible: boolean;
  staleMessage: string;
  vehicles: VehicleInput[];
};

export type ResultsHistoryEntry = {
  id: string;
  createdAt: string;
  distribution: DistributionResponse;
  passengerPublisherIds: Record<string, string>;
  publisherCount: number;
  publisherProfiles: PublisherProfile[];
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
  publisherProfiles: PublisherProfile[] = [],
  passengerPublisherIds: Record<string, string> = {},
): ActiveResultsState {
  return {
    distribution: null,
    errorMessage: '',
    isLoading: true,
    passengerPublisherIds,
    publisherCount,
    publisherProfiles,
    rerunPromptVisible,
    staleMessage: '',
    vehicles,
  };
}

export function createCompletedResultsState(
  publisherCount: number,
  vehicles: VehicleInput[],
  rerunPromptVisible: boolean,
  publisherProfiles: PublisherProfile[] = [],
  passengerPublisherIds: Record<string, string> = {},
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
      passengerPublisherIds,
      publisherCount,
      publisherProfiles,
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
      passengerPublisherIds,
      publisherCount,
      publisherProfiles,
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
  publisherProfiles: PublisherProfile[] = [],
  passengerPublisherIds: Record<string, string> = {},
): GroupSessionState {
  const activeSession = createCompletedResultsState(
    publisherCount,
    vehicles,
    rerunPromptVisible,
    publisherProfiles,
    passengerPublisherIds,
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

export function updateVehicleLabelInResultsState(
  state: ActiveResultsState,
  vehicleId: string,
  label: string,
): ActiveResultsState {
  const nextLabel = label.trim();

  if (!nextLabel) {
    return state;
  }

  return {
    ...state,
    distribution: state.distribution
      ? {
          ...state.distribution,
          assignments: state.distribution.assignments.map((assignment) =>
            assignment.vehicleId === vehicleId
              ? { ...assignment, label: nextLabel }
              : assignment,
          ),
        }
      : state.distribution,
    vehicles: state.vehicles.map((vehicle) =>
      vehicle.id === vehicleId ? { ...vehicle, label: nextLabel } : vehicle,
    ),
  };
}

export function assignPublisherNameInResultsState(
  state: ActiveResultsState,
  passengerId: string,
  name: string,
): ActiveResultsState {
  const nextName = normalizePublisherName(name);

  if (!nextName) {
    return state;
  }

  const existingProfile = state.publisherProfiles.find(
    (publisher) =>
      normalizePublisherNameForCompare(publisher.name) ===
      normalizePublisherNameForCompare(nextName),
  );
  const nextProfile = existingProfile ?? {
    id: createPublisherProfileId(state.publisherProfiles.length + 1),
    name: nextName,
  };
  const publisherProfiles = existingProfile
    ? state.publisherProfiles
    : [...state.publisherProfiles, nextProfile];

  return {
    ...state,
    passengerPublisherIds: {
      ...state.passengerPublisherIds,
      [passengerId]: nextProfile.id,
    },
    publisherProfiles,
  };
}

export function assignPublisherProfileInResultsState(
  state: ActiveResultsState,
  passengerId: string,
  publisherId: string,
): ActiveResultsState {
  const publisherExists = state.publisherProfiles.some(
    (publisher) => publisher.id === publisherId,
  );

  if (!publisherExists) {
    return state;
  }

  return {
    ...state,
    passengerPublisherIds: {
      ...state.passengerPublisherIds,
      [passengerId]: publisherId,
    },
  };
}

export function restorePassengerDefaultLabelInResultsState(
  state: ActiveResultsState,
  passengerId: string,
): ActiveResultsState {
  if (!state.passengerPublisherIds[passengerId]) {
    return state;
  }

  const { [passengerId]: _removedPublisherId, ...passengerPublisherIds } =
    state.passengerPublisherIds;

  return {
    ...state,
    passengerPublisherIds,
  };
}

export function getPassengerDisplayName(state: ActiveResultsState, passengerId: string) {
  const publisherId = state.passengerPublisherIds[passengerId];
  const publisher = state.publisherProfiles.find((profile) => profile.id === publisherId);

  return publisher?.name ?? formatPlaceholderPassengerLabel(passengerId);
}

export function resizeVehicles(vehicles: VehicleInput[], vehicleCount: number) {
  if (vehicleCount <= vehicles.length) {
    return vehicles.slice(0, vehicleCount);
  }

  const additionalVehicles = createDefaultVehicles(vehicleCount).slice(vehicles.length);
  return [...vehicles, ...additionalVehicles];
}

function createPublisherProfileId(index: number) {
  return `publisher-profile-${index}`;
}

function formatPlaceholderPassengerLabel(passengerId: string) {
  return passengerId.replace('publisher-', 'Publisher ');
}

function normalizePublisherName(name: string) {
  return name.trim().replace(/\s+/g, ' ');
}

function normalizePublisherNameForCompare(name: string) {
  return normalizePublisherName(name).toLocaleLowerCase();
}

function createResultsHistoryEntry(
  activeSession: ActiveResultsState,
  distribution: DistributionResponse,
  metadata: { createdAt: string; id: string },
): ResultsHistoryEntry {
  return {
    id: metadata.id,
    createdAt: metadata.createdAt,
    passengerPublisherIds: activeSession.passengerPublisherIds,
    publisherCount: activeSession.publisherCount,
    publisherProfiles: activeSession.publisherProfiles,
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
