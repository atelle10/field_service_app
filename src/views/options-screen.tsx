import { useState } from 'react';
import { Info, Menu, Minus, Plus } from 'lucide-react-native';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  DEFAULT_APP_PREFERENCES,
  DistributionStrategy,
  type AppPreferences,
} from '@/models/group-assignment';
import { colors } from '@/styles/theme';
import { AppMenuDrawer, DrawerEdgeSwipeArea } from '@/views/app-menu-drawer';
import { styles } from '@/views/options-screen.styles';

type InfoKey = 'capacity' | 'strategy' | null;

type OptionsScreenProps = {
  clearPersistentCache: () => Promise<void>;
  goHome: () => void;
  goToHistory: () => void;
  goToInfo: () => void;
  goToOptions: () => void;
  goToPublishers: () => void;
  preferences: AppPreferences;
  storageUsageBytes: number;
  updatePreference: <Key extends keyof AppPreferences>(
    key: Key,
    value: AppPreferences[Key],
  ) => void;
};

export function OptionsScreen({
  clearPersistentCache,
  goHome,
  goToHistory,
  goToInfo,
  goToOptions,
  goToPublishers,
  preferences,
  storageUsageBytes,
  updatePreference,
}: OptionsScreenProps) {
  const [expandedInfo, setExpandedInfo] = useState<InfoKey>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleInfo = (key: Exclude<InfoKey, null>) => {
    setExpandedInfo((currentValue) => (currentValue === key ? null : key));
  };

  const updateDefaultCapacity = (nextCapacity: number) => {
    updatePreference('defaultVehicleCapacity', Math.max(1, nextCapacity));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {menuOpen && (
        <AppMenuDrawer
          onClose={() => setMenuOpen(false)}
          onSelectHome={goHome}
          onSelectHistory={goToHistory}
          onSelectInfo={goToInfo}
          onSelectOptions={goToOptions}
          onSelectPublishers={goToPublishers}
        />
      )}
      {!menuOpen && <DrawerEdgeSwipeArea onOpen={() => setMenuOpen(true)} />}

      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable
              accessibilityLabel={menuOpen ? 'Close menu' : 'Open menu'}
              accessibilityRole="button"
              onPress={() => setMenuOpen((currentValue) => !currentValue)}
              style={({ pressed }) => [styles.menuButton, pressed && styles.buttonPressed]}>
              <Menu color={colors.text} size={22} strokeWidth={2.5} />
            </Pressable>

            <View style={styles.titlePanel}>
              <Text style={styles.title}>Options</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.optionHeader}>
              <Text style={styles.optionTitle}>Default Seat Capacity</Text>
              <Pressable
                accessibilityLabel="Default seat capacity details"
                accessibilityRole="button"
                onPress={() => toggleInfo('capacity')}
                style={({ pressed }) => [
                  styles.infoButton,
                  pressed && styles.buttonPressed,
                ]}>
                <Info color={colors.mint} size={16} strokeWidth={2.4} />
              </Pressable>
            </View>

            {expandedInfo === 'capacity' && (
              <Text style={styles.infoText}>
                Default is {DEFAULT_APP_PREFERENCES.defaultVehicleCapacity}. Applies to
                newly created vehicles.
              </Text>
            )}

            <View style={styles.capacityControl}>
              <Pressable
                accessibilityLabel="Decrease default seat capacity"
                accessibilityRole="button"
                onPress={() => updateDefaultCapacity(preferences.defaultVehicleCapacity - 1)}
                style={({ pressed }) => [
                  styles.stepperButton,
                  pressed && styles.buttonPressed,
                ]}>
                <Minus color={colors.mint} size={18} strokeWidth={2.8} />
              </Pressable>
              <Text style={styles.capacityValue}>
                {preferences.defaultVehicleCapacity}
              </Text>
              <Pressable
                accessibilityLabel="Increase default seat capacity"
                accessibilityRole="button"
                onPress={() => updateDefaultCapacity(preferences.defaultVehicleCapacity + 1)}
                style={({ pressed }) => [
                  styles.stepperButton,
                  pressed && styles.buttonPressed,
                ]}>
                <Plus color={colors.mint} size={18} strokeWidth={2.8} />
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.optionHeader}>
              <Text style={styles.optionTitle}>Distribution Algorithm</Text>
              <Pressable
                accessibilityLabel="Distribution algorithm details"
                accessibilityRole="button"
                onPress={() => toggleInfo('strategy')}
                style={({ pressed }) => [
                  styles.infoButton,
                  pressed && styles.buttonPressed,
                ]}>
                <Info color={colors.mint} size={16} strokeWidth={2.4} />
              </Pressable>
            </View>

            {expandedInfo === 'strategy' && (
              <View style={styles.infoBlock}>
                <Text style={styles.infoText}>
                  Minimize Vehicles uses the fewest vehicles possible.
                </Text>
                <Text style={styles.infoText}>
                  Maximize Comfort spreads publishers across available vehicles more
                  evenly.
                </Text>
              </View>
            )}

            <View style={styles.segmentedControl}>
              <StrategyButton
                active={
                  preferences.distributionStrategy === DistributionStrategy.MinimizeCars
                }
                label="Minimize Vehicles"
                onPress={() =>
                  updatePreference(
                    'distributionStrategy',
                    DistributionStrategy.MinimizeCars,
                  )
                }
              />
              <StrategyButton
                active={
                  preferences.distributionStrategy === DistributionStrategy.MaximizeComfort
                }
                label="Maximize Comfort"
                onPress={() =>
                  updatePreference(
                    'distributionStrategy',
                    DistributionStrategy.MaximizeComfort,
                  )
                }
              />
            </View>

            <Text style={styles.applyNote}>
              Strategy changes mark current results for recalculation.
            </Text>
          </View>

          <View style={styles.section}>
            <PreferenceToggle
              label="Auto-save Results"
              onValueChange={(value) => updatePreference('autoSaveResults', value)}
              value={preferences.autoSaveResults}
            />
            <PreferenceToggle
              label="Show Unused Vehicles"
              onValueChange={(value) => updatePreference('showUnusedVehicles', value)}
              value={preferences.showUnusedVehicles}
            />
            <PreferenceToggle
              label="Summary Starts Expanded"
              onValueChange={(value) => updatePreference('summaryStartsExpanded', value)}
              value={preferences.summaryStartsExpanded}
            />
            <PreferenceToggle
              label="Sort Publishers Alphabetically"
              onValueChange={(value) =>
                updatePreference('sortPublishersAlphabetically', value)
              }
              value={preferences.sortPublishersAlphabetically}
            />
            <PreferenceToggle
              label="Confirm Delete Actions"
              onValueChange={(value) =>
                updatePreference('confirmDestructiveActions', value)
              }
              value={preferences.confirmDestructiveActions}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.storageHeader}>
              <View style={styles.storageTextPanel}>
                <Text style={styles.optionTitle}>Stored Data</Text>
                <Text style={styles.storageUsageText}>
                  {formatStorageUsage(storageUsageBytes)}
                </Text>
              </View>

              <Pressable
                accessibilityLabel="Clear cached app data"
                accessibilityRole="button"
                onPress={clearPersistentCache}
                style={({ pressed }) => [
                  styles.clearCacheButton,
                  pressed && styles.buttonPressed,
                ]}>
                <Text style={styles.clearCacheButtonText}>Clear Cache</Text>
              </Pressable>
            </View>

            <Text style={styles.applyNote}>
              Removes saved publishers, saved results, and preferences from this device.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function StrategyButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.strategyButton,
        active && styles.strategyButtonActive,
        pressed && styles.buttonPressed,
      ]}>
      <Text
        style={[
          styles.strategyButtonText,
          active && styles.strategyButtonTextActive,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function PreferenceToggle({
  label,
  onValueChange,
  value,
}: {
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        ios_backgroundColor={colors.border}
        onValueChange={onValueChange}
        thumbColor={value ? colors.mint : colors.textMuted}
        trackColor={{ false: colors.border, true: colors.deepForest }}
        value={value}
      />
    </View>
  );
}

function formatStorageUsage(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}
