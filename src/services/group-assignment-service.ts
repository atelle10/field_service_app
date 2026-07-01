import {
  DEFAULT_VEHICLE_CAPACITY,
  DistributionStrategy,
  type DistributionStrategyId,
  type DistributionRequest,
  type DistributionResponse,
  type Passenger,
  type RerunCheckRequest,
  type RerunCheckResponse,
  type VehicleAssignment,
  type VehicleInput,
} from '@/models/group-assignment';
import {
  formatDefaultPublisherLabel,
  formatDefaultVehicleLabel,
  Language,
  type LanguageCode,
  translate,
} from '@/i18n';

type RankedVehicle = VehicleInput & {
  inputOrder: number;
};

type MutableAssignment = VehicleAssignment & {
  inputOrder: number;
  selected: boolean;
};

export function createPlaceholderPassengers(
  publisherCount: number,
  language: LanguageCode = Language.English,
): Passenger[] {
  return Array.from({ length: publisherCount }, (_, index) => ({
    id: `publisher-${index + 1}`,
    displayName: formatDefaultPublisherLabel(language, index + 1),
  }));
}

export function createDefaultVehicles(
  vehicleCount: number,
  capacity = DEFAULT_VEHICLE_CAPACITY,
  language: LanguageCode = Language.English,
): VehicleInput[] {
  return Array.from({ length: vehicleCount }, (_, index) => ({
    id: `vehicle-${index + 1}`,
    label: formatDefaultVehicleLabel(language, index + 1),
    capacity,
  }));
}

export function createDistributionSuggestion(request: DistributionRequest): DistributionResponse {
  return distributePassengers(request);
}

export async function requestDistributionSuggestion(
  request: DistributionRequest,
): Promise<DistributionResponse> {
  return createDistributionSuggestion(request);
}

export async function requestRerunCheck(
  request: RerunCheckRequest,
): Promise<RerunCheckResponse> {
  const currentOverCapacity = request.currentAssignments.some(
    (assignment) => assignment.passengerIds.length > assignment.capacity,
  );

  if (currentOverCapacity) {
    return { suggest: true, reason: 'current_over_capacity' };
  }

  const freshSuggestion = distributePassengers(request);
  const currentCarsUsed = request.currentAssignments.filter(
    (assignment) => assignment.passengerIds.length > 0,
  ).length;
  const freshCarsUsed = freshSuggestion.assignments.filter(
    (assignment) => assignment.passengerIds.length > 0,
  ).length;

  if (
    request.strategy === DistributionStrategy.MinimizeCars &&
    freshCarsUsed < currentCarsUsed
  ) {
    return { suggest: true, reason: 'fewer_cars_possible' };
  }

  if (assignmentSpread(freshSuggestion.assignments) < assignmentSpread(request.currentAssignments)) {
    return { suggest: true, reason: 'better_balance_possible' };
  }

  return { suggest: false };
}

function distributePassengers(request: DistributionRequest): DistributionResponse {
  validateDistributionRequest(request);
  const language = request.language ?? Language.English;

  const rankedVehicles = request.vehicles.map((vehicle, inputOrder) => ({
    ...vehicle,
    inputOrder,
  }));
  const totalCapacity = rankedVehicles.reduce((sum, vehicle) => sum + vehicle.capacity, 0);

  if (request.passengers.length > totalCapacity) {
    throw new Error(
      translate(language, 'capacityShortage', {
        publishers: request.passengers.length,
        seatsNeeded: request.passengers.length,
        vehicles: request.vehicles.length,
        seatsAvailable: totalCapacity,
      }),
    );
  }

  const selectedVehicles = selectVehicles(rankedVehicles, request);
  const assignments = createMutableAssignments(rankedVehicles, selectedVehicles);

  for (const passenger of request.passengers) {
    const target = chooseAssignment(assignments, request.strategy);

    if (!target) {
      throw new Error(translate(language, 'noAvailableVehicleSeats'));
    }

    target.passengerIds.push(passenger.id);
    target.inUse = true;
  }

  const finalizedAssignments = assignments
    .sort((a, b) => a.inputOrder - b.inputOrder)
    .map(({ inputOrder: _inputOrder, selected: _selected, ...assignment }) => assignment);

  return {
    strategy: request.strategy,
    assignments: finalizedAssignments,
    summary: {
      passengerCount: request.passengers.length,
      vehicleCount: request.vehicles.length,
      vehiclesUsed: finalizedAssignments.filter((assignment) => assignment.inUse).length,
      totalCapacity,
      unusedSeats:
        totalCapacity -
        finalizedAssignments.reduce(
          (assignedSeats, assignment) => assignedSeats + assignment.passengerIds.length,
          0,
        ),
    },
  };
}

