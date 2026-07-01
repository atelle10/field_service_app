import {
  DEFAULT_APP_PREFERENCES,
  type AppPreferences,
  type DistributionResponse,
  type DistributionStrategyId,
  type PublisherProfile,
  type VehicleInput,
} from '@/models/group-assignment';
import {
  createDefaultVehicles,
  createDistributionSuggestion,
  createPlaceholderPassengers,
} from '@/services/group-assignment-service';
import {
  formatDefaultPublisherLabel,
  formatDefaultVehicleLabel,
  Language,
  type LanguageCode,
  translate,
} from '@/i18n';

export type ActiveResultsState = {
  distribution: DistributionResponse | null;
  errorMessage: string;
  isLoading: boolean;
  publisherCount: number;
  publisherProfiles: PublisherProfile[];
  passengerPublisherIds: Record<string, string>;
  rerunPromptVisible: boolean;
  serviceSelections: Record<string, number>;
  serviceViewEnabled: boolean;
  staleMessage: string;
  strategy: DistributionStrategyId;
  vehicles: VehicleInput[];
};

export type ResultsHistoryEntry = {
  id: string;
  createdAt: string;
  distribution: DistributionResponse;
  passengerPublisherIds: Record<string, string>;
  publisherCount: number;
  publisherProfiles: PublisherProfile[];
  strategy: DistributionStrategyId;
  vehicles: VehicleInput[];
};

export type GroupSessionState = {
  activeSession: ActiveResultsState | null;
  preferences: AppPreferences;
  publisherProfiles: PublisherProfile[];
  resultsHistory: ResultsHistoryEntry[];
  savedResults: ResultsHistoryEntry[];
};

export type DistributionValidationResult =
  | { ok: true; vehicles: VehicleInput[] }
  | { ok: false; errorMessage: string };

export function createEmptyGroupSessionState(): GroupSessionState {
  return {
    activeSession: null,
    preferences: DEFAULT_APP_PREFERENCES,
    publisherProfiles: [],
    resultsHistory: [],
    savedResults: [],
  };
}

export function validateNewDistribution(
  publisherCount: number,
  vehicleCount: number,
  defaultVehicleCapacity = DEFAULT_APP_PREFERENCES.defaultVehicleCapacity,
  strategy = DEFAULT_APP_PREFERENCES.distributionStrategy,
  language = DEFAULT_APP_PREFERENCES.language,
): DistributionValidationResult {
  const vehicles = createDefaultVehicles(
    vehicleCount,
    defaultVehicleCapacity,
    language,
  );
  const result = createCompletedResultsState(
    publisherCount,
    vehicles,
    false,
    strategy,
    [],
    {},
    language,
  );

  if (result.errorMessage) {
    return { ok: false, errorMessage: result.errorMessage };
  }

  return { ok: true, vehicles };
}

export function createLoadingResultsState(
  publisherCount: number,
  vehicles: VehicleInput[],
  rerunPromptVisible: boolean,
  strategy: DistributionStrategyId = DEFAULT_APP_PREFERENCES.distributionStrategy,
  publisherProfiles: PublisherProfile[] = [],
  passengerPublisherIds: Record<string, string> = {},
  language: LanguageCode = DEFAULT_APP_PREFERENCES.language,
): ActiveResultsState {
  const localizedVehicles = localizeDefaultVehicleLabels(vehicles, language);

  return {
    distribution: null,
    errorMessage: '',
    isLoading: true,
    passengerPublisherIds,
    publisherCount,
    publisherProfiles,
    rerunPromptVisible,
    serviceSelections: {},
    serviceViewEnabled: false,
    staleMessage: '',
    strategy,
    vehicles: localizedVehicles,
  };
}

