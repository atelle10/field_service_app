import { useEffect, useState } from 'react';
import { Check, Menu, Pencil, RefreshCcw, X } from 'lucide-react-native';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  publisherCountOptions,
  type DistributionResponse,
  type PublisherProfile,
  type VehicleInput,
  vehicleCountOptions,
} from '@/models/group-assignment';
import { colors } from '@/styles/theme';
import { AppMenuDrawer } from '@/views/app-menu-drawer';
import { styles } from '@/views/results-screen.styles';

type ActiveCountPicker = 'publishers' | 'vehicles' | null;
type StorageActionFeedback = {
  message: string;
  title: string;
  tone: 'error' | 'success';
};

type ResultsScreenProps = {
  assignPublisherName: (passengerId: string, name: string) => void;
  assignPublisherProfile: (passengerId: string, publisherId: string) => void;
  clearPersistentCache: () => Promise<void>;
  distribution: DistributionResponse | null;
  errorMessage: string;
  getPassengerDisplayName: (passengerId: string) => string;
  hasAssignedPublisherProfile: (passengerId: string) => boolean;
  goHome: () => void;
  goToPublishers: () => void;
  isLoading: boolean;
  publisherCount: number;
  publisherProfiles: PublisherProfile[];
  recalculateDistribution: () => void;
  rerunPromptVisible: boolean;
  restorePassengerDefaultLabel: (passengerId: string) => void;
  saveCurrentResult: () => Promise<void>;
  startOver: () => void;
  storageUsageBytes: number;
  updatePublisherCount: (publisherCount: number) => void;
  updateVehicleCount: (vehicleCount: number) => void;
  updateVehicleCapacity: (vehicleId: string, capacity: number) => void;
  updateVehicleLabel: (vehicleId: string, label: string) => void;
  vehicleCount: number;
  vehicles: VehicleInput[];
};

