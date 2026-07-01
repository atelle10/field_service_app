/// <reference types="node" />

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DEFAULT_VEHICLE_CAPACITY,
  DistributionStrategy,
  type VehicleAssignment,
} from '@/models/group-assignment';
import { Language } from '@/i18n';
import {
  createDefaultVehicles,
  createDistributionSuggestion,
  createPlaceholderPassengers,
  requestRerunCheck,
} from '@/services/group-assignment-service';

describe('group assignment service', () => {
  it('creates default 5-seat vehicles from a selected vehicle count', () => {
    assert.deepEqual(createDefaultVehicles(2), [
      { id: 'vehicle-1', label: 'Vehicle 1', capacity: DEFAULT_VEHICLE_CAPACITY },
      { id: 'vehicle-2', label: 'Vehicle 2', capacity: DEFAULT_VEHICLE_CAPACITY },
    ]);
  });

  it('creates Spanish default labels when requested', () => {
    assert.deepEqual(createPlaceholderPassengers(2, Language.Spanish), [
      { id: 'publisher-1', displayName: 'Publicador 1' },
      { id: 'publisher-2', displayName: 'Publicador 2' },
    ]);
    assert.deepEqual(createDefaultVehicles(1, DEFAULT_VEHICLE_CAPACITY, Language.Spanish), [
      { id: 'vehicle-1', label: 'Vehículo 1', capacity: DEFAULT_VEHICLE_CAPACITY },
    ]);
  });

  it('distributes 10 publishers across two default vehicles', () => {
    const suggestion = createDistributionSuggestion({
      passengers: createPlaceholderPassengers(10),
      vehicles: createDefaultVehicles(2),
      strategy: DistributionStrategy.MinimizeCars,
    });

    assert.equal(suggestion.summary.passengerCount, 10);
    assert.equal(suggestion.summary.vehicleCount, 2);
    assert.equal(suggestion.summary.vehiclesUsed, 2);
    assert.equal(suggestion.summary.totalCapacity, 10);
    assert.equal(suggestion.summary.unusedSeats, 0);
    assert.deepEqual(
      suggestion.assignments.map((assignment) => assignment.passengerIds.length),
      [5, 5],
    );
  });

  it('fails gracefully when default vehicle capacity is not enough', () => {
    assert.throws(
      () =>
        createDistributionSuggestion({
          passengers: createPlaceholderPassengers(12),
          vehicles: createDefaultVehicles(2),
          strategy: DistributionStrategy.MinimizeCars,
        }),
      /12 publishers need 12 seats, but 2 vehicles provide 10/,
    );
  });

  it('localizes distribution capacity errors', () => {
    assert.throws(
      () =>
        createDistributionSuggestion({
          language: Language.Spanish,
          passengers: createPlaceholderPassengers(12, Language.Spanish),
          vehicles: createDefaultVehicles(2, DEFAULT_VEHICLE_CAPACITY, Language.Spanish),
          strategy: DistributionStrategy.MinimizeCars,
        }),
      /12 publicadores necesitan 12 asientos, pero 2 vehículos ofrecen 10/,
    );
  });

  it('keeps unused default vehicles visible when minimize-cars does not need them', () => {
    const suggestion = createDistributionSuggestion({
      passengers: createPlaceholderPassengers(8),
      vehicles: createDefaultVehicles(3),
      strategy: DistributionStrategy.MinimizeCars,
    });

    assert.equal(suggestion.summary.vehiclesUsed, 2);
    assert.deepEqual(
      suggestion.assignments.map((assignment) => ({
        id: assignment.vehicleId,
        count: assignment.passengerIds.length,
        inUse: assignment.inUse,
      })),
      [
        { id: 'vehicle-1', count: 4, inUse: true },
        { id: 'vehicle-2', count: 4, inUse: true },
        { id: 'vehicle-3', count: 0, inUse: false },
      ],
    );
  });

  it('spreads publishers across all vehicles for maximize-comfort', () => {
    const suggestion = createDistributionSuggestion({
      passengers: createPlaceholderPassengers(8),
      vehicles: createDefaultVehicles(3),
      strategy: DistributionStrategy.MaximizeComfort,
    });

    assert.equal(suggestion.summary.vehiclesUsed, 3);
    assert.deepEqual(
      suggestion.assignments.map((assignment) => assignment.passengerIds.length),
      [3, 3, 2],
    );
  });

  it('suggests rerun when an edited vehicle capacity makes current assignments invalid', async () => {
    const currentAssignments: VehicleAssignment[] = [
      {
        vehicleId: 'vehicle-1',
        label: 'Vehicle 1',
        capacity: 4,
        passengerIds: ['publisher-1', 'publisher-2', 'publisher-3', 'publisher-4', 'publisher-5'],
        inUse: true,
      },
      {
        vehicleId: 'vehicle-2',
        label: 'Vehicle 2',
        capacity: 5,
        passengerIds: ['publisher-6', 'publisher-7', 'publisher-8'],
        inUse: true,
      },
    ];

    const result = await requestRerunCheck({
      currentAssignments,
      passengers: createPlaceholderPassengers(8),
      vehicles: [
        { id: 'vehicle-1', label: 'Vehicle 1', capacity: 4 },
        { id: 'vehicle-2', label: 'Vehicle 2', capacity: 5 },
      ],
      strategy: DistributionStrategy.MinimizeCars,
    });

    assert.deepEqual(result, { suggest: true, reason: 'current_over_capacity' });
  });

  it('supports all-or-nothing recalculation after capacity edits', () => {
    const editedVehicles = [
      { id: 'vehicle-1', label: 'Vehicle 1', capacity: 4 },
      { id: 'vehicle-2', label: 'Vehicle 2', capacity: 6 },
    ];

    const recalculated = createDistributionSuggestion({
      passengers: createPlaceholderPassengers(10),
      vehicles: editedVehicles,
      strategy: DistributionStrategy.MinimizeCars,
    });

    assert.deepEqual(
      recalculated.assignments.map((assignment) => ({
        capacity: assignment.capacity,
        count: assignment.passengerIds.length,
      })),
      [
        { capacity: 4, count: 4 },
        { capacity: 6, count: 6 },
      ],
    );
  });
});
