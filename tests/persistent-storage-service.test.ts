/// <reference types="node" />

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DistributionStrategy } from '@/models/group-assignment';
import type { ResultsHistoryEntry } from '@/services/group-session-service';
import {
  estimateStorageBytes,
  mergePersistedPublishers,
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
        vehicles: [],
      },
    ];

    assert.equal(serializePersistentResults(results), JSON.stringify(results));
  });

  it('estimates UTF-8 storage bytes from serialized values', () => {
    assert.equal(estimateStorageBytes(['abc', 'é', '🚗']), 9);
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
