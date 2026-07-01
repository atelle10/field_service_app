import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  DEFAULT_APP_PREFERENCES,
  type AppPreferences,
  type DistributionStrategyId,
  type VehicleInput,
} from '@/models/group-assignment';
import {
  clearPersistentStorage,
  getPersistentStorageUsage,
  loadPersistedGroupData,
  mergePersistedPublishers,
  saveAppPreferences,
  savePublisherProfiles,
  saveResultHistoryEntries,
  saveResultHistoryEntry,
  saveStartScreenSeen,
} from '@/services/persistent-storage-service';
import {
  type ActiveResultsState,
  addPublisherProfileToSessionState,
  assignPublisherNameInResultsState,
  assignPublisherProfileInResultsState,
  completeActiveCalculation,
  createEmptyGroupSessionState,
  createLoadingResultsState,
  deleteAllSavedResultsFromSessionState,
  deleteAllPublisherProfilesFromSessionState,
  deleteResultHistoryEntryFromSessionState,
  disableServiceViewInResultsState,
  enableServiceViewInResultsState,
  type GroupSessionState,
  incrementServiceSelectionInResultsState,
  markResultsStale,
  movePassengerToVehicleInResultsState,
  removePublisherProfileFromSessionState,
  restoreResultHistoryEntryInSessionState,
  restorePassengerDefaultLabelInResultsState,
  resizeVehicles,
  type ResultsHistoryEntry,
  updatePreferencesInSessionState,
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

export type DestructiveActionConfirmation = {
  confirmLabel: string;
  message: string;
  title: string;
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
  completeStartScreen: () => void;
  confirmDestructiveAction: () => void;
  deleteAllPublisherProfiles: () => void;
  disableServiceView: () => void;
  destructiveActionConfirmation: DestructiveActionConfirmation | null;
  dismissDestructiveActionConfirmation: () => void;
  dismissStorageActionFeedback: () => void;
  enableServiceView: () => Promise<void>;
  hasHydratedPersistedData: boolean;
  hasActiveSession: boolean;
  hasSeenStartScreen: boolean;
  preferences: AppPreferences;
  publisherProfiles: ActiveResultsState['publisherProfiles'];
  incrementServiceSelection: (passengerId: string) => void;
  recalculateDistribution: () => void;
  movePassengerToVehicle: (passengerId: string, targetVehicleId: string) => void;
  deleteAllSavedResults: () => void;
  deleteSavedResult: (resultId: string) => void;
  removePublisherProfile: (publisherId: string) => void;
  restoreSavedResult: (resultId: string) => void;
  restorePassengerDefaultLabel: (passengerId: string) => void;
  resultsHistory: ResultsHistoryEntry[];
  savedResults: ResultsHistoryEntry[];
  refreshStorageUsage: () => Promise<void>;
  saveCurrentResult: () => Promise<void>;
  storageActionFeedback: StorageActionFeedback | null;
  storageUsageBytes: number;
  updateAppPreferences: (preferences: AppPreferences) => void;
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
  const [hasHydratedPersistedData, setHasHydratedPersistedData] = useState(false);
  const [hasSeenStartScreen, setHasSeenStartScreen] = useState(false);
  const [storageUsageBytes, setStorageUsageBytes] = useState(0);
  const [storageActionFeedback, setStorageActionFeedback] =
    useState<StorageActionFeedback | null>(null);
  const confirmationActionRef = useRef<(() => void | Promise<void>) | null>(null);
  const [destructiveActionConfirmation, setDestructiveActionConfirmation] =
    useState<DestructiveActionConfirmation | null>(null);

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

  const persistPreferences = useCallback(async (preferences: AppPreferences) => {
    const nextStorageUsageBytes = await saveAppPreferences(preferences);
    setStorageUsageBytes(nextStorageUsageBytes);
  }, []);

  const runDestructiveAction = useCallback(
    (
      confirmation: DestructiveActionConfirmation,
      action: () => void | Promise<void>,
    ) => {
      if (!state.preferences.confirmDestructiveActions) {
        void action();
        return;
      }

      confirmationActionRef.current = action;
      setDestructiveActionConfirmation(confirmation);
    },
    [state.preferences.confirmDestructiveActions],
  );

  const clearPersistentCacheImmediately = useCallback(async () => {
    try {
      const nextStorageUsageBytes = await clearPersistentStorage();
      setStorageUsageBytes(nextStorageUsageBytes);
      setHasSeenStartScreen(false);
      setState((currentState) => ({
        ...currentState,
        activeSession: currentState.activeSession
          ? {
              ...currentState.activeSession,
              passengerPublisherIds: {},
              publisherProfiles: [],
            }
          : currentState.activeSession,
        preferences: DEFAULT_APP_PREFERENCES,
        publisherProfiles: [],
        savedResults: [],
      }));
      setStorageActionFeedback({
        message:
          'Stored publishers, saved results, and preferences were removed from this device.',
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

  const clearPersistentCache = useCallback(async () => {
    runDestructiveAction(
      {
        confirmLabel: 'Clear Cache',
        message:
          'This removes stored publishers, saved results, and preferences from this device.',
        title: 'Clear cached data?',
      },
      clearPersistentCacheImmediately,
    );
  }, [clearPersistentCacheImmediately, runDestructiveAction]);

  const dismissDestructiveActionConfirmation = useCallback(() => {
    confirmationActionRef.current = null;
    setDestructiveActionConfirmation(null);
  }, []);

  const confirmDestructiveAction = useCallback(() => {
    const action = confirmationActionRef.current;
    confirmationActionRef.current = null;
    setDestructiveActionConfirmation(null);
    void action?.();
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
      strategy: DistributionStrategyId,
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
            strategy,
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

          const nextState = {
            ...completedState,
            activeSession: completedState.activeSession
              ? {
                  ...completedState.activeSession,
                  publisherProfiles: nextPublisherProfiles,
              }
              : completedState.activeSession,
            publisherProfiles: nextPublisherProfiles,
          };
          if (
            currentState.preferences.autoSaveResults &&
            nextState.resultsHistory.length > currentState.resultsHistory.length
          ) {
            const latestEntry = nextState.resultsHistory[nextState.resultsHistory.length - 1];
            void saveResultHistoryEntry(latestEntry)
              .then((nextStorageUsageBytes) => {
                setStorageUsageBytes(nextStorageUsageBytes);
                setState((latestState) => ({
                  ...latestState,
                  savedResults: [...latestState.savedResults, latestEntry],
                }));
              })
              .catch((error) => {
                setStorageActionFeedback({
                  message: getStorageActionErrorMessage(error),
                  title: 'Auto-save failed',
                  tone: 'error',
                });
              });
          }

          return nextState;
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
      strategy: DistributionStrategyId,
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
          strategy,
          publisherProfiles,
          passengerPublisherIds,
        ),
      }));
      scheduleCalculationResult(
        calculationId,
        publisherCount,
        vehicles,
        rerunPromptVisible,
        strategy,
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
          preferences: persistedData.preferences,
          savedResults: persistedData.savedResults,
        }));
        setHasSeenStartScreen(persistedData.hasSeenStartScreen);
        setStorageUsageBytes(persistedData.storageUsageBytes);
        setHasHydratedPersistedData(true);
      })
      .catch(() => {
        if (mounted) {
          setStorageUsageBytes(0);
          setHasHydratedPersistedData(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const completeStartScreen = () => {
    setHasSeenStartScreen(true);
    void saveStartScreenSeen()
      .then((nextStorageUsageBytes) => {
        setStorageUsageBytes(nextStorageUsageBytes);
      })
      .catch(() => {
        setStorageUsageBytes(0);
      });
  };

  const beginNewDistribution = (
    publisherCount: number,
    vehicleCount: number,
  ): BeginDistributionResult => {
    const validationResult = validateNewDistribution(
      publisherCount,
      vehicleCount,
      state.preferences.defaultVehicleCapacity,
      state.preferences.distributionStrategy,
    );

    if (!validationResult.ok) {
      return { ok: false, errorMessage: validationResult.errorMessage };
    }

    calculateDistribution(
      publisherCount,
      validationResult.vehicles,
      false,
      state.preferences.distributionStrategy,
      state.publisherProfiles,
    );
    return { ok: true };
  };

  const updateAppPreferences = (preferences: AppPreferences) => {
    setState((currentState) => updatePreferencesInSessionState(currentState, preferences));
    void persistPreferences(preferences);
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
          vehicles: resizeVehicles(
            currentState.activeSession.vehicles,
            vehicleCount,
            currentState.preferences.defaultVehicleCapacity,
          ),
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

  const movePassengerToVehicle = (passengerId: string, targetVehicleId: string) => {
    setState((currentState) => {
      if (!currentState.activeSession) {
        return currentState;
      }

      return {
        ...currentState,
        activeSession: movePassengerToVehicleInResultsState(
          currentState.activeSession,
          passengerId,
          targetVehicleId,
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

  const removePublisherProfileImmediately = (publisherId: string) => {
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

  const removePublisherProfile = (publisherId: string) => {
    runDestructiveAction(
      {
        confirmLabel: 'Remove',
        message: 'This removes the saved publisher name from this device.',
        title: 'Remove publisher?',
      },
      () => removePublisherProfileImmediately(publisherId),
    );
  };

  const deleteAllPublisherProfilesImmediately = () => {
    setState((currentState) => {
      const nextState = deleteAllPublisherProfilesFromSessionState(currentState);

      if (nextState !== currentState) {
        void persistPublisherProfiles(nextState.publisherProfiles);
      }

      return nextState;
    });
  };

  const deleteAllPublisherProfiles = () => {
    runDestructiveAction(
      {
        confirmLabel: 'Delete All',
        message: 'This removes all saved publisher names from this device.',
        title: 'Delete all publishers?',
      },
      deleteAllPublisherProfilesImmediately,
    );
  };

  const saveCurrentResult = async () => {
    const activeSession = state.activeSession;

    if (!activeSession?.distribution) {
      return;
    }

    const historyId = historyIdRef.current + 1;
    historyIdRef.current = historyId;
    const entry = createSavedResultEntry(
      activeSession,
      `saved-result-${Date.now()}-${historyId}`,
    );

    try {
      const nextStorageUsageBytes = await saveResultHistoryEntry(entry);
      setStorageUsageBytes(nextStorageUsageBytes);
      setState((currentState) => ({
        ...currentState,
        savedResults: [...currentState.savedResults, entry],
      }));
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

  const enableServiceView = async () => {
    const activeSession = state.activeSession;

    if (!activeSession?.distribution || activeSession.serviceViewEnabled) {
      return;
    }

    const historyId = historyIdRef.current + 1;
    historyIdRef.current = historyId;
    const entry = createSavedResultEntry(
      activeSession,
      `saved-result-${Date.now()}-${historyId}`,
    );

    try {
      const nextStorageUsageBytes = await saveResultHistoryEntry(entry);
      setStorageUsageBytes(nextStorageUsageBytes);
      setState((currentState) => {
        if (!currentState.activeSession) {
          return currentState;
        }

        return {
          ...currentState,
          activeSession: enableServiceViewInResultsState(currentState.activeSession),
          savedResults: [...currentState.savedResults, entry],
        };
      });
    } catch (error) {
      setStorageActionFeedback({
        message: getStorageActionErrorMessage(error),
        title: 'Service View could not start',
        tone: 'error',
      });
    }
  };

  const disableServiceView = () => {
    setState((currentState) => {
      if (!currentState.activeSession) {
        return currentState;
      }

      return {
        ...currentState,
        activeSession: disableServiceViewInResultsState(currentState.activeSession),
      };
    });
  };

  const incrementServiceSelection = (passengerId: string) => {
    setState((currentState) => {
      if (!currentState.activeSession) {
        return currentState;
      }

      return {
        ...currentState,
        activeSession: incrementServiceSelectionInResultsState(
          currentState.activeSession,
          passengerId,
        ),
      };
    });
  };

  const deleteSavedResultImmediately = async (resultId: string) => {
    try {
      let nextSavedResults: ResultsHistoryEntry[] | null = null;

      setState((currentState) => {
        const nextState = deleteResultHistoryEntryFromSessionState(
          currentState,
          resultId,
        );
        nextSavedResults = nextState.savedResults;
        return nextState;
      });

      if (!nextSavedResults) {
        return;
      }

      const nextStorageUsageBytes = await saveResultHistoryEntries(nextSavedResults);
      setStorageUsageBytes(nextStorageUsageBytes);
      setStorageActionFeedback({
        message: 'The saved result was removed from this device.',
        title: 'Result deleted',
        tone: 'success',
      });
    } catch (error) {
      setStorageActionFeedback({
        message: getStorageActionErrorMessage(error),
        title: 'Result could not be deleted',
        tone: 'error',
      });
    }
  };

  const deleteSavedResult = (resultId: string) => {
    runDestructiveAction(
      {
        confirmLabel: 'Delete',
        message: 'This removes the saved result from this device.',
        title: 'Delete saved result?',
      },
      () => deleteSavedResultImmediately(resultId),
    );
  };

  const deleteAllSavedResultsImmediately = async () => {
    try {
      let nextSavedResults: ResultsHistoryEntry[] | null = null;

      setState((currentState) => {
        const nextState = deleteAllSavedResultsFromSessionState(currentState);
        nextSavedResults = nextState.savedResults;
        return nextState;
      });

      if (!nextSavedResults) {
        return;
      }

      const nextStorageUsageBytes = await saveResultHistoryEntries(nextSavedResults);
      setStorageUsageBytes(nextStorageUsageBytes);
      setStorageActionFeedback({
        message: 'All saved results were removed from this device.',
        title: 'History cleared',
        tone: 'success',
      });
    } catch (error) {
      setStorageActionFeedback({
        message: getStorageActionErrorMessage(error),
        title: 'History could not be cleared',
        tone: 'error',
      });
    }
  };

  const deleteAllSavedResults = () => {
    runDestructiveAction(
      {
        confirmLabel: 'Clear All',
        message: 'This removes all saved results from this device.',
        title: 'Clear saved results?',
      },
      deleteAllSavedResultsImmediately,
    );
  };

  const restoreSavedResult = (resultId: string) => {
    setState((currentState) =>
      restoreResultHistoryEntryInSessionState(currentState, resultId),
    );
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
      activeSession.strategy,
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
        completeStartScreen,
        confirmDestructiveAction,
        deleteAllPublisherProfiles,
        deleteAllSavedResults,
        deleteSavedResult,
        disableServiceView,
        destructiveActionConfirmation,
        dismissDestructiveActionConfirmation,
        dismissStorageActionFeedback,
        enableServiceView,
        hasHydratedPersistedData,
        hasActiveSession: state.activeSession !== null,
        hasSeenStartScreen,
        incrementServiceSelection,
        movePassengerToVehicle,
        preferences: state.preferences,
        publisherProfiles: state.publisherProfiles,
        recalculateDistribution,
        removePublisherProfile,
        refreshStorageUsage,
        restorePassengerDefaultLabel,
        restoreSavedResult,
        resultsHistory: state.resultsHistory,
        savedResults: state.savedResults,
        saveCurrentResult,
        storageActionFeedback,
        storageUsageBytes,
        updateAppPreferences,
        updatePublisherCount,
        updateVehicleCapacity,
        updateVehicleCount,
        updateVehicleLabel,
      }}>
      {children}
    </GroupSessionContext.Provider>
  );
}

function createSavedResultEntry(
  activeSession: ActiveResultsState,
  id: string,
): ResultsHistoryEntry {
  if (!activeSession.distribution) {
    throw new Error('Cannot save a result before a distribution exists.');
  }

  return {
    id,
    createdAt: new Date().toISOString(),
    distribution: activeSession.distribution,
    passengerPublisherIds: activeSession.passengerPublisherIds,
    publisherCount: activeSession.publisherCount,
    publisherProfiles: activeSession.publisherProfiles,
    strategy: activeSession.strategy,
    vehicles: activeSession.vehicles,
  };
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