function validateDistributionRequest(request: DistributionRequest) {
  const language = request.language ?? Language.English;

  if (!Number.isInteger(request.passengers.length) || request.passengers.length < 1) {
    throw new Error(translate(language, 'publisherRequired'));
  }

  if (request.vehicles.length < 1) {
    throw new Error(translate(language, 'vehicleRequired'));
  }

  for (const vehicle of request.vehicles) {
    if (!Number.isInteger(vehicle.capacity) || vehicle.capacity < 0) {
      throw new Error(
        translate(language, 'vehicleCapacityInvalid', { label: vehicle.label }),
      );
    }
  }
}

function selectVehicles(vehicles: RankedVehicle[], request: DistributionRequest): RankedVehicle[] {
  const usableVehicles = vehicles.filter((vehicle) => vehicle.capacity > 0);

  if (request.strategy === DistributionStrategy.MaximizeComfort) {
    return usableVehicles;
  }

  let runningCapacity = 0;
  const selectedVehicles: RankedVehicle[] = [];
  const vehiclesByCapacity = [...usableVehicles].sort((a, b) => {
    if (b.capacity !== a.capacity) {
      return b.capacity - a.capacity;
    }

    return a.inputOrder - b.inputOrder;
  });

  for (const vehicle of vehiclesByCapacity) {
    selectedVehicles.push(vehicle);
    runningCapacity += vehicle.capacity;

    if (runningCapacity >= request.passengers.length) {
      break;
    }
  }

  return selectedVehicles;
}

function createMutableAssignments(
  vehicles: RankedVehicle[],
  selectedVehicles: RankedVehicle[],
): MutableAssignment[] {
  const selectedVehicleIds = new Set(selectedVehicles.map((vehicle) => vehicle.id));

  return vehicles.map((vehicle) => ({
    vehicleId: vehicle.id,
    label: vehicle.label,
    capacity: vehicle.capacity,
    passengerIds: [],
    inUse: false,
    inputOrder: vehicle.inputOrder,
    selected: selectedVehicleIds.has(vehicle.id),
  }));
}

function chooseAssignment(
  assignments: MutableAssignment[],
  strategy: DistributionStrategyId,
): MutableAssignment | undefined {
  const candidates = assignments.filter(
    (assignment) => assignment.selected && assignment.passengerIds.length < assignment.capacity,
  );

  if (strategy === DistributionStrategy.MaximizeComfort) {
    return candidates.sort((a, b) => {
      const occupancyDelta = a.passengerIds.length / a.capacity - b.passengerIds.length / b.capacity;

      if (occupancyDelta !== 0) {
        return occupancyDelta;
      }

      return tieBreakAssignments(a, b);
    })[0];
  }

  return candidates.sort((a, b) => {
    if (a.passengerIds.length !== b.passengerIds.length) {
      return a.passengerIds.length - b.passengerIds.length;
    }

    return tieBreakAssignments(a, b);
  })[0];
}

function tieBreakAssignments(a: MutableAssignment, b: MutableAssignment) {
  const aRemainingSeats = a.capacity - a.passengerIds.length;
  const bRemainingSeats = b.capacity - b.passengerIds.length;

  if (aRemainingSeats !== bRemainingSeats) {
    return bRemainingSeats - aRemainingSeats;
  }

  return a.inputOrder - b.inputOrder;
}

function assignmentSpread(assignments: VehicleAssignment[]) {
  const counts = assignments
    .filter((assignment) => assignment.passengerIds.length > 0)
    .map((assignment) => assignment.passengerIds.length);

  if (counts.length < 2) {
    return 0;
  }

  return Math.max(...counts) - Math.min(...counts);
}