export function createCompletedResultsState(
  publisherCount: number,
  vehicles: VehicleInput[],
  rerunPromptVisible: boolean,
  strategy: DistributionStrategyId = DEFAULT_APP_PREFERENCES.distributionStrategy,
  publisherProfiles: PublisherProfile[] = [],
  passengerPublisherIds: Record<string, string> = {},
  language: LanguageCode = DEFAULT_APP_PREFERENCES.language,
): ActiveResultsState {
  try {
    const localizedVehicles = localizeDefaultVehicleLabels(vehicles, language);
    const distribution = createDistributionSuggestion({
      language,
      passengers: createPlaceholderPassengers(publisherCount, language),
      vehicles: localizedVehicles,
      strategy,
    });

    return {
      distribution,
      errorMessage: '',
      isLoading: false,
      passengerPublisherIds,
      publisherCount,
      publisherProfiles,
      rerunPromptVisible,
      serviceSelections: {},
      serviceViewEnabled: false,
      staleMessage: '',
      strategy,
      vehicles: localizedVehicles,
    };
  } catch (error) {
    const localizedVehicles = localizeDefaultVehicleLabels(vehicles, language);

    return {
      distribution: null,
      errorMessage:
        error instanceof Error
          ? error.message
          : translate(language, 'unableToGenerateDistribution'),
      isLoading: false,
      passengerPublisherIds,
      publisherCount,
      publisherProfiles,
      rerunPromptVisible: false,
      serviceSelections: {},
      serviceViewEnabled: false,
      staleMessage: '',
      strategy,
      vehicles: localizedVehicles,
    };
  }
}

export function completeActiveCalculation(
  sessionState: GroupSessionState,
  publisherCount: number,
  vehicles: VehicleInput[],
  rerunPromptVisible: boolean,
  strategy: DistributionStrategyId,
  historyMetadata: { createdAt: string; id: string },
  publisherProfiles: PublisherProfile[] = [],
  passengerPublisherIds: Record<string, string> = {},
): GroupSessionState {
  const activeSession = createCompletedResultsState(
    publisherCount,
    vehicles,
    rerunPromptVisible,
    strategy,
    publisherProfiles,
    passengerPublisherIds,
    sessionState.preferences.language,
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
    preferences: sessionState.preferences,
    publisherProfiles: activeSession.publisherProfiles,
    resultsHistory: historyEntry
      ? [...sessionState.resultsHistory, historyEntry]
      : sessionState.resultsHistory,
    savedResults: sessionState.savedResults,
  };
}

export function markResultsStale(
  state: ActiveResultsState,
  language: LanguageCode = DEFAULT_APP_PREFERENCES.language,
): ActiveResultsState {
  const overCapacityMessage = createOverCapacityMessage(state, language);

  return {
    ...state,
    rerunPromptVisible: true,
    staleMessage:
      overCapacityMessage ??
      translate(language, 'selectionsChanged'),
  };
}

