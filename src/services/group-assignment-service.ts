import type { GroupAssignmentResult, GroupSetupInput } from '@/models/group-assignment';

export function createGroupAssignment(input: Required<GroupSetupInput>): GroupAssignmentResult {
  // Backend optimization for publisher-to-vehicle assignments will plug in here.
  return {
    publisherCount: input.publisherCount,
    vehicleCount: input.vehicleCount,
  };
}
