/// <reference types="node" />

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DEFAULT_APP_PREFERENCES,
  DistributionStrategy,
} from '@/models/group-assignment';
import type { ResultsHistoryEntry } from '@/services/group-session-service';
import {
  estimateStorageBytes,
  mergePersistedPreferences,
  mergePersistedPublishers,
  serializePersistentPreferences,
  serializePersistentPublishers,
  serializePersistentResults,
} from '@/services/persistent-storage-service';

describe('persistent storage service', () => {
  it('serializes publisher profiles without changing ids or names', () => {
    const publishers = [
      { id: 'publisher-profile-1', name: 'Samuel' },
      { id: 'publisher-profile-2', name: 'Ana Rivera' },
    ];

    assert.equal(serializePersistentPublishers(publishers), JSON.stringify(publishers));
  });

  it('serializes saved results as JSON', () => {
    const results: ResultsHistoryEntry[] = [
      {
        id: 'saved-result-1',
        createdAt: '2026-06-26T00:00:00.000Z',
        distribution: {
          strategy: DistributionStrategy.MinimizeCars,
          assignments: [],
          summary: {
            passengerCount: 0,
            vehicleCount: 0,
            vehiclesUsed: 0,
            totalCapacity: 0,
            unusedSeats: 0,
          },
        },
        passengerPublisherIds: {},
        publisherCount: 0,
        publisherProfiles: [],
        strategy: DistributionStrategy.MinimizeCars,
        vehicles: [],
      },
    ];

    assert.equal(serializePersistentResults(results), JSON.stringify(results));
  });

  it('estimates UTF-8 storage bytes from serialized values', () => {
    assert.equal(estimateStorageBytes(['abc', 'é', '🚗']), 9);
  });

  it('serializes app preferences as JSON', () => {
    const preferences = {
      ...DEFAULT_APP_PREFERENCES,
      defaultVehicleCapacity: 6,
      distributionStrategy: DistributionStrategy.MaximizeComfort,
    };

    assert.equal(serializePersistentPreferences(preferences), JSON.stringify(preferences));
  });

  it('hydrates default preferences from malformed persisted values', () => {
    assert.deepEqual(mergePersistedPreferences(null), DEFAULT_APP_PREFERENCES);
    assert.deepEqual(
      mergePersistedPreferences({
        defaultVehicleCapacity: 0,
        distributionStrategy: 'unknown',
      }),
      DEFAULT_APP_PREFERENCES,
    );
  });

  it('merges persisted preferences with defaults for missing fields', () => {
    assert.deepEqual(
      mergePersistedPreferences({
        autoSaveResults: true,
        defaultVehicleCapacity: 7,
        distributionStrategy: DistributionStrategy.MaximizeComfort,
      }),
      {
        ...DEFAULT_APP_PREFERENCES,
        autoSaveResults: true,
        defaultVehicleCapacity: 7,
        distributionStrategy: DistributionStrategy.MaximizeComfort,
      },
    );
  });

  it('merges persisted publishers with normalized name dedupe', () => {
    const merged = mergePersistedPublishers(
      [{ id: 'publisher-profile-1', name: 'Samuel Rivera' }],
      [
        { id: 'publisher-profile-2', name: ' samuel   rivera ' },
        { id: 'publisher-profile-3', name: 'Ana' },
      ],
    );

    assert.deepEqual(merged, [
      { id: 'publisher-profile-1', name: 'Samuel Rivera' },
      { id: 'publisher-profile-3', name: 'Ana' },
    ]);
  });

  it('assigns a unique id when a persisted publisher id collides', () => {
    const merged = mergePersistedPublishers(
      [{ id: 'publisher-profile-1', name: 'Samuel' }],
      [{ id: 'publisher-profile-1', name: 'Ana' }],
    );

    assert.deepEqual(merged, [
      { id: 'publisher-profile-1', name: 'Samuel' },
      { id: 'publisher-profile-2', name: 'Ana' },
    ]);
  });
});
