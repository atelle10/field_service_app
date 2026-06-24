import { useEffect, useState } from 'react';
import { Menu, Pencil, RefreshCcw } from 'lucide-react-native';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  publisherCountOptions,
  type DistributionResponse,
  type VehicleInput,
  vehicleCountOptions,
} from '@/models/group-assignment';
import { colors, radii } from '@/styles/theme';
import { AppMenuDrawer } from '@/views/app-menu-drawer';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [recalculatePulse] = useState(() => new Animated.Value(1));
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const activeCountOptions =
    activeCountPicker === 'publishers' ? publisherCountOptions : vehicleCountOptions;
  const activeCount = activeCountPicker === 'publishers' ? publisherCount : vehicleCount;
  const recalculateIconColor = rerunPromptVisible ? colors.mint : colors.textSubtle;

  useEffect(() => {
    if (!rerunPromptVisible) {
      recalculatePulse.stopAnimation();
      recalculatePulse.setValue(1);
      return;
    }

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(recalculatePulse, {
          toValue: 1.04,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(recalculatePulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
      recalculatePulse.setValue(1);
    };
  }, [recalculatePulse, rerunPromptVisible]);

  const closeCountPicker = () => {
    setActiveCountPicker(null);
  };

  const togglePublisherPicker = () => {
    setMenuOpen(false);
    setActiveCountPicker((currentPicker) => {
      return currentPicker === 'publishers' ? null : 'publishers';
    });
  };

  const toggleVehiclePicker = () => {
    setMenuOpen(false);
    setActiveCountPicker((currentPicker) => {
      return currentPicker === 'vehicles' ? null : 'vehicles';
    });
  };

  const selectCount = (count: number) => {
    if (activeCountPicker === 'publishers') {
      updatePublisherCount(count);
    }

    if (activeCountPicker === 'vehicles') {
      updateVehicleCount(count);
    }

    closeCountPicker();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingScreen}>
          <ActivityIndicator color={colors.mint} size="large" />
          <Text style={styles.loadingText}>Calculating distribution...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {menuOpen && (
        <AppMenuDrawer
          onClose={() => setMenuOpen(false)}
          onSelectOption={() => undefined}
        />
      )}

      <View style={styles.screenPanel}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={closeCountPicker}>
          {activeCountPicker && (
            <Pressable
              accessibilityLabel="Close count picker"
              accessibilityRole="button"
              onPress={closeCountPicker}
              style={styles.pickerDismissLayer}
            />
          )}

          <View style={styles.countSelector}>
            <View style={styles.countHeader}>
              <Pressable
                accessibilityLabel={menuOpen ? 'Close menu' : 'Open menu'}
                accessibilityRole="button"
                onPress={() => {
                  setActiveCountPicker(null);
                  setMenuOpen((currentValue) => !currentValue);
                }}
                style={({ pressed }) => [styles.menuButton, pressed && styles.buttonPressed]}>
                <Menu color={colors.text} size={22} strokeWidth={2.5} />
              </Pressable>

              <View style={styles.countControls}>
                <Pressable
                  accessibilityRole="button"
                  onPress={togglePublisherPicker}
                  style={({ pressed }) => [
                    styles.countButton,
                    activeCountPicker === 'publishers' && styles.countButtonActive,
                    pressed && styles.buttonPressed,
                  ]}>
                  <Text style={styles.countButtonText}>Publishers: {publisherCount}</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={toggleVehiclePicker}
                  style={({ pressed }) => [
                    styles.countButton,
                    activeCountPicker === 'vehicles' && styles.countButtonActive,
                    pressed && styles.buttonPressed,
                  ]}>
                  <Text style={styles.countButtonText}>Vehicles: {vehicleCount}</Text>
                </Pressable>
              </View>
            </View>

            {activeCountPicker && (
              <View style={styles.dropdownRow}>
                <View style={styles.dropdownMenuSpacer} />

                <View style={styles.dropdownControls}>
                  {activeCountPicker === 'publishers' ? (
                    <CountDropdown
                      activeCount={activeCount}
                      activeCountOptions={activeCountOptions}
                      selectCount={selectCount}
                    />
                  ) : (
                    <View style={styles.dropdownSlot} />
                  )}

                  {activeCountPicker === 'vehicles' ? (
                    <CountDropdown
                      activeCount={activeCount}
                      activeCountOptions={activeCountOptions}
                      selectCount={selectCount}
                    />
                  ) : (
                    <View style={styles.dropdownSlot} />
                  )}
                </View>
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

          <Animated.View style={{ transform: [{ scale: recalculatePulse }] }}>
            <Pressable
              accessibilityRole="button"
              disabled={!rerunPromptVisible}
              onPress={recalculateDistribution}
              style={({ pressed }) => [
                styles.actionButton,
                styles.actionButtonWithIcon,
                rerunPromptVisible ? styles.recalculateButtonActive : styles.recalculateButtonDisabled,
                pressed && styles.buttonPressed,
              ]}>
              <RefreshCcw color={recalculateIconColor} size={16} strokeWidth={2.5} />
              <Text
                style={[
                  styles.actionButtonText,
                  rerunPromptVisible && styles.recalculateButtonTextActive,
                  !rerunPromptVisible && styles.recalculateButtonTextDisabled,
                ]}>
                Recalculate
              </Text>
            </Pressable>
          </Animated.View>
          </View>

        {!!errorMessage && (
          <View style={styles.errorPanel}>
            <Text style={styles.errorTitle}>Not enough seats</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {distribution?.summary && (
          <View style={styles.summaryMenu}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSummaryExpanded((currentValue) => !currentValue)}
              style={({ pressed }) => [styles.summaryToggle, pressed && styles.buttonPressed]}>
              <Text style={styles.summaryToggleText}>Distribution Summary</Text>
              <Text style={styles.summaryToggleIcon}>{summaryExpanded ? '-' : '+'}</Text>
            </Pressable>

            {summaryExpanded && (
              <View style={styles.summaryRow}>
                <SummaryItem
                  label="Vehicles Used"
                  value={String(distribution.summary.vehiclesUsed)}
                  tone="forest"
                />
                <SummaryItem
                  label="Total Seats"
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
          </View>
        )}

        <View style={styles.vehicleList}>
          {vehicles.map((vehicle) => {
            const assignment = distribution?.assignments.find(
              (vehicleAssignment) => vehicleAssignment.vehicleId === vehicle.id,
            );
            const passengerIds = assignment?.passengerIds ?? [];
            const openSeatCount = Math.max(vehicle.capacity - passengerIds.length, 0);
            const isOverCapacity = passengerIds.length > vehicle.capacity;
            const overCapacityCount = Math.max(passengerIds.length - vehicle.capacity, 0);

            return (
              <View
                key={vehicle.id}
                style={[
                  styles.vehicleCard,
                  passengerIds.length > 0 ? styles.vehicleCardInUse : styles.vehicleCardUnused,
                  isOverCapacity && styles.vehicleCardOverCapacity,
                ]}>
                <View style={styles.vehicleHeader}>
                  <View>
                    <View style={styles.vehicleTitleRow}>
                      <Text style={styles.vehicleTitle}>{vehicle.label}</Text>
                      <Pencil color={colors.textMuted} size={16} strokeWidth={2.3} />
                    </View>
                    <Text
                      style={[
                        styles.vehicleMeta,
                        isOverCapacity && styles.vehicleMetaOverCapacity,
                      ]}>
                      {passengerIds.length}/{vehicle.capacity} seats
                      {assignment?.inUse === false ? ' - unused' : ''}
                    </Text>
                  </View>

                  <View style={styles.capacityControls}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => updateVehicleCapacity(vehicle.id, vehicle.capacity - 1)}
                      style={({ pressed }) => [
                        styles.stepperButton,
                        isOverCapacity && styles.stepperButtonWarning,
                        pressed && styles.buttonPressed,
                      ]}>
                      <Text style={[styles.stepperText, isOverCapacity && styles.stepperTextWarning]}>
                        -
                      </Text>
                    </Pressable>
                    <View style={[styles.capacityBadge, isOverCapacity && styles.capacityBadgeWarning]}>
                      <Text
                        style={[
                          styles.capacityText,
                          isOverCapacity && styles.capacityTextWarning,
                        ]}>
                        {vehicle.capacity}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => updateVehicleCapacity(vehicle.id, vehicle.capacity + 1)}
                      style={({ pressed }) => [
                        styles.stepperButton,
                        isOverCapacity && styles.stepperButtonWarning,
                        pressed && styles.buttonPressed,
                      ]}>
                      <Text style={[styles.stepperText, isOverCapacity && styles.stepperTextWarning]}>
                        +
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {isOverCapacity && (
                  <View style={styles.vehicleWarning}>
                    <Text style={styles.vehicleWarningText}>
                      {formatOverCapacityMessage(overCapacityCount)}
                    </Text>
                  </View>
                )}

                <View style={styles.seatGrid}>
                  {passengerIds.map((passengerId) => (
                    <View
                      key={passengerId}
                      style={[styles.occupiedSeat, isOverCapacity && styles.occupiedSeatWarning]}>
                      <Text
                        style={[
                          styles.occupiedSeatText,
                          isOverCapacity && styles.occupiedSeatTextWarning,
                        ]}>
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
      </View>
    </SafeAreaView>
  );
}

function CountDropdown({
  activeCount,
  activeCountOptions,
  selectCount,
}: {
  activeCount: number;
  activeCountOptions: number[];
  selectCount: (count: number) => void;
}) {
  return (
    <View style={[styles.dropdownSlot, styles.dropdown]}>
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

function formatOverCapacityMessage(overCapacityCount: number) {
  const publisherLabel = overCapacityCount === 1 ? 'publisher' : 'publishers';
  return `${overCapacityCount} assigned ${publisherLabel} over capacity. Increase seats or press Recalculate.`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenPanel: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pickerDismissLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 28,
    gap: 18,
  },
  countSelector: {
    gap: 10,
    zIndex: 2,
  },
  countHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.small,
    backgroundColor: colors.surface,
  },
  countControls: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    marginLeft: 6,
  },
  countButton: {
    flex: 1,
    minHeight: 44,
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
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dropdownMenuSpacer: {
    width: 44,
  },
  dropdownControls: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    marginLeft: 6,
  },
  dropdownSlot: {
    flex: 1,
  },
  dropdown: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.large,
    backgroundColor: colors.surfaceStrong,
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
  actionButtonWithIcon: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  recalculateButtonActive: {
    borderColor: colors.mint,
    backgroundColor: colors.surface,
  },
  recalculateButtonDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  recalculateButtonTextDisabled: {
    color: colors.textSubtle,
  },
  recalculateButtonTextActive: {
    color: colors.mint,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 24,
  },
  loadingText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
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
  summaryMenu: {
    gap: 10,
  },
  summaryToggle: {
    minHeight: 46,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.small,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  summaryToggleText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  summaryToggleIcon: {
    color: colors.mint,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
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
    fontSize: 12,
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
  vehicleCardOverCapacity: {
    backgroundColor: colors.dangerBackground,
    borderColor: colors.dangerText,
    borderLeftColor: colors.dangerText,
  },
  vehicleHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  vehicleTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
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
  vehicleMetaOverCapacity: {
    color: colors.dangerText,
    fontWeight: '700',
  },
  vehicleWarning: {
    borderWidth: 1,
    borderColor: colors.dangerText,
    borderRadius: radii.small,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  vehicleWarningText: {
    color: colors.dangerText,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
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
  stepperButtonWarning: {
    borderColor: colors.dangerText,
  },
  stepperText: {
    color: colors.mint,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
  stepperTextWarning: {
    color: colors.dangerText,
  },
  capacityBadge: {
    minWidth: 34,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.small,
    paddingHorizontal: 8,
  },
  capacityBadgeWarning: {
    backgroundColor: colors.dangerText,
  },
  capacityText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  capacityTextWarning: {
    color: colors.background,
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
  occupiedSeatWarning: {
    backgroundColor: colors.dangerText,
  },
  occupiedSeatText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  occupiedSeatTextWarning: {
    color: colors.background,
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
