/// <reference types="node" />

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createDefaultVehicles } from '@/services/group-assignment-service';
import {
  completeActiveCalculation,
  createCompletedResultsState,
  createEmptyGroupSessionState,
  markResultsStale,
  resizeVehicles,
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
