import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { VehicleInput } from '@/models/group-assignment';
import {
  clearPersistentStorage,
  getPersistentStorageUsage,
  loadPersistedGroupData,
  mergePersistedPublishers,
  savePublisherProfiles,
  saveResultHistoryEntry,
} from '@/services/persistent-storage-service';
import {
  type ActiveResultsState,
  addPublisherProfileToSessionState,
  assignPublisherNameInResultsState,
  assignPublisherProfileInResultsState,
  completeActiveCalculation,
  createEmptyGroupSessionState,
  createLoadingResultsState,
  deleteAllPublisherProfilesFromSessionState,
  type GroupSessionState,
  markResultsStale,
  removePublisherProfileFromSessionState,
  restorePassengerDefaultLabelInResultsState,
  resizeVehicles,
  type ResultsHistoryEntry,
  updateVehicleLabelInResultsState,
  validateNewDistribution,
} from '@/services/group-session-service';

const MIN_CALCULATION_LOADING_MS = 2000;

type BeginDistributionResult =
  | { ok: true }
  | { ok: false; errorMessage: string };

export type StorageActionFeedback = {
  message: string;
  title: string;
  tone: 'error' | 'success';
};

type GroupSessionContextValue = {
  activeSession: ActiveResultsState | null;
  addPublisherProfile: (name: string) => void;
  assignPublisherName: (passengerId: string, name: string) => void;
  assignPublisherProfile: (passengerId: string, publisherId: string) => void;
  beginNewDistribution: (
    publisherCount: number,
    vehicleCount: number,
  ) => BeginDistributionResult;
  clearPersistentCache: () => Promise<void>;
  deleteAllPublisherProfiles: () => void;
  dismissStorageActionFeedback: () => void;
  hasActiveSession: boolean;
  publisherProfiles: ActiveResultsState['publisherProfiles'];
  recalculateDistribution: () => void;
  removePublisherProfile: (publisherId: string) => void;
  restorePassengerDefaultLabel: (passengerId: string) => void;
  resultsHistory: ResultsHistoryEntry[];
  refreshStorageUsage: () => Promise<void>;
  saveCurrentResult: () => Promise<void>;
  storageActionFeedback: StorageActionFeedback | null;
  storageUsageBytes: number;
  updatePublisherCount: (publisherCount: number) => void;
  updateVehicleCapacity: (vehicleId: string, capacity: number) => void;
  updateVehicleCount: (vehicleCount: number) => void;
  updateVehicleLabel: (vehicleId: string, label: string) => void;
};

const GroupSessionContext = createContext<GroupSessionContextValue | null>(null);

