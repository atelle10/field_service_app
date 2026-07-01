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
    preferences,
    restoreSavedResult,
    savedResults,
  } = useGroupSession();

  const goHome = () => {
    router.navigate('/results');
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
    return getHistoryPassengerDisplayNameFromEntry(
      entry,
      passengerId,
      preferences.language,
    );
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
    language: preferences.language,
    restoreResult,
    savedResults: getSortedSavedResults(savedResults),
  };
}

function getSortedSavedResults(savedResults: ResultsHistoryEntry[]) {
  return [...savedResults].sort((firstResult, secondResult) => {
    return Date.parse(secondResult.createdAt) - Date.parse(firstResult.createdAt);
  });
}
