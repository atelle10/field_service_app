import { router } from 'expo-router';

import { useGroupSession } from '@/context/group-session-context';
import {
  getHistoryPassengerDisplayName as getHistoryPassengerDisplayNameFromEntry,
  type ResultsHistoryEntry,
} from '@/services/group-session-service';

export function useHistoryController() {
  const {
    deleteAllSavedResults,
    deleteSavedResult,
    hasActiveSession,
    restoreSavedResult,
    savedResults,
  } = useGroupSession();

  const goHome = () => {
    if (hasActiveSession) {
      router.navigate('/results');
      return;
    }

    router.replace('/select');
  };

  const goToHistory = () => {
    router.navigate('/history');
  };

  const goToPublishers = () => {
    router.navigate('/publishers');
  };

  const goToOptions = () => {
    router.navigate('/options');
  };

  const goToInfo = () => {
    router.navigate('/info');
  };

  const restoreResult = (resultId: string) => {
    restoreSavedResult(resultId);
    router.navigate('/results');
  };

  const getHistoryPassengerDisplayName = (
    entry: ResultsHistoryEntry,
    passengerId: string,
  ) => {
    return getHistoryPassengerDisplayNameFromEntry(entry, passengerId);
  };

  return {
    deleteAllSavedResults,
    deleteSavedResult,
    getHistoryPassengerDisplayName,
    goHome,
    goToHistory,
    goToInfo,
    goToOptions,
    goToPublishers,
    restoreResult,
    savedResults: getSortedSavedResults(savedResults),
  };
}

function getSortedSavedResults(savedResults: ResultsHistoryEntry[]) {
  return [...savedResults].sort((firstResult, secondResult) => {
    return Date.parse(secondResult.createdAt) - Date.parse(firstResult.createdAt);
  });
}
