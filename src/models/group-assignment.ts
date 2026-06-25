export const DEFAULT_VEHICLE_CAPACITY = 5;

export const DistributionStrategy = {
  MinimizeCars: 'minimize_cars',
  MaximizeComfort: 'maximize_comfort',
} as const;

export type DistributionStrategyId =
  (typeof DistributionStrategy)[keyof typeof DistributionStrategy];

export type Passenger = {
  id: string;
  displayName: string;
};

export type PublisherProfile = {
  id: string;
  name: string;
};

export type VehicleInput = {
  id: string;
  label: string;
  capacity: number;
};

export type VehicleAssignment = {
  vehicleId: string;
  label: string;
  capacity: number;
  passengerIds: string[];
  inUse: boolean;
};

export type DistributionSummary = {
  passengerCount: number;
  vehicleCount: number;
  vehiclesUsed: number;
  totalCapacity: number;
  unusedSeats: number;
};

export type DistributionRequest = {
  passengers: Passenger[];
  vehicles: VehicleInput[];
  strategy: DistributionStrategyId;
};

export type DistributionResponse = {
  strategy: DistributionStrategyId;
  assignments: VehicleAssignment[];
  summary: DistributionSummary;
};

export type RerunCheckRequest = DistributionRequest & {
  currentAssignments: VehicleAssignment[];
};

export type RerunCheckResponse = {
  suggest: boolean;
  reason?: 'current_over_capacity' | 'fewer_cars_possible' | 'better_balance_possible';
};

export const publisherCountOptions = Array.from({ length: 50 }, (_, index) => index + 1);
export const vehicleCountOptions = Array.from({ length: 20 }, (_, index) => index + 1);
