import {
  forwardRef,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Check,
  History,
  ListRestart,
  Menu,
  NotebookPen,
  Pencil,
  RefreshCcw,
  Save,
  X,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  Animated as RNAnimated,
  Modal,
  Pressable,
  ScrollView,
  type StyleProp,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  interpolateColor,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  type AppPreferences,
  publisherCountOptions,
  type DistributionResponse,
  type PublisherProfile,
  type VehicleInput,
  vehicleCountOptions,
} from '@/models/group-assignment';
import { colors } from '@/styles/theme';
import { AppMenuDrawer, DrawerEdgeSwipeArea } from '@/views/app-menu-drawer';
import { styles } from '@/views/results-screen.styles';

type ActiveCountPicker = 'publishers' | 'vehicles' | null;

type DragState = {
  canDrop: boolean;
  label: string;
  passengerId: string;
  sourceVehicleId: string;
  targetVehicleId: string | null;
};

type VehicleDropZone = {
  canAccept: boolean;
  vehicleId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const subtleSpringConfig = {
  damping: 18,
  mass: 0.7,
  stiffness: 180,
};

function setSharedValue(sharedValue: SharedValue<number>, value: number) {
  'worklet';
  sharedValue.value = value;
}

function springSharedValue(sharedValue: SharedValue<number>, value: number) {
  'worklet';
  sharedValue.value = withSpring(value, subtleSpringConfig);
}

function timeSharedValue(
  sharedValue: SharedValue<number>,
  value: number,
  duration: number,
) {
  'worklet';
  sharedValue.value = withTiming(value, { duration });
}

function timeSharedValueWithCompletion(
  sharedValue: SharedValue<number>,
  value: number,
  duration: number,
  onComplete: () => void,
) {
  'worklet';
  sharedValue.value = withTiming(value, { duration }, (finished) => {
    if (finished) {
      runOnJS(onComplete)();
    }
  });
}

type ResultsScreenProps = {
  assignPublisherName: (passengerId: string, name: string) => void;
  assignPublisherProfile: (passengerId: string, publisherId: string) => void;
  disableServiceView: () => void;
  distribution: DistributionResponse | null;
  enableServiceView: () => Promise<void>;
  errorMessage: string;
  getPassengerDisplayName: (passengerId: string) => string;
  hasAssignedPublisherProfile: (passengerId: string) => boolean;
  hasActiveSession: boolean;
  goHome: () => void;
  goToHistory: () => void;
  goToInfo: () => void;
  goToPublishers: () => void;
  goToOptions: () => void;
  isLoading: boolean;
  incrementServiceSelection: (passengerId: string) => void;
  movePassengerToVehicle: (passengerId: string, targetVehicleId: string) => void;
  preferences: AppPreferences;
  publisherCount: number;
  publisherProfiles: PublisherProfile[];
  recalculateDistribution: () => void;
  rerunPromptVisible: boolean;
  restorePassengerDefaultLabel: (passengerId: string) => void;
  saveCurrentResult: () => Promise<void>;
  serviceSelections: Record<string, number>;
  serviceViewEnabled: boolean;
  startOver: () => void;
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
  disableServiceView,
  distribution,
  enableServiceView,
  errorMessage,
  getPassengerDisplayName,
  hasAssignedPublisherProfile,
  hasActiveSession,
  goHome,
  goToHistory,
  goToInfo,
  goToPublishers,
  goToOptions,
  isLoading,
  incrementServiceSelection,
  movePassengerToVehicle,
  preferences,
  publisherCount,
  publisherProfiles,
  recalculateDistribution,
  rerunPromptVisible,
  restorePassengerDefaultLabel,
  saveCurrentResult,
  serviceSelections,
  serviceViewEnabled,
  startOver,
  updatePublisherCount,
  updateVehicleCount,
  updateVehicleCapacity,
  updateVehicleLabel,
  vehicleCount,
  vehicles,
}: ResultsScreenProps) {
  const [activeCountPicker, setActiveCountPicker] = useState<ActiveCountPicker>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropWarning, setDropWarning] = useState('');
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [editingVehicleLabel, setEditingVehicleLabel] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [publisherNameInput, setPublisherNameInput] = useState('');
  const [recalculatePulse] = useState(() => new RNAnimated.Value(1));
  const [serviceBannerPulse] = useState(() => new RNAnimated.Value(1));
  const [selectedPassengerId, setSelectedPassengerId] = useState<string | null>(null);
  const [summaryExpanded, setSummaryExpanded] = useState(
    preferences.summaryStartsExpanded,
  );
  const dropWarningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressChipPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [suppressChipPress, setSuppressChipPress] = useState(false);
  const vehicleCardRefs = useRef<Record<string, View | null>>({});
  const vehicleDropZonesRef = useRef<VehicleDropZone[]>([]);
  const dragOpacity = useSharedValue(0);
  const dragOriginX = useSharedValue(0);
  const dragOriginY = useSharedValue(0);
  const dragScale = useSharedValue(0.96);
  const dragTone = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const activeCountOptions =
    activeCountPicker === 'publishers' ? publisherCountOptions : vehicleCountOptions;
  const activeCount = activeCountPicker === 'publishers' ? publisherCount : vehicleCount;
  const recalculateIconColor =
    rerunPromptVisible && !serviceViewEnabled ? colors.mint : colors.textSubtle;
  const visibleVehicles = preferences.showUnusedVehicles
    ? vehicles
    : vehicles.filter((vehicle) => {
        const assignment = distribution?.assignments.find(
          (vehicleAssignment) => vehicleAssignment.vehicleId === vehicle.id,
        );

        return (assignment?.passengerIds.length ?? 0) > 0;
      });

  const draggedSeatOverlayStyle = useAnimatedStyle(() => ({
    opacity: dragOpacity.value,
    transform: [
      { translateX: dragX.value - 58 },
      { translateY: dragY.value - 22 },
      { scale: dragScale.value },
    ],
  }));
  const draggedSeatStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      dragTone.value,
      [-1, 0, 1],
      [colors.dangerText, colors.purple, colors.mint],
    ),
  }));

  useEffect(() => {
    if (!rerunPromptVisible) {
      recalculatePulse.stopAnimation();
      recalculatePulse.setValue(1);
      return;
    }

    const pulseAnimation = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(recalculatePulse, {
          toValue: 1.04,
          duration: 700,
          useNativeDriver: true,
        }),
        RNAnimated.timing(recalculatePulse, {
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

  useEffect(() => {
    if (!serviceViewEnabled) {
      serviceBannerPulse.stopAnimation();
      serviceBannerPulse.setValue(1);
      return;
    }

    const pulseAnimation = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(serviceBannerPulse, {
          toValue: 1.025,
          duration: 800,
          useNativeDriver: true,
        }),
        RNAnimated.timing(serviceBannerPulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
      serviceBannerPulse.setValue(1);
    };
  }, [serviceBannerPulse, serviceViewEnabled]);

  useEffect(
    () => () => {
      if (dropWarningTimeoutRef.current) {
        clearTimeout(dropWarningTimeoutRef.current);
      }

      if (suppressChipPressTimeoutRef.current) {
        clearTimeout(suppressChipPressTimeoutRef.current);
      }
    },
    [],
  );

  const closeCountPicker = () => {
    setActiveCountPicker(null);
  };

  const toggleServiceView = () => {
    setActiveCountPicker(null);
    setEditingVehicleId(null);
    setMenuOpen(false);

    if (serviceViewEnabled) {
      disableServiceView();
      return;
    }

    void enableServiceView();
  };

  const showDropWarning = useCallback((message: string) => {
    if (dropWarningTimeoutRef.current) {
      clearTimeout(dropWarningTimeoutRef.current);
    }

    setDropWarning(message);
    dropWarningTimeoutRef.current = setTimeout(() => {
      setDropWarning('');
      dropWarningTimeoutRef.current = null;
    }, 1800);
  }, []);

  const findDropZone = useCallback((x: number, y: number) => {
    return (
      vehicleDropZonesRef.current.find(
        (zone) =>
          x >= zone.x &&
          x <= zone.x + zone.width &&
          y >= zone.y &&
          y <= zone.y + zone.height,
      ) ?? null
    );
  }, []);

  const measureVehicleDropZones = useCallback(() => {
    const zones: VehicleDropZone[] = [];
    vehicleDropZonesRef.current = [];

    for (const vehicle of visibleVehicles) {
      const vehicleCard = vehicleCardRefs.current[vehicle.id];
      const assignment = distribution?.assignments.find(
        (vehicleAssignment) => vehicleAssignment.vehicleId === vehicle.id,
      );
      const passengerCount = assignment?.passengerIds.length ?? 0;

      vehicleCard?.measureInWindow((x, y, width, height) => {
        zones.push({
          canAccept: passengerCount < vehicle.capacity,
          height,
          vehicleId: vehicle.id,
          width,
          x,
          y,
        });
        vehicleDropZonesRef.current = zones;
      });
    }
  }, [distribution?.assignments, visibleVehicles]);

  const handleDragStart = useCallback(
    (
      passengerId: string,
      sourceVehicleId: string,
      label: string,
      x: number,
      y: number,
    ) => {
      setActiveCountPicker(null);
      setMenuOpen(false);
      setDropWarning('');
      setSuppressChipPress(true);
      measureVehicleDropZones();
      timeSharedValue(dragOpacity, 1, 90);
      springSharedValue(dragScale, 1.06);
      timeSharedValue(dragTone, 0, 120);
      setSharedValue(dragOriginX, x);
      setSharedValue(dragOriginY, y);
      setSharedValue(dragX, x);
      setSharedValue(dragY, y);
      setDragState({
        canDrop: false,
        label,
        passengerId,
        sourceVehicleId,
        targetVehicleId: null,
      });
    },
    [
      dragOpacity,
      dragOriginX,
      dragOriginY,
      dragScale,
      dragTone,
      dragX,
      dragY,
      measureVehicleDropZones,
    ],
  );

  const handleDragMove = useCallback(
    (x: number, y: number) => {
      setDragState((currentDragState) => {
        if (!currentDragState) {
          return currentDragState;
        }

        const dropZone = findDropZone(x, y);
        const isSameVehicle = dropZone?.vehicleId === currentDragState.sourceVehicleId;
        const canDrop = Boolean(dropZone && dropZone.canAccept && !isSameVehicle);
        const targetVehicleId = dropZone?.vehicleId ?? null;

        timeSharedValue(dragTone, canDrop ? 1 : targetVehicleId ? -1 : 0, 120);

        if (
          currentDragState.canDrop === canDrop &&
          currentDragState.targetVehicleId === targetVehicleId
        ) {
          return currentDragState;
        }

        return {
          ...currentDragState,
          canDrop,
          targetVehicleId,
        };
      });
    },
    [dragTone, findDropZone],
  );

  const handleDragEnd = useCallback(
    (passengerId: string, sourceVehicleId: string, x: number, y: number) => {
      const dropZone = findDropZone(x, y);
      const clearDragState = () => setDragState(null);

      const finishInvalidDrop = (message?: string) => {
        springSharedValue(dragX, dragOriginX.value);
        springSharedValue(dragY, dragOriginY.value);
        springSharedValue(dragScale, 0.98);
        timeSharedValue(dragTone, 0, 120);
        timeSharedValueWithCompletion(dragOpacity, 0, 180, () => {
          clearDragState();

          if (message) {
            showDropWarning(message);
          }
        });
      };

      if (!dropZone) {
        finishInvalidDrop('Drop on a vehicle with open seats.');
        return;
      }

      if (dropZone.vehicleId === sourceVehicleId) {
        finishInvalidDrop();
        return;
      }

      if (!dropZone.canAccept) {
        finishInvalidDrop('Vehicle is full.');
        return;
      }

      springSharedValue(dragX, dropZone.x + dropZone.width / 2);
      springSharedValue(
        dragY,
        dropZone.y + Math.min(dropZone.height / 2, 96),
      );
      springSharedValue(dragScale, 1.02);
      timeSharedValue(dragTone, 0, 120);
      timeSharedValueWithCompletion(dragOpacity, 0, 170, () => {
        movePassengerToVehicle(passengerId, dropZone.vehicleId);
        clearDragState();
      });
    },
    [
      dragOpacity,
      dragOriginX,
      dragOriginY,
      dragScale,
      dragTone,
      dragX,
      dragY,
      findDropZone,
      movePassengerToVehicle,
      showDropWarning,
    ],
  );

  const handleDragFinalize = useCallback(() => {
    setSuppressChipPress(true);

    if (suppressChipPressTimeoutRef.current) {
      clearTimeout(suppressChipPressTimeoutRef.current);
    }

    suppressChipPressTimeoutRef.current = setTimeout(() => {
      setSuppressChipPress(false);
      suppressChipPressTimeoutRef.current = null;
    }, 350);
  }, []);

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
    if (serviceViewEnabled || suppressChipPress) {
      return;
    }

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
          onSelectHome={goHome}
          onSelectHistory={goToHistory}
          onSelectInfo={goToInfo}
          onSelectPublishers={goToPublishers}
          onSelectOptions={goToOptions}
        />
      )}
      {!menuOpen && <DrawerEdgeSwipeArea onOpen={() => setMenuOpen(true)} />}
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
          scrollEnabled={!dragState}
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

              {serviceViewEnabled ? (
                <RNAnimated.View
                  style={[
                    styles.serviceActiveBanner,
                    { transform: [{ scale: serviceBannerPulse }] },
                  ]}>
                  <Text style={styles.serviceActiveBannerTitle}>
                    Service View Active
                  </Text>
                  <Text style={styles.serviceActiveBannerMeta}>
                    {publisherCount} publishers · {vehicleCount} vehicles
                  </Text>
                </RNAnimated.View>
              ) : (
                <View style={styles.countControls}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={!hasActiveSession}
                    onPress={togglePublisherPicker}
                    style={({ pressed }) => [
                      styles.countButton,
                      !hasActiveSession && styles.countButtonDisabled,
                      activeCountPicker === 'publishers' && styles.countButtonActive,
                      pressed && styles.buttonPressed,
                    ]}>
                    <Text
                      style={[
                        styles.countButtonText,
                        !hasActiveSession && styles.countButtonTextDisabled,
                      ]}>
                      Publishers: {publisherCount}
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    disabled={!hasActiveSession}
                    onPress={toggleVehiclePicker}
                    style={({ pressed }) => [
                      styles.countButton,
                      !hasActiveSession && styles.countButtonDisabled,
                      activeCountPicker === 'vehicles' && styles.countButtonActive,
                      pressed && styles.buttonPressed,
                    ]}>
                    <Text
                      style={[
                        styles.countButtonText,
                        !hasActiveSession && styles.countButtonTextDisabled,
                      ]}>
                      Vehicles: {vehicleCount}
                    </Text>
                  </Pressable>
                </View>
              )}
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
              style={({ pressed }) => [
                styles.actionButton,
                styles.actionButtonWithIcon,
                pressed && styles.buttonPressed,
              ]}>
              <ListRestart color={colors.text} size={16} strokeWidth={2.5} />
              <Text style={styles.actionButtonText}>Start Over</Text>
            </Pressable>

            <RNAnimated.View style={{ transform: [{ scale: recalculatePulse }] }}>
              <Pressable
                accessibilityRole="button"
                disabled={!rerunPromptVisible || serviceViewEnabled}
                onPress={recalculateDistribution}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.actionButtonWithIcon,
                  rerunPromptVisible && !serviceViewEnabled
                    ? styles.recalculateButtonActive
                    : styles.recalculateButtonDisabled,
                  pressed && styles.buttonPressed,
                ]}>
                <RefreshCcw color={recalculateIconColor} size={16} strokeWidth={2.5} />
                <Text
                  style={[
                    styles.actionButtonText,
                    rerunPromptVisible &&
                      !serviceViewEnabled &&
                      styles.recalculateButtonTextActive,
                    (!rerunPromptVisible || serviceViewEnabled) &&
                      styles.recalculateButtonTextDisabled,
                  ]}>
                  Recalculate
                </Text>
              </Pressable>
            </RNAnimated.View>
          </View>

          {!!errorMessage && (
            <View style={styles.errorPanel}>
              <Text style={styles.errorTitle}>Not enough seats</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {!!dropWarning && (
            <View style={styles.dragWarningPanel}>
              <Text style={styles.dragWarningText}>{dropWarning}</Text>
            </View>
          )}

          {!hasActiveSession && (
            <View style={styles.emptyResultsPanel}>
              <Text style={styles.emptyResultsTitle}>No active distribution</Text>
              <Text style={styles.emptyResultsText}>
                This home screen is ready, but no publisher or vehicle counts have been
                selected yet. Use Start Over to begin a new distribution.
              </Text>
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
            {visibleVehicles.map((vehicle) => {
              const assignment = distribution?.assignments.find(
                (vehicleAssignment) => vehicleAssignment.vehicleId === vehicle.id,
              );
              const passengerIds = assignment?.passengerIds ?? [];
              const openSeatCount = Math.max(vehicle.capacity - passengerIds.length, 0);
              const isOverCapacity = passengerIds.length > vehicle.capacity;
              const overCapacityCount = Math.max(passengerIds.length - vehicle.capacity, 0);
              const isEditingVehicleLabel = editingVehicleId === vehicle.id;

              return (
                <AnimatedVehicleCard
                  canDrop={dragState?.canDrop ?? false}
                  isOverCapacity={isOverCapacity}
                  isDropTarget={dragState?.targetVehicleId === vehicle.id}
                  key={vehicle.id}
                  ref={(node) => {
                    vehicleCardRefs.current[vehicle.id] = node;
                  }}
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
                          disabled={serviceViewEnabled}
                          onPress={() => startEditingVehicleLabel(vehicle)}
                          style={({ pressed }) => [
                            styles.vehicleTitleButton,
                            pressed && styles.buttonPressed,
                          ]}>
                          <Text style={styles.vehicleTitle} numberOfLines={1}>
                            {vehicle.label}
                          </Text>
                          {!serviceViewEnabled && (
                            <Pencil color={colors.textMuted} size={16} strokeWidth={2.3} />
                          )}
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
                        disabled={serviceViewEnabled}
                        onPress={() => updateVehicleCapacity(vehicle.id, vehicle.capacity - 1)}
                        style={({ pressed }) => [
                          styles.stepperButton,
                          serviceViewEnabled && styles.stepperButtonDisabled,
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
                        disabled={serviceViewEnabled}
                        onPress={() => updateVehicleCapacity(vehicle.id, vehicle.capacity + 1)}
                        style={({ pressed }) => [
                          styles.stepperButton,
                          serviceViewEnabled && styles.stepperButtonDisabled,
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
                    {passengerIds.map((passengerId) => {
                      const passengerLabel = getPassengerDisplayName(passengerId);

                      return (
                        serviceViewEnabled ? (
                          <ServicePublisherChip
                            count={serviceSelections[passengerId] ?? 0}
                            isOverCapacity={isOverCapacity}
                            key={passengerId}
                            label={passengerLabel}
                            onPress={() => incrementServiceSelection(passengerId)}
                          />
                        ) : (
                          <DraggablePublisherChip
                            dragOpacity={dragOpacity}
                            dragScale={dragScale}
                            dragX={dragX}
                            dragY={dragY}
                            isDragging={dragState?.passengerId === passengerId}
                            isOverCapacity={isOverCapacity}
                            key={passengerId}
                            label={passengerLabel}
                            onDragEnd={handleDragEnd}
                            onDragFinalize={handleDragFinalize}
                            onDragMove={handleDragMove}
                            onDragStart={handleDragStart}
                            onPress={() => openPublisherEditor(passengerId)}
                            passengerId={passengerId}
                            vehicleId={vehicle.id}
                          />
                        )
                      );
                    })}

                    {Array.from({ length: openSeatCount }, (_, index) => (
                      <View key={`${vehicle.id}-open-${index}`} style={styles.openSeat}>
                        <Text style={styles.openSeatText}>Open</Text>
                      </View>
                    ))}

                    {passengerIds.length === 0 && openSeatCount === 0 && (
                      <Text style={styles.emptySeatText}>No seats available</Text>
                    )}
                  </View>
                </AnimatedVehicleCard>
              );
            })}
          </View>

          <View style={styles.storageFooter}>
            <View style={styles.resultsFooterActions}>
              {distribution && !preferences.autoSaveResults && !serviceViewEnabled && (
                <Pressable
                  accessibilityRole="button"
                  onPress={saveCurrentResult}
                  style={({ pressed }) => [
                    styles.saveResultButton,
                    pressed && styles.buttonPressed,
                  ]}>
                  <Save color={colors.mint} size={16} strokeWidth={2.5} />
                  <Text style={styles.saveResultButtonText}>Save</Text>
                </Pressable>
              )}

              <Pressable
                accessibilityRole="button"
                onPress={goToHistory}
                style={({ pressed }) => [
                  styles.historyFooterButton,
                  pressed && styles.buttonPressed,
                ]}>
                <History color={colors.mint} size={16} strokeWidth={2.5} />
                <Text style={styles.historyFooterButtonText}>History</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={!distribution}
                onPress={toggleServiceView}
                style={({ pressed }) => [
                  styles.serviceFooterButton,
                  styles.serviceFooterButtonWithIcon,
                  serviceViewEnabled && styles.serviceFooterButtonActive,
                  !distribution && styles.footerButtonDisabled,
                  pressed && styles.buttonPressed,
                ]}>
                <NotebookPen
                  color={
                    distribution
                      ? serviceViewEnabled
                        ? colors.text
                        : colors.mint
                      : colors.textSubtle
                  }
                  size={16}
                  strokeWidth={2.5}
                />
                <Text
                  style={[
                    styles.serviceFooterButtonText,
                    serviceViewEnabled && styles.serviceFooterButtonTextActive,
                    !distribution && styles.footerButtonTextDisabled,
                  ]}>
                  Service View
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {dragState && (
          <Reanimated.View
            pointerEvents="none"
            style={[styles.draggedSeatOverlay, draggedSeatOverlayStyle]}>
            <Reanimated.View
              style={[styles.occupiedSeat, styles.draggedSeat, draggedSeatStyle]}>
              <Text style={styles.occupiedSeatText}>{dragState.label}</Text>
            </Reanimated.View>
          </Reanimated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const AnimatedVehicleCard = forwardRef<
  View,
  {
    canDrop: boolean;
    children: ReactNode;
    isDropTarget: boolean;
    isOverCapacity: boolean;
    style: StyleProp<ViewStyle>;
  }
>(function AnimatedVehicleCard(
  { canDrop, children, isDropTarget, isOverCapacity, style },
  ref,
) {
  const highlightProgress = useSharedValue(0);
  const highlightTone = useSharedValue(0);

  useEffect(() => {
    highlightProgress.value = withTiming(isDropTarget ? 1 : 0, { duration: 140 });
    highlightTone.value = withTiming(isDropTarget ? (canDrop ? 1 : -1) : 0, {
      duration: 140,
    });
  }, [canDrop, highlightProgress, highlightTone, isDropTarget]);

  const animatedStyle = useAnimatedStyle(() => {
    const baseBackground = isOverCapacity
      ? colors.dangerBackground
      : colors.surfaceStrong;
    const baseBorder = isOverCapacity ? colors.dangerText : colors.border;

    return {
      backgroundColor: interpolateColor(
        highlightTone.value,
        [-1, 0, 1],
        [colors.dangerBackground, baseBackground, colors.surface],
      ),
      borderColor: interpolateColor(
        highlightTone.value,
        [-1, 0, 1],
        [colors.dangerText, baseBorder, colors.mint],
      ),
      borderLeftColor: interpolateColor(
        highlightTone.value,
        [-1, 0, 1],
        [colors.dangerText, baseBorder, colors.mint],
      ),
      transform: [{ scale: 1 + highlightProgress.value * 0.01 }],
    };
  });

  return (
    <Reanimated.View ref={ref} style={[style, animatedStyle]}>
      {children}
    </Reanimated.View>
  );
});

function DraggablePublisherChip({
  dragOpacity,
  dragScale,
  dragX,
  dragY,
  isDragging,
  isOverCapacity,
  label,
  onDragEnd,
  onDragFinalize,
  onDragMove,
  onDragStart,
  onPress,
  passengerId,
  vehicleId,
}: {
  dragOpacity: SharedValue<number>;
  dragScale: SharedValue<number>;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  isDragging: boolean;
  isOverCapacity: boolean;
  label: string;
  onDragEnd: (passengerId: string, sourceVehicleId: string, x: number, y: number) => void;
  onDragFinalize: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragStart: (
    passengerId: string,
    sourceVehicleId: string,
    label: string,
    x: number,
    y: number,
  ) => void;
  onPress: () => void;
  passengerId: string;
  vehicleId: string;
}) {
  const dragGesture = Gesture.Pan()
    .activateAfterLongPress(240)
    .onStart((event) => {
      setSharedValue(dragX, event.absoluteX);
      setSharedValue(dragY, event.absoluteY);
      timeSharedValue(dragOpacity, 1, 90);
      springSharedValue(dragScale, 1.06);
      runOnJS(onDragStart)(
        passengerId,
        vehicleId,
        label,
        event.absoluteX,
        event.absoluteY,
      );
    })
    .onUpdate((event) => {
      setSharedValue(dragX, event.absoluteX);
      setSharedValue(dragY, event.absoluteY);
      runOnJS(onDragMove)(event.absoluteX, event.absoluteY);
    })
    .onEnd((event) => {
      runOnJS(onDragEnd)(passengerId, vehicleId, event.absoluteX, event.absoluteY);
    })
    .onFinalize(() => {
      runOnJS(onDragFinalize)();
    });

  return (
    <GestureDetector gesture={dragGesture}>
      <Pressable
        accessibilityLabel={`Edit ${label}`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.occupiedSeat,
          isOverCapacity && styles.occupiedSeatWarning,
          isDragging && styles.occupiedSeatDragging,
          pressed && styles.buttonPressed,
        ]}>
        <Text
          style={[
            styles.occupiedSeatText,
            isOverCapacity && styles.occupiedSeatTextWarning,
          ]}>
          {label}
        </Text>
      </Pressable>
    </GestureDetector>
  );
}

function ServicePublisherChip({
  count,
  isOverCapacity,
  label,
  onPress,
}: {
  count: number;
  isOverCapacity: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`Mark ${label} selected`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.occupiedSeat,
        styles.serviceSeat,
        isOverCapacity && styles.occupiedSeatWarning,
        pressed && styles.buttonPressed,
      ]}>
      <Text
        style={[
          styles.occupiedSeatText,
          isOverCapacity && styles.occupiedSeatTextWarning,
        ]}>
        {label}
      </Text>
      {count > 0 && (
        <View style={styles.serviceTicker}>
          <Text style={styles.serviceTickerText}>{count}</Text>
        </View>
      )}
    </Pressable>
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
