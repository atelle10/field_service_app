/// <reference types="node" />

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DEFAULT_APP_PREFERENCES,
  DistributionStrategy,
} from '@/models/group-assignment';
import { createDefaultVehicles } from '@/services/group-assignment-service';
import {
  addPublisherProfileToSessionState,
  assignPublisherNameInResultsState,
  assignPublisherProfileInResultsState,
  completeActiveCalculation,
  createActiveResultsStateFromHistoryEntry,
  createCompletedResultsState,
  createEmptyGroupSessionState,
  deleteAllSavedResultsFromSessionState,
  deleteAllPublisherProfilesFromSessionState,
  deleteResultHistoryEntryFromSessionState,
  getHistoryPassengerDisplayName,
  getPassengerDisplayName,
  markResultsStale,
  movePassengerToVehicleInResultsState,
  removePublisherProfileFromSessionState,
  restoreResultHistoryEntryInSessionState,
  restorePassengerDefaultLabelInResultsState,
  resizeVehicles,
  updatePreferencesInSessionState,
  updateVehicleLabelInResultsState,
  validateNewDistribution,
} from '@/services/group-session-service';

describe('group session service', () => {
  it('validates a new distribution from selected publisher and vehicle counts', () => {
    const result = validateNewDistribution(10, 2);

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.deepEqual(result.vehicles, createDefaultVehicles(2));
    }
  });

  it('uses configured default capacity when validating a new distribution', () => {
    const result = validateNewDistribution(
      12,
      2,
      6,
      DistributionStrategy.MaximizeComfort,
    );

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.deepEqual(result.vehicles, createDefaultVehicles(2, 6));
    }
  });

  it('rejects a new distribution before navigation when capacity is not enough', () => {
    const result = validateNewDistribution(12, 2);

    assert.deepEqual(result, {
      ok: false,
      errorMessage: '12 publishers need 12 seats, but 2 vehicles provide 10.',
    });
  });

  it('marks publisher count changes stale without recalculating', () => {
    const completedState = createCompletedResultsState(10, createDefaultVehicles(2), false);
    const staleState = markResultsStale({
      ...completedState,
      publisherCount: 9,
    });

    assert.equal(staleState.rerunPromptVisible, true);
    assert.equal(staleState.publisherCount, 9);
    assert.equal(staleState.distribution, completedState.distribution);
  });

  it('resizes vehicles without recalculating the existing distribution', () => {
    const completedState = createCompletedResultsState(8, createDefaultVehicles(2), false);
    const staleState = markResultsStale({
      ...completedState,
      vehicles: resizeVehicles(completedState.vehicles, 3, 7),
    });

    assert.equal(staleState.rerunPromptVisible, true);
    assert.equal(staleState.vehicles.length, 3);
    assert.equal(staleState.vehicles[2].capacity, 7);
    assert.equal(staleState.distribution, completedState.distribution);
  });

  it('updates vehicle labels in active session state without marking results stale', () => {
    const completedState = createCompletedResultsState(8, createDefaultVehicles(2), false);
    const renamedState = updateVehicleLabelInResultsState(
      completedState,
      'vehicle-1',
      'Roberto',
    );

    assert.equal(renamedState.vehicles[0].label, 'Roberto');
    assert.equal(renamedState.distribution?.assignments[0].label, 'Roberto');
    assert.equal(renamedState.rerunPromptVisible, false);
    assert.equal(renamedState.distribution?.summary, completedState.distribution?.summary);
  });

  it('moves a passenger to another vehicle with open capacity', () => {
    const completedState = createCompletedResultsState(6, createDefaultVehicles(2), false);
    const nextState = movePassengerToVehicleInResultsState(
      completedState,
      'publisher-1',
      'vehicle-2',
    );

    const sourceAssignment = nextState.distribution?.assignments.find(
      (assignment) => assignment.vehicleId === 'vehicle-1',
    );
    const targetAssignment = nextState.distribution?.assignments.find(
      (assignment) => assignment.vehicleId === 'vehicle-2',
    );

    assert.equal(sourceAssignment?.passengerIds.includes('publisher-1'), false);
    assert.equal(targetAssignment?.passengerIds.includes('publisher-1'), true);
    assert.equal(nextState.rerunPromptVisible, false);
    assert.equal(nextState.staleMessage, '');
  });

  it('rejects moving a passenger into a full vehicle', () => {
    const completedState = createCompletedResultsState(10, createDefaultVehicles(2), false);
    const nextState = movePassengerToVehicleInResultsState(
      completedState,
      'publisher-1',
      'vehicle-2',
    );

    assert.equal(nextState, completedState);
  });

  it('preserves custom publisher labels when moving passengers', () => {
    const completedState = createCompletedResultsState(6, createDefaultVehicles(2), false);
    const namedState = assignPublisherNameInResultsState(
      completedState,
      'publisher-1',
      'Samuel',
    );
    const movedState = movePassengerToVehicleInResultsState(
      namedState,
      'publisher-1',
      'vehicle-2',
    );

    assert.equal(movedState.passengerPublisherIds['publisher-1'], 'publisher-profile-1');
    assert.equal(getPassengerDisplayName(movedState, 'publisher-1'), 'Samuel');
  });

  it('updates assignment in-use flags and vehicles used after a move', () => {
    const completedState = createCompletedResultsState(1, createDefaultVehicles(2), false);
    const movedState = movePassengerToVehicleInResultsState(
      completedState,
      'publisher-1',
      'vehicle-2',
    );
    const sourceAssignment = movedState.distribution?.assignments.find(
      (assignment) => assignment.vehicleId === 'vehicle-1',
    );
    const targetAssignment = movedState.distribution?.assignments.find(
      (assignment) => assignment.vehicleId === 'vehicle-2',
    );

    assert.equal(sourceAssignment?.inUse, false);
    assert.equal(targetAssignment?.inUse, true);
    assert.equal(movedState.distribution?.summary.vehiclesUsed, 1);
  });

  it('no-ops passenger moves for missing passengers, missing targets, and same vehicle', () => {
    const completedState = createCompletedResultsState(6, createDefaultVehicles(2), false);

    assert.equal(
      movePassengerToVehicleInResultsState(completedState, 'publisher-99', 'vehicle-2'),
      completedState,
    );
    assert.equal(
      movePassengerToVehicleInResultsState(completedState, 'publisher-1', 'vehicle-99'),
      completedState,
    );
    assert.equal(
      movePassengerToVehicleInResultsState(completedState, 'publisher-1', 'vehicle-1'),
      completedState,
    );
  });

  it('no-ops passenger moves when no distribution exists', () => {
    const loadingState = {
      ...createCompletedResultsState(6, createDefaultVehicles(2), false),
      distribution: null,
    };

    assert.equal(
      movePassengerToVehicleInResultsState(loadingState, 'publisher-1', 'vehicle-2'),
      loadingState,
    );
  });

  it('assigns a new publisher name to a passenger in active session state', () => {
    const completedState = createCompletedResultsState(8, createDefaultVehicles(2), false);
    const renamedState = assignPublisherNameInResultsState(
      completedState,
      'publisher-1',
      ' Samuel  Rivera ',
    );

    assert.deepEqual(renamedState.publisherProfiles, [
      { id: 'publisher-profile-1', name: 'Samuel Rivera' },
    ]);
    assert.equal(renamedState.passengerPublisherIds['publisher-1'], 'publisher-profile-1');
    assert.equal(getPassengerDisplayName(renamedState, 'publisher-1'), 'Samuel Rivera');
    assert.equal(renamedState.rerunPromptVisible, false);
  });

  it('deduplicates publisher names case-insensitively', () => {
    const completedState = createCompletedResultsState(8, createDefaultVehicles(2), false);
    const firstState = assignPublisherNameInResultsState(
      completedState,
      'publisher-1',
      'Samuel',
    );
    const secondState = assignPublisherNameInResultsState(
      firstState,
      'publisher-2',
      'samuel',
    );

    assert.equal(secondState.publisherProfiles.length, 1);
    assert.equal(secondState.publisherProfiles[0].name, 'Samuel');
    assert.equal(secondState.passengerPublisherIds['publisher-2'], 'publisher-profile-1');
  });

  it('assigns an existing publisher profile without creating a duplicate', () => {
    const completedState = createCompletedResultsState(8, createDefaultVehicles(2), false);
    const firstState = assignPublisherNameInResultsState(
      completedState,
      'publisher-1',
      'Maria',
    );
    const secondState = assignPublisherProfileInResultsState(
      firstState,
      'publisher-2',
      'publisher-profile-1',
    );

    assert.equal(secondState.publisherProfiles.length, 1);
    assert.equal(secondState.passengerPublisherIds['publisher-2'], 'publisher-profile-1');
    assert.equal(getPassengerDisplayName(secondState, 'publisher-2'), 'Maria');
  });

  it('ignores empty publisher names', () => {
    const completedState = createCompletedResultsState(8, createDefaultVehicles(2), false);
    const renamedState = assignPublisherNameInResultsState(
      completedState,
      'publisher-1',
      '   ',
    );

    assert.equal(renamedState, completedState);
  });

  it('restores a passenger to its default label without deleting saved publishers', () => {
    const completedState = createCompletedResultsState(8, createDefaultVehicles(2), false);
    const namedState = assignPublisherNameInResultsState(
      completedState,
      'publisher-1',
      'Samuel',
    );
    const restoredState = restorePassengerDefaultLabelInResultsState(
      namedState,
      'publisher-1',
    );

    assert.equal(restoredState.passengerPublisherIds['publisher-1'], undefined);
    assert.deepEqual(restoredState.publisherProfiles, [
      { id: 'publisher-profile-1', name: 'Samuel' },
    ]);
    assert.equal(getPassengerDisplayName(restoredState, 'publisher-1'), 'Publisher 1');
    assert.equal(restoredState.rerunPromptVisible, false);
  });

  it('adds a publisher profile to session state with normalized name dedupe', () => {
    const sessionState = createEmptyGroupSessionState();
    const firstState = addPublisherProfileToSessionState(
      sessionState,
      '  Maria   Lopez ',
    );
    const duplicateState = addPublisherProfileToSessionState(firstState, 'maria lopez');

    assert.deepEqual(firstState.publisherProfiles, [
      { id: 'publisher-profile-1', name: 'Maria Lopez' },
    ]);
    assert.equal(duplicateState, firstState);
  });

  it('removes a publisher profile and clears active passenger mappings for it', () => {
    const activeSession = assignPublisherNameInResultsState(
      createCompletedResultsState(8, createDefaultVehicles(2), false),
      'publisher-1',
      'Samuel',
    );
    const sessionState = {
      activeSession,
      preferences: DEFAULT_APP_PREFERENCES,
      publisherProfiles: activeSession.publisherProfiles,
      resultsHistory: [],
      savedResults: [],
    };
    const nextState = removePublisherProfileFromSessionState(
      sessionState,
      'publisher-profile-1',
    );

    assert.deepEqual(nextState.publisherProfiles, []);
    assert.deepEqual(nextState.activeSession?.publisherProfiles, []);
    assert.equal(nextState.activeSession?.passengerPublisherIds['publisher-1'], undefined);
  });

  it('deletes all publisher profiles and clears active passenger mappings', () => {
    const firstActiveSession = assignPublisherNameInResultsState(
      createCompletedResultsState(8, createDefaultVehicles(2), false),
      'publisher-1',
      'Samuel',
    );
    const activeSession = assignPublisherNameInResultsState(
      firstActiveSession,
      'publisher-2',
      'Ana',
    );
    const sessionState = {
      activeSession,
      preferences: DEFAULT_APP_PREFERENCES,
      publisherProfiles: activeSession.publisherProfiles,
      resultsHistory: [],
      savedResults: [],
    };
    const nextState = deleteAllPublisherProfilesFromSessionState(sessionState);

    assert.deepEqual(nextState.publisherProfiles, []);
    assert.deepEqual(nextState.activeSession?.publisherProfiles, []);
    assert.deepEqual(nextState.activeSession?.passengerPublisherIds, {});
  });

  it('appends history when a calculation completes successfully', () => {
    const sessionState = completeActiveCalculation(
      createEmptyGroupSessionState(),
      10,
      createDefaultVehicles(2),
      false,
      DistributionStrategy.MinimizeCars,
      { createdAt: '2026-06-25T00:00:00.000Z', id: 'result-1' },
    );

    assert.equal(sessionState.resultsHistory.length, 1);
    assert.equal(sessionState.resultsHistory[0].id, 'result-1');
    assert.equal(sessionState.resultsHistory[0].publisherCount, 10);
    assert.equal(sessionState.activeSession?.isLoading, false);
    assert.equal(sessionState.activeSession?.distribution?.summary.passengerCount, 10);
  });

  it('preserves publisher profiles and passenger mappings when a calculation completes', () => {
    const sessionState = completeActiveCalculation(
      createEmptyGroupSessionState(),
      10,
      createDefaultVehicles(2),
      false,
      DistributionStrategy.MinimizeCars,
      { createdAt: '2026-06-25T00:00:00.000Z', id: 'result-1' },
      [{ id: 'publisher-profile-1', name: 'Ana' }],
      { 'publisher-1': 'publisher-profile-1' },
    );

    assert.deepEqual(sessionState.activeSession?.publisherProfiles, [
      { id: 'publisher-profile-1', name: 'Ana' },
    ]);
    assert.equal(
      sessionState.activeSession?.passengerPublisherIds['publisher-1'],
      'publisher-profile-1',
    );
    assert.deepEqual(sessionState.resultsHistory[0].publisherProfiles, [
      { id: 'publisher-profile-1', name: 'Ana' },
    ]);
    assert.equal(
      sessionState.resultsHistory[0].passengerPublisherIds['publisher-1'],
      'publisher-profile-1',
    );
  });

  it('does not append history when a calculation fails', () => {
    const sessionState = completeActiveCalculation(
      createEmptyGroupSessionState(),
      12,
      createDefaultVehicles(2),
      false,
      DistributionStrategy.MinimizeCars,
      { createdAt: '2026-06-25T00:00:00.000Z', id: 'result-1' },
    );

    assert.equal(sessionState.resultsHistory.length, 0);
    assert.equal(sessionState.activeSession?.distribution, null);
    assert.match(sessionState.activeSession?.errorMessage ?? '', /12 publishers need 12 seats/);
  });

  it('preserves preferences when a calculation completes', () => {
    const sessionState = completeActiveCalculation(
      {
        ...createEmptyGroupSessionState(),
        preferences: {
          ...DEFAULT_APP_PREFERENCES,
          defaultVehicleCapacity: 6,
          distributionStrategy: DistributionStrategy.MaximizeComfort,
        },
      },
      10,
      createDefaultVehicles(2, 6),
      false,
      DistributionStrategy.MaximizeComfort,
      { createdAt: '2026-06-25T00:00:00.000Z', id: 'result-1' },
    );

    assert.equal(sessionState.preferences.defaultVehicleCapacity, 6);
    assert.equal(
      sessionState.preferences.distributionStrategy,
      DistributionStrategy.MaximizeComfort,
    );
    assert.equal(
      sessionState.activeSession?.strategy,
      DistributionStrategy.MaximizeComfort,
    );
  });

  it('marks active results stale when distribution strategy changes', () => {
    const activeSession = createCompletedResultsState(
      10,
      createDefaultVehicles(2),
      false,
      DistributionStrategy.MinimizeCars,
    );
    const nextState = updatePreferencesInSessionState(
      {
        activeSession,
        preferences: DEFAULT_APP_PREFERENCES,
        publisherProfiles: [],
        resultsHistory: [],
        savedResults: [],
      },
      {
        ...DEFAULT_APP_PREFERENCES,
        distributionStrategy: DistributionStrategy.MaximizeComfort,
      },
    );

    assert.equal(nextState.activeSession?.rerunPromptVisible, true);
    assert.equal(
      nextState.activeSession?.strategy,
      DistributionStrategy.MaximizeComfort,
    );
    assert.equal(nextState.activeSession?.distribution, activeSession.distribution);
  });

  it('does not mark active results stale when unrelated preferences change', () => {
    const activeSession = createCompletedResultsState(10, createDefaultVehicles(2), false);
    const nextState = updatePreferencesInSessionState(
      {
        activeSession,
        preferences: DEFAULT_APP_PREFERENCES,
        publisherProfiles: [],
        resultsHistory: [],
        savedResults: [],
      },
      {
        ...DEFAULT_APP_PREFERENCES,
        defaultVehicleCapacity: 6,
      },
    );

    assert.equal(nextState.activeSession?.rerunPromptVisible, false);
  });

  it('creates active results state from a saved history entry without loading state', () => {
    const savedEntry = createSavedHistoryEntry('saved-result-1');
    const activeState = createActiveResultsStateFromHistoryEntry(savedEntry);

    assert.equal(activeState.isLoading, false);
    assert.equal(activeState.rerunPromptVisible, false);
    assert.equal(activeState.staleMessage, '');
    assert.equal(activeState.publisherCount, savedEntry.publisherCount);
    assert.equal(activeState.distribution, savedEntry.distribution);
  });

  it('deletes one saved result from session state', () => {
    const firstEntry = createSavedHistoryEntry('saved-result-1');
    const secondEntry = createSavedHistoryEntry('saved-result-2');
    const sessionState = {
      ...createEmptyGroupSessionState(),
      savedResults: [firstEntry, secondEntry],
    };
    const nextState = deleteResultHistoryEntryFromSessionState(
      sessionState,
      'saved-result-1',
    );

    assert.deepEqual(nextState.savedResults, [secondEntry]);
  });

  it('no-ops saved result deletion for missing IDs', () => {
    const firstEntry = createSavedHistoryEntry('saved-result-1');
    const sessionState = {
      ...createEmptyGroupSessionState(),
      savedResults: [firstEntry],
    };

    assert.equal(
      deleteResultHistoryEntryFromSessionState(sessionState, 'missing-result'),
      sessionState,
    );
  });

  it('clears all saved results from session state', () => {
    const sessionState = {
      ...createEmptyGroupSessionState(),
      savedResults: [
        createSavedHistoryEntry('saved-result-1'),
        createSavedHistoryEntry('saved-result-2'),
      ],
    };
    const nextState = deleteAllSavedResultsFromSessionState(sessionState);

    assert.deepEqual(nextState.savedResults, []);
  });

  it('restores a saved result into the active session without recalculating', () => {
    const savedEntry = createSavedHistoryEntry('saved-result-1');
    const sessionState = {
      ...createEmptyGroupSessionState(),
      savedResults: [savedEntry],
    };
    const nextState = restoreResultHistoryEntryInSessionState(
      sessionState,
      'saved-result-1',
    );

    assert.equal(nextState.activeSession?.distribution, savedEntry.distribution);
    assert.equal(nextState.activeSession?.isLoading, false);
    assert.equal(nextState.activeSession?.rerunPromptVisible, false);
    assert.equal(nextState.resultsHistory.length, 0);
  });

  it('restores saved publisher labels with a saved result', () => {
    const savedEntry = createSavedHistoryEntry('saved-result-1');
    const sessionState = {
      ...createEmptyGroupSessionState(),
      savedResults: [savedEntry],
    };
    const nextState = restoreResultHistoryEntryInSessionState(
      sessionState,
      'saved-result-1',
    );

    assert.equal(
      nextState.activeSession?.passengerPublisherIds['publisher-1'],
      'publisher-profile-1',
    );
    assert.equal(getPassengerDisplayName(nextState.activeSession!, 'publisher-1'), 'Ana');
  });

  it('resolves custom and default publisher names for history previews', () => {
    const savedEntry = createSavedHistoryEntry('saved-result-1');

    assert.equal(getHistoryPassengerDisplayName(savedEntry, 'publisher-1'), 'Ana');
    assert.equal(
      getHistoryPassengerDisplayName(savedEntry, 'publisher-2'),
      'Publisher 2',
    );
  });
});

function createSavedHistoryEntry(id: string) {
  const activeSession = assignPublisherNameInResultsState(
    createCompletedResultsState(4, createDefaultVehicles(2), false),
    'publisher-1',
    'Ana',
  );

  assert.ok(activeSession.distribution);

  return {
    id,
    createdAt: '2026-06-30T19:45:00.000Z',
    distribution: activeSession.distribution,
    passengerPublisherIds: activeSession.passengerPublisherIds,
    publisherCount: activeSession.publisherCount,
    publisherProfiles: activeSession.publisherProfiles,
    strategy: activeSession.strategy,
    vehicles: activeSession.vehicles,
  };
}