export function ResultsScreen({
  assignPublisherName,
  assignPublisherProfile,
  clearPersistentCache,
  distribution,
  errorMessage,
  getPassengerDisplayName,
  hasAssignedPublisherProfile,
  goHome,
  goToPublishers,
  isLoading,
  publisherCount,
  publisherProfiles,
  recalculateDistribution,
  rerunPromptVisible,
  restorePassengerDefaultLabel,
  saveCurrentResult,
  startOver,
  storageUsageBytes,
  updatePublisherCount,
  updateVehicleCount,
  updateVehicleCapacity,
  updateVehicleLabel,
  vehicleCount,
  vehicles,
}: ResultsScreenProps) {
  const [activeCountPicker, setActiveCountPicker] = useState<ActiveCountPicker>(null);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [editingVehicleLabel, setEditingVehicleLabel] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [publisherNameInput, setPublisherNameInput] = useState('');
  const [recalculatePulse] = useState(() => new Animated.Value(1));
  const [selectedPassengerId, setSelectedPassengerId] = useState<string | null>(null);
  const [storageActionFeedback, setStorageActionFeedback] =
    useState<StorageActionFeedback | null>(null);
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

  const startEditingVehicleLabel = (vehicle: VehicleInput) => {
    setEditingVehicleId(vehicle.id);
    setEditingVehicleLabel(vehicle.label);
  };

  const cancelEditingVehicleLabel = () => {
    setEditingVehicleId(null);
    setEditingVehicleLabel('');
  };

  const saveEditingVehicleLabel = (vehicle: VehicleInput) => {
    const nextLabel = editingVehicleLabel.trim();

    if (nextLabel) {
      updateVehicleLabel(vehicle.id, nextLabel);
    }

    cancelEditingVehicleLabel();
  };

  const openPublisherEditor = (passengerId: string) => {
    setActiveCountPicker(null);
    setMenuOpen(false);
    setSelectedPassengerId(passengerId);
    setPublisherNameInput('');
  };

  const closePublisherEditor = () => {
    setSelectedPassengerId(null);
    setPublisherNameInput('');
  };

  const savePublisherName = () => {
    if (!selectedPassengerId || !publisherNameInput.trim()) {
      return;
    }

    assignPublisherName(selectedPassengerId, publisherNameInput);
    closePublisherEditor();
  };

  const selectPublisherProfile = (publisherId: string) => {
    if (!selectedPassengerId) {
      return;
    }

    assignPublisherProfile(selectedPassengerId, publisherId);
    closePublisherEditor();
  };

  const restoreSelectedPassengerDefaultLabel = () => {
    if (!selectedPassengerId) {
      return;
    }

    restorePassengerDefaultLabel(selectedPassengerId);
    closePublisherEditor();
  };

  const clearCacheWithFeedback = async () => {
    try {
      await clearPersistentCache();
      setStorageActionFeedback({
        message: 'Stored publishers and saved results were removed from this device.',
        title: 'Cache cleared',
        tone: 'success',
      });
    } catch (error) {
      setStorageActionFeedback({
        message: getStorageActionErrorMessage(error),
        title: 'Cache could not be cleared',
        tone: 'error',
      });
    }
  };

  const saveCurrentResultWithFeedback = async () => {
    try {
      await saveCurrentResult();
      setStorageActionFeedback({
        message: 'This distribution result was saved on this device.',
        title: 'Result saved',
        tone: 'success',
      });
    } catch (error) {
      setStorageActionFeedback({
        message: getStorageActionErrorMessage(error),
        title: 'Result could not be saved',
        tone: 'error',
      });
    }
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
          onClearCache={clearCacheWithFeedback}
          onSelectHome={goHome}
          onSelectPublishers={goToPublishers}
          onSelectOption={() => undefined}
        />
      )}

      <StorageActionFeedbackModal
        feedback={storageActionFeedback}
        onClose={() => setStorageActionFeedback(null)}
      />

      <PublisherEditorModal
        canRestoreDefault={
          selectedPassengerId ? hasAssignedPublisherProfile(selectedPassengerId) : false
        }
        currentLabel={selectedPassengerId ? getPassengerDisplayName(selectedPassengerId) : ''}
        nameInput={publisherNameInput}
        onCancel={closePublisherEditor}
        onChangeName={setPublisherNameInput}
        onConfirm={savePublisherName}
        onRestoreDefault={restoreSelectedPassengerDefaultLabel}
        onSelectProfile={selectPublisherProfile}
        publisherProfiles={publisherProfiles}
        visible={selectedPassengerId !== null}
      />

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
                  rerunPromptVisible
                    ? styles.recalculateButtonActive
                    : styles.recalculateButtonDisabled,
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
                style={({ pressed }) => [
                  styles.summaryToggle,
                  pressed && styles.buttonPressed,
                ]}>
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
              const isEditingVehicleLabel = editingVehicleId === vehicle.id;

              return (
                <View
                  key={vehicle.id}
                  style={[
                    styles.vehicleCard,
                    passengerIds.length > 0
                      ? styles.vehicleCardInUse
                      : styles.vehicleCardUnused,
                    isOverCapacity && styles.vehicleCardOverCapacity,
                  ]}>
                  <View style={styles.vehicleHeader}>
                    <View style={styles.vehicleTitlePanel}>
                      {isEditingVehicleLabel ? (
                        <View style={styles.vehicleNameEditor}>
                          <TextInput
                            accessibilityLabel={`${vehicle.label} name`}
                            autoFocus
                            onChangeText={setEditingVehicleLabel}
                            onSubmitEditing={() => saveEditingVehicleLabel(vehicle)}
                            returnKeyType="done"
                            selectTextOnFocus
                            style={styles.vehicleNameInput}
                            value={editingVehicleLabel}
                          />

                          <View style={styles.vehicleNameEditActions}>
                            <Pressable
                              accessibilityLabel="Save vehicle name"
                              accessibilityRole="button"
                              onPress={() => saveEditingVehicleLabel(vehicle)}
                              style={({ pressed }) => [
                                styles.vehicleNameIconButton,
                                styles.vehicleNameSaveButton,
                                pressed && styles.buttonPressed,
                              ]}>
                              <Check color={colors.background} size={18} strokeWidth={2.8} />
                            </Pressable>

                            <Pressable
                              accessibilityLabel="Cancel vehicle name edit"
                              accessibilityRole="button"
                              onPress={cancelEditingVehicleLabel}
                              style={({ pressed }) => [
                                styles.vehicleNameIconButton,
                                pressed && styles.buttonPressed,
                              ]}>
                              <X color={colors.textMuted} size={18} strokeWidth={2.6} />
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <Pressable
                          accessibilityLabel={`Edit ${vehicle.label} name`}
                          accessibilityRole="button"
                          onPress={() => startEditingVehicleLabel(vehicle)}
                          style={({ pressed }) => [
                            styles.vehicleTitleButton,
                            pressed && styles.buttonPressed,
                          ]}>
                          <Text style={styles.vehicleTitle} numberOfLines={1}>
                            {vehicle.label}
                          </Text>
                          <Pencil color={colors.textMuted} size={16} strokeWidth={2.3} />
                        </Pressable>
                      )}

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
                        <Text
                          style={[
                            styles.stepperText,
                            isOverCapacity && styles.stepperTextWarning,
                          ]}>
                          -
                        </Text>
                      </Pressable>
                      <View
                        style={[
                          styles.capacityBadge,
                          isOverCapacity && styles.capacityBadgeWarning,
                        ]}>
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
                        <Text
                          style={[
                            styles.stepperText,
                            isOverCapacity && styles.stepperTextWarning,
                          ]}>
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
                      <Pressable
                        accessibilityLabel={`Edit ${getPassengerDisplayName(passengerId)}`}
                        accessibilityRole="button"
                        key={passengerId}
                        onPress={() => openPublisherEditor(passengerId)}
                        style={({ pressed }) => [
                          styles.occupiedSeat,
                          isOverCapacity && styles.occupiedSeatWarning,
                          pressed && styles.buttonPressed,
                        ]}>
                        <Text
                          style={[
                            styles.occupiedSeatText,
                            isOverCapacity && styles.occupiedSeatTextWarning,
                          ]}>
                          {getPassengerDisplayName(passengerId)}
                        </Text>
                      </Pressable>
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

          <View style={styles.storageFooter}>
            {distribution && (
              <Pressable
                accessibilityRole="button"
                onPress={saveCurrentResultWithFeedback}
                style={({ pressed }) => [
                  styles.saveResultButton,
                  pressed && styles.buttonPressed,
                ]}>
                <Text style={styles.saveResultButtonText}>Save Result</Text>
              </Pressable>
            )}

            <Text style={styles.storageUsageText}>
              Stored data: {formatStorageUsage(storageUsageBytes)}
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function StorageActionFeedbackModal({
  feedback,
  onClose,
}: {
  feedback: StorageActionFeedback | null;
  onClose: () => void;
}) {
  const isError = feedback?.tone === 'error';

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={feedback !== null}>
      <View style={styles.statusModalOverlay}>
        <View
          style={[
            styles.statusModalCard,
            isError ? styles.statusModalCardError : styles.statusModalCardSuccess,
          ]}>
          <Text
            style={[
              styles.statusModalTitle,
              isError ? styles.statusModalTitleError : styles.statusModalTitleSuccess,
            ]}>
            {feedback?.title}
          </Text>
          <Text style={styles.statusModalMessage}>{feedback?.message}</Text>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.statusModalButton,
              isError ? styles.statusModalButtonError : styles.statusModalButtonSuccess,
              pressed && styles.buttonPressed,
            ]}>
            <Text
              style={[
                styles.statusModalButtonText,
                isError
                  ? styles.statusModalButtonTextError
                  : styles.statusModalButtonTextSuccess,
              ]}>
              OK
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function PublisherEditorModal({
  canRestoreDefault,
  currentLabel,
  nameInput,
  onCancel,
  onChangeName,
  onConfirm,
  onRestoreDefault,
  onSelectProfile,
  publisherProfiles,
  visible,
}: {
  canRestoreDefault: boolean;
  currentLabel: string;
  nameInput: string;
  onCancel: () => void;
  onChangeName: (name: string) => void;
  onConfirm: () => void;
  onRestoreDefault: () => void;
  onSelectProfile: (publisherId: string) => void;
  publisherProfiles: PublisherProfile[];
  visible: boolean;
}) {
  const canConfirm = nameInput.trim().length > 0;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}>
      <View style={styles.publisherModalOverlay}>
        <View style={styles.publisherModalCard}>
          <View style={styles.publisherModalHeader}>
            <Text style={styles.publisherModalTitle}>Edit Publisher</Text>
            <Pressable
              accessibilityLabel="Close publisher editor"
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.publisherModalCloseButton,
                pressed && styles.buttonPressed,
              ]}>
              <X color={colors.textMuted} size={20} strokeWidth={2.6} />
            </Pressable>
          </View>

          <View style={styles.publisherCurrentLabelRow}>
            <Text style={styles.publisherModalCurrentLabel} numberOfLines={1}>
              {currentLabel}
            </Text>

            {canRestoreDefault && (
              <Pressable
                accessibilityLabel="Restore default publisher label"
                accessibilityRole="button"
                onPress={onRestoreDefault}
                style={({ pressed }) => [
                  styles.publisherRestoreDefaultButton,
                  pressed && styles.buttonPressed,
                ]}>
                <X color={colors.dangerText} size={16} strokeWidth={2.6} />
              </Pressable>
            )}
          </View>

          {publisherProfiles.length > 0 && (
            <View style={styles.savedPublishersSection}>
              <Text style={styles.savedPublishersLabel}>Saved Publishers</Text>
              <View style={styles.savedPublisherList}>
                {publisherProfiles.map((publisher) => (
                  <Pressable
                    accessibilityRole="button"
                    key={publisher.id}
                    onPress={() => onSelectProfile(publisher.id)}
                    style={({ pressed }) => [
                      styles.savedPublisherButton,
                      pressed && styles.buttonPressed,
                    ]}>
                    <Text style={styles.savedPublisherButtonText}>{publisher.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <TextInput
            accessibilityLabel="Publisher name"
            autoCapitalize="words"
            onChangeText={onChangeName}
            onSubmitEditing={onConfirm}
            placeholder="Enter publisher name"
            placeholderTextColor={colors.textSubtle}
            returnKeyType="done"
            style={styles.publisherNameInput}
            value={nameInput}
          />

          <View style={styles.publisherModalActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.publisherModalButton,
                styles.publisherModalSecondaryButton,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.publisherModalSecondaryButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={!canConfirm}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.publisherModalButton,
                canConfirm
                  ? styles.publisherModalPrimaryButton
                  : styles.publisherModalDisabledButton,
                pressed && canConfirm && styles.buttonPressed,
              ]}>
              <Text
                style={[
                  styles.publisherModalPrimaryButtonText,
                  !canConfirm && styles.publisherModalDisabledButtonText,
                ]}>
                Confirm
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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

function formatOverCapacityMessage(overCapacityCount: number) {
  const publisherLabel = overCapacityCount === 1 ? 'publisher' : 'publishers';
  return `${overCapacityCount} assigned ${publisherLabel} over capacity. Increase seats or press Recalculate.`;
}

function formatStorageUsage(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}

function getStorageActionErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Please try again.';
}
