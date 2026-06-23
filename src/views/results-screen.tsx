import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  publisherCountOptions,
  type DistributionResponse,
  type VehicleInput,
  vehicleCountOptions,
} from '@/models/group-assignment';
import { colors, radii } from '@/styles/theme';

type ActiveCountPicker = 'publishers' | 'vehicles' | null;

type ResultsScreenProps = {
  distribution: DistributionResponse | null;
  errorMessage: string;
  isLoading: boolean;
  publisherCount: number;
  recalculateDistribution: () => void;
  rerunPromptVisible: boolean;
  startOver: () => void;
  updatePublisherCount: (publisherCount: number) => void;
  updateVehicleCount: (vehicleCount: number) => void;
  updateVehicleCapacity: (vehicleId: string, capacity: number) => void;
  vehicleCount: number;
  vehicles: VehicleInput[];
};

export function ResultsScreen({
  distribution,
  errorMessage,
  isLoading,
  publisherCount,
  recalculateDistribution,
  rerunPromptVisible,
  startOver,
  updatePublisherCount,
  updateVehicleCount,
  updateVehicleCapacity,
  vehicleCount,
  vehicles,
}: ResultsScreenProps) {
  const [activeCountPicker, setActiveCountPicker] = useState<ActiveCountPicker>(null);
  const activeCountOptions =
    activeCountPicker === 'publishers' ? publisherCountOptions : vehicleCountOptions;
  const activeCount = activeCountPicker === 'publishers' ? publisherCount : vehicleCount;

  const selectCount = (count: number) => {
    if (activeCountPicker === 'publishers') {
      updatePublisherCount(count);
    }

    if (activeCountPicker === 'vehicles') {
      updateVehicleCount(count);
    }

    setActiveCountPicker(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setActiveCountPicker(null)}>
        <View style={styles.countSelector}>
          <View style={styles.countControls}>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                setActiveCountPicker((currentPicker) =>
                  currentPicker === 'publishers' ? null : 'publishers',
                )
              }
              style={({ pressed }) => [
                styles.countButton,
                activeCountPicker === 'publishers' && styles.countButtonActive,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.countButtonText}>Publishers: {publisherCount}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() =>
                setActiveCountPicker((currentPicker) =>
                  currentPicker === 'vehicles' ? null : 'vehicles',
                )
              }
              style={({ pressed }) => [
                styles.countButton,
                activeCountPicker === 'vehicles' && styles.countButtonActive,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.countButtonText}>Vehicles: {vehicleCount}</Text>
            </Pressable>
          </View>

          {activeCountPicker && (
            <View
              style={[
                styles.dropdown,
                activeCountPicker === 'publishers' ? styles.dropdownLeft : styles.dropdownRight,
              ]}>
              <ScrollView
                nestedScrollEnabled
                style={styles.dropdownScroll}
                contentContainerStyle={styles.dropdownContent}
                showsVerticalScrollIndicator={false}>
                {activeCountOptions.map((count) => {
                  const isSelected = count === activeCount;

                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={count}
                      onPress={() => selectCount(count)}
                      style={({ pressed }) => [
                        styles.dropdownOption,
                        isSelected && styles.dropdownOptionSelected,
                        pressed && styles.buttonPressed,
                      ]}>
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          isSelected && styles.dropdownOptionTextSelected,
                        ]}>
                        {count}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.actionBar}>
          <Pressable
            accessibilityRole="button"
            onPress={startOver}
            style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]}>
            <Text style={styles.actionButtonText}>Start Over</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={!rerunPromptVisible}
            onPress={recalculateDistribution}
            style={({ pressed }) => [
              styles.actionButton,
              rerunPromptVisible ? styles.recalculateButtonActive : styles.recalculateButtonDisabled,
              pressed && styles.buttonPressed,
            ]}>
            <Text
              style={[
                styles.actionButtonText,
                rerunPromptVisible && styles.recalculateButtonTextActive,
                !rerunPromptVisible && styles.recalculateButtonTextDisabled,
              ]}>
              Recalculate
            </Text>
          </Pressable>
        </View>

        {isLoading && <Text style={styles.statusText}>Generating distribution...</Text>}

        {!!errorMessage && (
          <View style={styles.errorPanel}>
            <Text style={styles.errorTitle}>Not enough seats</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {distribution?.summary && (
          <View style={styles.summaryRow}>
            <SummaryItem
              label="Used"
              value={String(distribution.summary.vehiclesUsed)}
              tone="forest"
            />
            <SummaryItem
              label="Seats"
              value={String(distribution.summary.totalCapacity)}
              tone="purple"
            />
            <SummaryItem
              label="Open"
              value={String(distribution.summary.unusedSeats)}
              tone="mint"
            />
          </View>
        )}

        <View style={styles.vehicleList}>
          {vehicles.map((vehicle) => {
            const assignment = distribution?.assignments.find(
              (vehicleAssignment) => vehicleAssignment.vehicleId === vehicle.id,
            );
            const passengerIds = assignment?.passengerIds ?? [];
            const openSeatCount = Math.max(vehicle.capacity - passengerIds.length, 0);

            return (
              <View
                key={vehicle.id}
                style={[
                  styles.vehicleCard,
                  passengerIds.length > 0 ? styles.vehicleCardInUse : styles.vehicleCardUnused,
                ]}>
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

                <View style={styles.seatGrid}>
                  {passengerIds.map((passengerId) => (
                    <View key={passengerId} style={styles.occupiedSeat}>
                      <Text style={styles.occupiedSeatText}>
                        {formatPassengerLabel(passengerId)}
                      </Text>
                    </View>
                  ))}

                  {Array.from({ length: openSeatCount }, (_, index) => (
                    <View key={`${vehicle.id}-open-${index}`} style={styles.openSeat}>
                      <Text style={styles.openSeatText}>Open</Text>
                    </View>
                  ))}

                  {passengerIds.length === 0 && openSeatCount === 0 && (
                    <Text style={styles.emptySeatText}>No seats available</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'forest' | 'mint' | 'purple';
}) {
  const toneStyle =
    tone === 'forest'
      ? styles.summaryItemForest
      : tone === 'purple'
        ? styles.summaryItemPurple
        : styles.summaryItemMint;
  const valueStyle =
    tone === 'forest'
      ? styles.summaryValueForest
      : tone === 'purple'
        ? styles.summaryValuePurple
        : styles.summaryValueMint;

  return (
    <View style={[styles.summaryItem, toneStyle]}>
      <Text style={[styles.summaryValue, valueStyle]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function formatPassengerLabel(passengerId: string) {
  return passengerId.replace('publisher-', 'Publisher ');
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 28,
    gap: 18,
  },
  countSelector: {
    gap: 10,
  },
  countControls: {
    flexDirection: 'row',
    gap: 10,
  },
  countButton: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.small,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
  },
  countButtonActive: {
    borderColor: colors.mint,
    backgroundColor: colors.deepForest,
  },
  countButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  dropdown: {
    width: '48%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.large,
    backgroundColor: colors.surfaceStrong,
  },
  dropdownLeft: {
    alignSelf: 'flex-start',
  },
  dropdownRight: {
    alignSelf: 'flex-end',
  },
  dropdownScroll: {
    maxHeight: 220,
  },
  dropdownContent: {
    padding: 6,
  },
  dropdownOption: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.small,
  },
  dropdownOptionSelected: {
    backgroundColor: colors.mint,
  },
  dropdownOptionText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  dropdownOptionTextSelected: {
    color: colors.background,
  },
  actionBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  actionButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.small,
    backgroundColor: colors.deepForest,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  actionButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  recalculateButtonActive: {
    borderColor: colors.mint,
    backgroundColor: colors.mint,
  },
  recalculateButtonDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  recalculateButtonTextDisabled: {
    color: colors.textSubtle,
  },
  recalculateButtonTextActive: {
    color: colors.background,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  errorPanel: {
    gap: 6,
    borderRadius: radii.medium,
    backgroundColor: colors.dangerBackground,
    padding: 16,
  },
  errorTitle: {
    color: colors.dangerText,
    fontSize: 18,
    fontWeight: '700',
  },
  errorText: {
    color: colors.dangerText,
    fontSize: 15,
    lineHeight: 21,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryItem: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.medium,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  summaryItemForest: {
    borderTopWidth: 4,
    borderTopColor: colors.deepForest,
  },
  summaryItemPurple: {
    borderTopWidth: 4,
    borderTopColor: colors.purple,
  },
  summaryItemMint: {
    borderTopWidth: 4,
    borderTopColor: colors.mint,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  summaryValueForest: {
    color: colors.mint,
  },
  summaryValuePurple: {
    color: colors.text,
  },
  summaryValueMint: {
    color: colors.mint,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  vehicleList: {
    gap: 12,
  },
  vehicleCard: {
    gap: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderRadius: radii.medium,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
    padding: 16,
  },
  vehicleCardInUse: {
    borderLeftColor: colors.deepForest,
  },
  vehicleCardUnused: {
    borderLeftColor: colors.textSubtle,
  },
  vehicleHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  vehicleTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '700',
  },
  vehicleMeta: {
    color: colors.textMuted,
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
    borderWidth: 1,
    borderColor: colors.deepForest,
    borderRadius: radii.small,
    backgroundColor: colors.background,
  },
  stepperText: {
    color: colors.mint,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
  capacityText: {
    minWidth: 24,
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  seatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  occupiedSeat: {
    minWidth: 102,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.small,
    backgroundColor: colors.purple,
    paddingHorizontal: 12,
  },
  occupiedSeatText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  openSeat: {
    minWidth: 86,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.small,
    backgroundColor: colors.mint,
    paddingHorizontal: 12,
  },
  openSeatText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
  },
  emptySeatText: {
    color: colors.textSubtle,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.82,
  },
});
