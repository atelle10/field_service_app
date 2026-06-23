import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { DistributionResponse, VehicleInput } from '@/models/group-assignment';

type ResultsScreenProps = {
  distribution: DistributionResponse | null;
  errorMessage: string;
  isLoading: boolean;
  publisherCount: number;
  recalculateDistribution: () => void;
  rerunPromptVisible: boolean;
  updateVehicleCapacity: (vehicleId: string, capacity: number) => void;
  vehicles: VehicleInput[];
  goBack: () => void;
};

export function ResultsScreen({
  distribution,
  errorMessage,
  isLoading,
  publisherCount,
  recalculateDistribution,
  rerunPromptVisible,
  updateVehicleCapacity,
  vehicles,
  goBack,
}: ResultsScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Pressable
        accessibilityRole="button"
        onPress={goBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}>
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Suggested Distribution</Text>
        <Text style={styles.subtitle}>
          {publisherCount} publishers - {vehicles.length} vehicles - default 5 seats
        </Text>

        {rerunPromptVisible && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>Seat counts changed — recalculate distribution?</Text>
            <Pressable
              accessibilityRole="button"
              onPress={recalculateDistribution}
              style={({ pressed }) => [styles.bannerButton, pressed && styles.buttonPressed]}>
              <Text style={styles.bannerButtonText}>Recalculate</Text>
            </Pressable>
          </View>
        )}

        {isLoading && <Text style={styles.statusText}>Generating distribution...</Text>}

        {!!errorMessage && (
          <View style={styles.errorPanel}>
            <Text style={styles.errorTitle}>Not enough seats</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {distribution?.summary && (
          <View style={styles.summaryRow}>
            <SummaryItem label="Used" value={String(distribution.summary.vehiclesUsed)} />
            <SummaryItem label="Seats" value={String(distribution.summary.totalCapacity)} />
            <SummaryItem label="Open" value={String(distribution.summary.unusedSeats)} />
          </View>
        )}

        <View style={styles.vehicleList}>
          {vehicles.map((vehicle) => {
            const assignment = distribution?.assignments.find(
              (vehicleAssignment) => vehicleAssignment.vehicleId === vehicle.id,
            );
            const passengerIds = assignment?.passengerIds ?? [];

            return (
              <View key={vehicle.id} style={styles.vehicleCard}>
                <View style={styles.vehicleHeader}>
                  <View>
                    <Text style={styles.vehicleTitle}>{vehicle.label}</Text>
                    <Text style={styles.vehicleMeta}>
                      {passengerIds.length}/{vehicle.capacity} seats
                      {assignment?.inUse === false ? ' - unused' : ''}
                    </Text>
                  </View>

                  <View style={styles.capacityControls}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => updateVehicleCapacity(vehicle.id, vehicle.capacity - 1)}
                      style={({ pressed }) => [styles.stepperButton, pressed && styles.buttonPressed]}>
                      <Text style={styles.stepperText}>-</Text>
                    </Pressable>
                    <Text style={styles.capacityText}>{vehicle.capacity}</Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => updateVehicleCapacity(vehicle.id, vehicle.capacity + 1)}
                      style={({ pressed }) => [styles.stepperButton, pressed && styles.buttonPressed]}>
                      <Text style={styles.stepperText}>+</Text>
                    </Pressable>
                  </View>
                </View>

                <Text style={styles.passengerList}>
                  {passengerIds.length > 0 ? passengerIds.join(', ') : 'No publishers assigned'}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  backButton: {
    position: 'absolute',
    top: 64,
    left: 24,
    zIndex: 1,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#1D4ED8',
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 128,
    gap: 18,
  },
  title: {
    color: '#111827',
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
  },
  subtitle: {
    color: '#4B5563',
    fontSize: 16,
    lineHeight: 22,
  },
  banner: {
    gap: 12,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    padding: 16,
  },
  bannerText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  bannerButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bannerButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  statusText: {
    color: '#4B5563',
    fontSize: 16,
  },
  errorPanel: {
    gap: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    padding: 16,
  },
  errorTitle: {
    color: '#991B1B',
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    color: '#7F1D1D',
    fontSize: 15,
    lineHeight: 21,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryItem: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    padding: 14,
  },
  summaryValue: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '700',
  },
  summaryLabel: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  vehicleList: {
    gap: 12,
  },
  vehicleCard: {
    gap: 14,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  vehicleHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  vehicleTitle: {
    color: '#111827',
    fontSize: 19,
    fontWeight: '700',
  },
  vehicleMeta: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 2,
  },
  capacityControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  stepperButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  stepperText: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
  capacityText: {
    minWidth: 24,
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  passengerList: {
    color: '#4B5563',
    fontSize: 14,
    lineHeight: 20,
  },
  buttonPressed: {
    opacity: 0.82,
  },
});
