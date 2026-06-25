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
  type ActiveResultsState,
  assignPublisherNameInResultsState,
  assignPublisherProfileInResultsState,
  completeActiveCalculation,
  createEmptyGroupSessionState,
  createLoadingResultsState,
  type GroupSessionState,
  markResultsStale,
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

type GroupSessionContextValue = {
  activeSession: ActiveResultsState | null;
  assignPublisherName: (passengerId: string, name: string) => void;
  assignPublisherProfile: (passengerId: string, publisherId: string) => void;
  beginNewDistribution: (
    publisherCount: number,
    vehicleCount: number,
  ) => BeginDistributionResult;
  hasActiveSession: boolean;
  recalculateDistribution: () => void;
  restorePassengerDefaultLabel: (passengerId: string) => void;
  resultsHistory: ResultsHistoryEntry[];
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

        setState((currentState) =>
          completeActiveCalculation(
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
          ),
        );
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

  const beginNewDistribution = (
    publisherCount: number,
    vehicleCount: number,
  ): BeginDistributionResult => {
    const validationResult = validateNewDistribution(publisherCount, vehicleCount);

    if (!validationResult.ok) {
      return { ok: false, errorMessage: validationResult.errorMessage };
    }

    calculateDistribution(publisherCount, validationResult.vehicles, false);
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

      return {
        ...currentState,
        activeSession: assignPublisherNameInResultsState(
          currentState.activeSession,
          passengerId,
          name,
        ),
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
        assignPublisherName,
        assignPublisherProfile,
        beginNewDistribution,
        hasActiveSession: state.activeSession !== null,
        recalculateDistribution,
        restorePassengerDefaultLabel,
        resultsHistory: state.resultsHistory,
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