export function GroupSessionProvider({ children }: { children: ReactNode }) {
  const calculationIdRef = useRef(0);
  const historyIdRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<GroupSessionState>(() =>
    createEmptyGroupSessionState(),
  );
  const [storageUsageBytes, setStorageUsageBytes] = useState(0);
  const [storageActionFeedback, setStorageActionFeedback] =
    useState<StorageActionFeedback | null>(null);

  const refreshStorageUsage = useCallback(async () => {
    const nextStorageUsageBytes = await getPersistentStorageUsage();
    setStorageUsageBytes(nextStorageUsageBytes);
  }, []);

  const persistPublisherProfiles = useCallback(
    async (publisherProfiles: ActiveResultsState['publisherProfiles']) => {
      const nextStorageUsageBytes = await savePublisherProfiles(publisherProfiles);
      setStorageUsageBytes(nextStorageUsageBytes);
    },
    [],
  );

  const clearPersistentCache = useCallback(async () => {
    try {
      const nextStorageUsageBytes = await clearPersistentStorage();
      setStorageUsageBytes(nextStorageUsageBytes);
      setState((currentState) => ({
        ...currentState,
        activeSession: currentState.activeSession
          ? {
              ...currentState.activeSession,
              passengerPublisherIds: {},
              publisherProfiles: [],
            }
          : currentState.activeSession,
        publisherProfiles: [],
      }));
      setStorageActionFeedback({
        message: 'Stored publishers and saved results were removed from this device.',
        title: 'Cache cleared',
        tone: 'success',
      });
    } catch (error) {
      setStorageActionFeedback({
        message: getStorageActionErrorMessage(error),
        title: 'Cache could not be cleared',
        tone: 'error',
      });
    }
  }, []);

  const dismissStorageActionFeedback = useCallback(() => {
    setStorageActionFeedback(null);
  }, []);

  const scheduleCalculationResult = useCallback(
    (
      calculationId: number,
      publisherCount: number,
      vehicles: VehicleInput[],
      rerunPromptVisible: boolean,
      publisherProfiles: ActiveResultsState['publisherProfiles'],
      passengerPublisherIds: ActiveResultsState['passengerPublisherIds'],
    ) => {
      const startedAt = Date.now();
      const remainingDelay = Math.max(
        MIN_CALCULATION_LOADING_MS - (Date.now() - startedAt),
        0,
      );

      timeoutRef.current = setTimeout(() => {
        if (calculationIdRef.current !== calculationId) {
          return;
        }

        const historyId = historyIdRef.current + 1;
        historyIdRef.current = historyId;

        setState((currentState) => {
          const completedState = completeActiveCalculation(
            currentState,
            publisherCount,
            vehicles,
            rerunPromptVisible,
            {
              createdAt: new Date().toISOString(),
              id: `result-${historyId}`,
            },
            publisherProfiles,
            passengerPublisherIds,
          );
          const nextPublisherProfiles = mergePersistedPublishers(
            completedState.publisherProfiles,
            currentState.publisherProfiles,
          );

          return {
            ...completedState,
            activeSession: completedState.activeSession
              ? {
                  ...completedState.activeSession,
                  publisherProfiles: nextPublisherProfiles,
                }
              : completedState.activeSession,
            publisherProfiles: nextPublisherProfiles,
          };
        });
        timeoutRef.current = null;
      }, remainingDelay);
    },
    [],
  );

  const calculateDistribution = useCallback(
    (
      publisherCount: number,
      vehicles: VehicleInput[],
      rerunPromptVisible: boolean,
      publisherProfiles: ActiveResultsState['publisherProfiles'] = [],
      passengerPublisherIds: ActiveResultsState['passengerPublisherIds'] = {},
    ) => {
      const calculationId = calculationIdRef.current + 1;
      calculationIdRef.current = calculationId;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setState((currentState) => ({
        ...currentState,
        activeSession: createLoadingResultsState(
          publisherCount,
          vehicles,
          rerunPromptVisible,
          publisherProfiles,
          passengerPublisherIds,
        ),
      }));
      scheduleCalculationResult(
        calculationId,
        publisherCount,
        vehicles,
        rerunPromptVisible,
        publisherProfiles,
        passengerPublisherIds,
      );
    },
    [scheduleCalculationResult],
  );

  useEffect(
    () => () => {
      calculationIdRef.current += 1;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    let mounted = true;

    loadPersistedGroupData()
      .then((persistedData) => {
        if (!mounted) {
          return;
        }

        setState((currentState) => ({
          ...currentState,
          activeSession: currentState.activeSession
            ? {
                ...currentState.activeSession,
                publisherProfiles: mergePersistedPublishers(
                  currentState.activeSession.publisherProfiles,
                  persistedData.publisherProfiles,
                ),
              }
            : currentState.activeSession,
          publisherProfiles: mergePersistedPublishers(
            currentState.publisherProfiles,
            persistedData.publisherProfiles,
          ),
        }));
        setStorageUsageBytes(persistedData.storageUsageBytes);
      })
      .catch(() => {
        if (mounted) {
          setStorageUsageBytes(0);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const beginNewDistribution = (
    publisherCount: number,
    vehicleCount: number,
  ): BeginDistributionResult => {
    const validationResult = validateNewDistribution(publisherCount, vehicleCount);

    if (!validationResult.ok) {
      return { ok: false, errorMessage: validationResult.errorMessage };
    }

    calculateDistribution(
      publisherCount,
      validationResult.vehicles,
      false,
      state.publisherProfiles,
    );
    return { ok: true };
  };

  const updatePublisherCount = (publisherCount: number) => {
    setState((currentState) => {
      if (!currentState.activeSession) {
        return currentState;
      }

      return {
        ...currentState,
        activeSession: markResultsStale({
          ...currentState.activeSession,
          errorMessage: '',
          publisherCount,
        }),
      };
    });
  };

  const updateVehicleCount = (vehicleCount: number) => {
    setState((currentState) => {
      if (!currentState.activeSession) {
        return currentState;
      }

      return {
        ...currentState,
        activeSession: markResultsStale({
          ...currentState.activeSession,
          errorMessage: '',
          vehicles: resizeVehicles(currentState.activeSession.vehicles, vehicleCount),
        }),
      };
    });
  };

  const updateVehicleCapacity = (vehicleId: string, capacity: number) => {
    setState((currentState) => {
      if (!currentState.activeSession) {
        return currentState;
      }

      return {
        ...currentState,
        activeSession: markResultsStale({
          ...currentState.activeSession,
          errorMessage: '',
          vehicles: currentState.activeSession.vehicles.map((vehicle) =>
            vehicle.id === vehicleId
              ? { ...vehicle, capacity: Math.max(0, capacity) }
              : vehicle,
          ),
        }),
      };
    });
  };

  const updateVehicleLabel = (vehicleId: string, label: string) => {
    setState((currentState) => {
      if (!currentState.activeSession) {
        return currentState;
      }

      return {
        ...currentState,
        activeSession: updateVehicleLabelInResultsState(
          currentState.activeSession,
          vehicleId,
          label,
        ),
      };
    });
  };

  const assignPublisherName = (passengerId: string, name: string) => {
    setState((currentState) => {
      if (!currentState.activeSession) {
        return currentState;
      }

      const activeSession = assignPublisherNameInResultsState(
        currentState.activeSession,
        passengerId,
        name,
      );
      const publisherProfiles = mergePersistedPublishers(
        currentState.publisherProfiles,
        activeSession.publisherProfiles,
      );

      void persistPublisherProfiles(publisherProfiles);

      return {
        ...currentState,
        activeSession: {
          ...activeSession,
          publisherProfiles,
        },
        publisherProfiles,
      };
    });
  };

  const assignPublisherProfile = (passengerId: string, publisherId: string) => {
    setState((currentState) => {
      if (!currentState.activeSession) {
        return currentState;
      }

      return {
        ...currentState,
        activeSession: assignPublisherProfileInResultsState(
          currentState.activeSession,
          passengerId,
          publisherId,
        ),
      };
    });
  };

  const addPublisherProfile = (name: string) => {
    setState((currentState) => {
      const nextState = addPublisherProfileToSessionState(currentState, name);

      if (nextState !== currentState) {
        void persistPublisherProfiles(nextState.publisherProfiles);
      }

      return nextState;
    });
  };

  const removePublisherProfile = (publisherId: string) => {
    setState((currentState) => {
      const nextState = removePublisherProfileFromSessionState(
        currentState,
        publisherId,
      );

      if (nextState !== currentState) {
        void persistPublisherProfiles(nextState.publisherProfiles);
      }

      return nextState;
    });
  };

  const deleteAllPublisherProfiles = () => {
    setState((currentState) => {
      const nextState = deleteAllPublisherProfilesFromSessionState(currentState);

      if (nextState !== currentState) {
        void persistPublisherProfiles(nextState.publisherProfiles);
      }

      return nextState;
    });
  };

  const saveCurrentResult = async () => {
    const activeSession = state.activeSession;

    if (!activeSession?.distribution) {
      return;
    }

    const historyId = historyIdRef.current + 1;
    historyIdRef.current = historyId;
    const createdAt = new Date().toISOString();

    const entry: ResultsHistoryEntry = {
      id: `saved-result-${Date.now()}-${historyId}`,
      createdAt,
      distribution: activeSession.distribution,
      passengerPublisherIds: activeSession.passengerPublisherIds,
      publisherCount: activeSession.publisherCount,
      publisherProfiles: activeSession.publisherProfiles,
      vehicles: activeSession.vehicles,
    };

    try {
      const nextStorageUsageBytes = await saveResultHistoryEntry(entry);
      setStorageUsageBytes(nextStorageUsageBytes);
      setStorageActionFeedback({
        message: 'This distribution result was saved on this device.',
        title: 'Result saved',
        tone: 'success',
      });
    } catch (error) {
      setStorageActionFeedback({
        message: getStorageActionErrorMessage(error),
        title: 'Result could not be saved',
        tone: 'error',
      });
    }
  };

  const restorePassengerDefaultLabel = (passengerId: string) => {
    setState((currentState) => {
      if (!currentState.activeSession) {
        return currentState;
      }

      return {
        ...currentState,
        activeSession: restorePassengerDefaultLabelInResultsState(
          currentState.activeSession,
          passengerId,
        ),
      };
    });
  };

  const recalculateDistribution = () => {
    const activeSession = state.activeSession;

    if (!activeSession?.rerunPromptVisible) {
      return;
    }

    calculateDistribution(
      activeSession.publisherCount,
      activeSession.vehicles,
      false,
      activeSession.publisherProfiles,
      activeSession.passengerPublisherIds,
    );
  };

  return (
    <GroupSessionContext.Provider
      value={{
        activeSession: state.activeSession,
        addPublisherProfile,
        assignPublisherName,
        assignPublisherProfile,
        beginNewDistribution,
        clearPersistentCache,
        deleteAllPublisherProfiles,
        dismissStorageActionFeedback,
        hasActiveSession: state.activeSession !== null,
        publisherProfiles: state.publisherProfiles,
        recalculateDistribution,
        removePublisherProfile,
        refreshStorageUsage,
        restorePassengerDefaultLabel,
        resultsHistory: state.resultsHistory,
        saveCurrentResult,
        storageActionFeedback,
        storageUsageBytes,
        updatePublisherCount,
        updateVehicleCapacity,
        updateVehicleCount,
        updateVehicleLabel,
      }}>
      {children}
    </GroupSessionContext.Provider>
  );
}

export function useGroupSession() {
  const context = useContext(GroupSessionContext);

  if (!context) {
    throw new Error('useGroupSession must be used within GroupSessionProvider.');
  }

  return context;
}

function getStorageActionErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Please try again.';
}