export function updatePreferencesInSessionState(
  state: GroupSessionState,
  preferences: AppPreferences,
): GroupSessionState {
  const strategyChanged =
    state.preferences.distributionStrategy !== preferences.distributionStrategy;
  const languageChanged = state.preferences.language !== preferences.language;
  const localizedActiveSession =
    languageChanged && state.activeSession
      ? localizeActiveSessionDefaultLabels(
          state.activeSession,
          state.preferences.language,
          preferences.language,
        )
      : state.activeSession;
  const activeSession =
    strategyChanged && localizedActiveSession
      ? markResultsStale(
          {
          ...localizedActiveSession,
          errorMessage: '',
          strategy: preferences.distributionStrategy,
          },
          preferences.language,
        )
      : localizedActiveSession;

  return {
    ...state,
    activeSession,
    preferences,
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

export function createActiveResultsStateFromHistoryEntry(
  entry: ResultsHistoryEntry,
): ActiveResultsState {
  return {
    distribution: entry.distribution,
    errorMessage: '',
    isLoading: false,
    passengerPublisherIds: entry.passengerPublisherIds,
    publisherCount: entry.publisherCount,
    publisherProfiles: entry.publisherProfiles,
    rerunPromptVisible: false,
    serviceSelections: {},
    serviceViewEnabled: false,
    staleMessage: '',
    strategy: entry.strategy,
    vehicles: entry.vehicles,
  };
}

export function enableServiceViewInResultsState(
  state: ActiveResultsState,
): ActiveResultsState {
  if (!state.distribution || state.serviceViewEnabled) {
    return state;
  }

  return {
    ...state,
    serviceViewEnabled: true,
  };
}

export function disableServiceViewInResultsState(
  state: ActiveResultsState,
): ActiveResultsState {
  if (!state.serviceViewEnabled) {
    return state;
  }

  return {
    ...state,
    serviceViewEnabled: false,
  };
}

export function incrementServiceSelectionInResultsState(
  state: ActiveResultsState,
  passengerId: string,
): ActiveResultsState {
  if (!state.serviceViewEnabled || !isPassengerAssigned(state, passengerId)) {
    return state;
  }

  return {
    ...state,
    serviceSelections: {
      ...state.serviceSelections,
      [passengerId]: (state.serviceSelections[passengerId] ?? 0) + 1,
    },
  };
}

export function deleteResultHistoryEntryFromSessionState(
  state: GroupSessionState,
  resultId: string,
): GroupSessionState {
  const savedResults = state.savedResults.filter((result) => result.id !== resultId);

  if (savedResults.length === state.savedResults.length) {
    return state;
  }

  return {
    ...state,
    savedResults,
  };
}

export function deleteAllSavedResultsFromSessionState(
  state: GroupSessionState,
): GroupSessionState {
  if (state.savedResults.length === 0) {
    return state;
  }

  return {
    ...state,
    savedResults: [],
  };
}

export function restoreResultHistoryEntryInSessionState(
  state: GroupSessionState,
  resultId: string,
): GroupSessionState {
  const savedResult = state.savedResults.find((result) => result.id === resultId);

  if (!savedResult) {
    return state;
  }

  const activeSession = createActiveResultsStateFromHistoryEntry(savedResult);

  return {
    ...state,
    activeSession,
    publisherProfiles: mergePublisherProfiles(
      state.publisherProfiles,
      activeSession.publisherProfiles,
    ),
  };
}

export function getHistoryPassengerDisplayName(
  entry: ResultsHistoryEntry,
  passengerId: string,
  language: LanguageCode = DEFAULT_APP_PREFERENCES.language,
) {
  const publisherId = entry.passengerPublisherIds[passengerId];
  const publisher = entry.publisherProfiles.find((profile) => profile.id === publisherId);

  return publisher?.name ?? formatPlaceholderPassengerLabel(passengerId, language);
}

export function movePassengerToVehicleInResultsState(
  state: ActiveResultsState,
  passengerId: string,
  targetVehicleId: string,
): ActiveResultsState {
  if (!state.distribution) {
    return state;
  }

  const sourceAssignment = state.distribution.assignments.find((assignment) =>
    assignment.passengerIds.includes(passengerId),
  );
  const targetAssignment = state.distribution.assignments.find(
    (assignment) => assignment.vehicleId === targetVehicleId,
  );

  if (
    !sourceAssignment ||
    !targetAssignment ||
    sourceAssignment.vehicleId === targetVehicleId ||
    targetAssignment.passengerIds.length >= targetAssignment.capacity
  ) {
    return state;
  }

  const assignments = state.distribution.assignments.map((assignment) => {
    if (assignment.vehicleId === sourceAssignment.vehicleId) {
      const passengerIds = assignment.passengerIds.filter(
        (assignmentPassengerId) => assignmentPassengerId !== passengerId,
      );

      return {
        ...assignment,
        inUse: passengerIds.length > 0,
        passengerIds,
      };
    }

    if (assignment.vehicleId === targetVehicleId) {
      return {
        ...assignment,
        inUse: true,
        passengerIds: [...assignment.passengerIds, passengerId],
      };
    }

    return assignment;
  });

  return {
    ...state,
    distribution: {
      ...state.distribution,
      assignments,
      summary: {
        ...state.distribution.summary,
        vehiclesUsed: assignments.filter((assignment) => assignment.inUse).length,
      },
    },
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

export function addPublisherProfileToSessionState(
  state: GroupSessionState,
  name: string,
): GroupSessionState {
  const nextName = normalizePublisherName(name);

  if (!nextName) {
    return state;
  }

  const existingProfile = state.publisherProfiles.find(
    (publisher) =>
      normalizePublisherNameForCompare(publisher.name) ===
      normalizePublisherNameForCompare(nextName),
  );

  if (existingProfile) {
    return state;
  }

  const nextProfile = {
    id: createUniquePublisherProfileId(state.publisherProfiles),
    name: nextName,
  };
  const publisherProfiles = [...state.publisherProfiles, nextProfile];

  return {
    ...state,
    activeSession: state.activeSession
      ? {
          ...state.activeSession,
          publisherProfiles,
        }
      : state.activeSession,
    publisherProfiles,
  };
}

export function removePublisherProfileFromSessionState(
  state: GroupSessionState,
  publisherId: string,
): GroupSessionState {
  const publisherExists = state.publisherProfiles.some(
    (publisher) => publisher.id === publisherId,
  );

  if (!publisherExists) {
    return state;
  }

  const publisherProfiles = state.publisherProfiles.filter(
    (publisher) => publisher.id !== publisherId,
  );
  const activeSession = state.activeSession
    ? {
        ...state.activeSession,
        passengerPublisherIds: removePublisherMappings(
          state.activeSession.passengerPublisherIds,
          new Set([publisherId]),
        ),
        publisherProfiles,
      }
    : state.activeSession;

  return {
    ...state,
    activeSession,
    publisherProfiles,
  };
}

export function deleteAllPublisherProfilesFromSessionState(
  state: GroupSessionState,
): GroupSessionState {
  if (state.publisherProfiles.length === 0) {
    return state;
  }

  const publisherIds = new Set(state.publisherProfiles.map((publisher) => publisher.id));

  return {
    ...state,
    activeSession: state.activeSession
      ? {
          ...state.activeSession,
          passengerPublisherIds: removePublisherMappings(
            state.activeSession.passengerPublisherIds,
            publisherIds,
          ),
          publisherProfiles: [],
        }
      : state.activeSession,
    publisherProfiles: [],
  };
}

export function getPassengerDisplayName(
  state: ActiveResultsState,
  passengerId: string,
  language: LanguageCode = DEFAULT_APP_PREFERENCES.language,
) {
  const publisherId = state.passengerPublisherIds[passengerId];
  const publisher = state.publisherProfiles.find((profile) => profile.id === publisherId);

  return publisher?.name ?? formatPlaceholderPassengerLabel(passengerId, language);
}

export function resizeVehicles(
  vehicles: VehicleInput[],
  vehicleCount: number,
  defaultVehicleCapacity = DEFAULT_APP_PREFERENCES.defaultVehicleCapacity,
  language: LanguageCode = DEFAULT_APP_PREFERENCES.language,
) {
  if (vehicleCount <= vehicles.length) {
    return vehicles.slice(0, vehicleCount);
  }

  const additionalVehicles = createDefaultVehicles(
    vehicleCount,
    defaultVehicleCapacity,
    language,
  ).slice(vehicles.length);
  return [...vehicles, ...additionalVehicles];
}

function createPublisherProfileId(index: number) {
  return `publisher-profile-${index}`;
}

function createUniquePublisherProfileId(publisherProfiles: PublisherProfile[]) {
  const existingIds = new Set(publisherProfiles.map((publisher) => publisher.id));
  let index = publisherProfiles.length + 1;
  let nextId = createPublisherProfileId(index);

  while (existingIds.has(nextId)) {
    index += 1;
    nextId = createPublisherProfileId(index);
  }

  return nextId;
}

function formatPlaceholderPassengerLabel(
  passengerId: string,
  language: LanguageCode,
) {
  const index = Number(passengerId.replace('publisher-', ''));

  if (Number.isInteger(index) && index > 0) {
    return formatDefaultPublisherLabel(language, index);
  }

  return passengerId;
}

function removePublisherMappings(
  passengerPublisherIds: Record<string, string>,
  publisherIds: Set<string>,
) {
  return Object.fromEntries(
    Object.entries(passengerPublisherIds).filter(
      ([, publisherId]) => !publisherIds.has(publisherId),
    ),
  );
}

function mergePublisherProfiles(
  existingProfiles: PublisherProfile[],
  incomingProfiles: PublisherProfile[],
) {
  const mergedProfiles = [...existingProfiles];

  for (const incomingProfile of incomingProfiles) {
    const alreadyExists = mergedProfiles.some(
      (profile) =>
        normalizePublisherNameForCompare(profile.name) ===
        normalizePublisherNameForCompare(incomingProfile.name),
    );

    if (!alreadyExists) {
      mergedProfiles.push(incomingProfile);
    }
  }

  return mergedProfiles;
}

function isPassengerAssigned(state: ActiveResultsState, passengerId: string) {
  return Boolean(
    state.distribution?.assignments.some((assignment) =>
      assignment.passengerIds.includes(passengerId),
    ),
  );
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
    strategy: activeSession.strategy,
    vehicles: activeSession.vehicles,
    distribution,
  };
}

function localizeActiveSessionDefaultLabels(
  state: ActiveResultsState,
  previousLanguage: LanguageCode,
  nextLanguage: LanguageCode,
): ActiveResultsState {
  const vehicles = localizeDefaultVehicleLabels(
    state.vehicles,
    nextLanguage,
    previousLanguage,
  );

  return {
    ...state,
    distribution: state.distribution
      ? {
          ...state.distribution,
          assignments: state.distribution.assignments.map((assignment) => {
            const vehicle = vehicles.find(
              (nextVehicle) => nextVehicle.id === assignment.vehicleId,
            );

            return vehicle ? { ...assignment, label: vehicle.label } : assignment;
          }),
        }
      : state.distribution,
    vehicles,
  };
}

function localizeDefaultVehicleLabels(
  vehicles: VehicleInput[],
  nextLanguage: LanguageCode,
  previousLanguage: LanguageCode = Language.English,
) {
  return vehicles.map((vehicle) => {
    const index = getDefaultVehicleIndex(vehicle);

    if (
      index === null ||
      (vehicle.label !== formatDefaultVehicleLabel(previousLanguage, index) &&
        vehicle.label !== formatDefaultVehicleLabel(Language.English, index) &&
        vehicle.label !== formatDefaultVehicleLabel(Language.Spanish, index))
    ) {
      return vehicle;
    }

    return {
      ...vehicle,
      label: formatDefaultVehicleLabel(nextLanguage, index),
    };
  });
}

function getDefaultVehicleIndex(vehicle: VehicleInput) {
  const match = /^vehicle-(\d+)$/.exec(vehicle.id);

  if (!match) {
    return null;
  }

  const index = Number(match[1]);
  return Number.isInteger(index) && index > 0 ? index : null;
}

function createOverCapacityMessage(
  state: ActiveResultsState,
  language: LanguageCode,
) {
  const assignments = state.distribution?.assignments ?? [];

  for (const vehicle of state.vehicles) {
    const assignment = assignments.find(
      (vehicleAssignment) => vehicleAssignment.vehicleId === vehicle.id,
    );
    const assignedCount = assignment?.passengerIds.length ?? 0;

    if (assignedCount > vehicle.capacity) {
      return language === Language.Spanish
        ? `${vehicle.label} tiene ${assignedCount} publicadores asignados, pero solo ${vehicle.capacity} asientos. Toca Recalcular para corregir la distribución.`
        : `${vehicle.label} has ${assignedCount} publishers assigned but only ${vehicle.capacity} seats. Press Recalculate to fix the distribution.`;
    }
  }

  return null;
}
