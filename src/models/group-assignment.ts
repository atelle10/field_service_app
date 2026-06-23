export type GroupSetupInput = {
  publisherCount: number;
  vehicleCount?: number;
};

export type GroupAssignmentResult = {
  publisherCount: number;
  vehicleCount: number;
};

export const publisherCountOptions = Array.from({ length: 50 }, (_, index) => index + 1);
export const vehicleCountOptions = Array.from({ length: 20 }, (_, index) => index + 1);
