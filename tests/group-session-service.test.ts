/// <reference types="node" />

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createDefaultVehicles } from '@/services/group-assignment-service';
import {
  assignPublisherNameInResultsState,
  assignPublisherProfileInResultsState,
  completeActiveCalculation,
  createCompletedResultsState,
  createEmptyGroupSessionState,
  getPassengerDisplayName,
  markResultsStale,
  restorePassengerDefaultLabelInResultsState,
  resizeVehicles,
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
      vehicles: resizeVehicles(completedState.vehicles, 3),
    });

    assert.equal(staleState.rerunPromptVisible, true);
    assert.equal(staleState.vehicles.length, 3);
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

  it('appends history when a calculation completes successfully', () => {
    const sessionState = completeActiveCalculation(
      createEmptyGroupSessionState(),
      10,
      createDefaultVehicles(2),
      false,
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
      { createdAt: '2026-06-25T00:00:00.000Z', id: 'result-1' },
    );

    assert.equal(sessionState.resultsHistory.length, 0);
    assert.equal(sessionState.activeSession?.distribution, null);
    assert.match(sessionState.activeSession?.errorMessage ?? '', /12 publishers need 12 seats/);
  });
});
