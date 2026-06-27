import { useEffect, useState } from 'react';
import { House, Info, SlidersHorizontal, StepBack, UsersRound } from 'lucide-react-native';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radii } from '@/styles/theme';

const menuOptions = [
  { Icon: UsersRound, label: 'Publishers' },
  { Icon: SlidersHorizontal, label: 'Options' },
  { Icon: Info, label: 'Info' },
] as const;
const headerHeight = 44;
const headerTopPadding = 28;
const menuTextSize = 13;

type AppMenuDrawerProps = {
  onClose: () => void;
  onClearCache: () => void | Promise<void>;
  onSelectHome: () => void;
  onSelectPublishers: () => void;
  onSelectOption: () => void;
  storageUsageBytes: number;
};

export function AppMenuDrawer({
  onClearCache,
  onClose,
  onSelectHome,
  onSelectPublishers,
  onSelectOption,
  storageUsageBytes,
}: AppMenuDrawerProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [translateProgress] = useState(() => new Animated.Value(-1));

  useEffect(() => {
    Animated.timing(translateProgress, {
      toValue: 0,
      duration: 190,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [translateProgress]);

  const closeDrawer = (afterClose?: () => void) => {
    Animated.timing(translateProgress, {
      toValue: -1,
      duration: 170,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      onClose();
      afterClose?.();
    });
  };

  const translateX = translateProgress.interpolate({
    inputRange: [-1, 0],
    outputRange: [-width, 0],
  });

  return (
    <Animated.View
      style={[
        styles.drawer,
        {
          paddingTop: insets.top + headerTopPadding,
          transform: [{ translateX }],
        },
      ]}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>

        <Pressable
          accessibilityLabel="Close menu"
          accessibilityRole="button"
          onPress={() => closeDrawer()}
          style={({ pressed }) => [styles.closeButton, pressed && styles.buttonPressed]}>
          <StepBack color={colors.text} size={16} strokeWidth={2.4} />
        </Pressable>
      </View>

      <View style={styles.optionList}>
        <Pressable
          accessibilityRole="button"
          onPress={() => closeDrawer(onSelectHome)}
          style={({ pressed }) => [styles.option, pressed && styles.buttonPressed]}>
          <House color={colors.text} size={16} strokeWidth={2.2} />
          <Text style={styles.optionText}>Home</Text>
        </Pressable>

        {menuOptions.map(({ Icon, label }) => (
          <Pressable
            accessibilityRole="button"
            key={label}
            onPress={() =>
              closeDrawer(label === 'Publishers' ? onSelectPublishers : onSelectOption)
            }
            style={({ pressed }) => [styles.option, pressed && styles.buttonPressed]}>
            <Icon color={colors.text} size={16} strokeWidth={2.2} />
            <Text style={styles.optionText}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.drawerFooter, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.drawerFooterRow}>
          <Text style={styles.storageUsageText}>
            Stored data: {formatStorageUsage(storageUsageBytes)}
          </Text>

          <Pressable
            accessibilityLabel="Clear cached app data"
            accessibilityRole="button"
            onPress={() => closeDrawer(onClearCache)}
            style={({ pressed }) => [
              styles.clearCacheButton,
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.clearCacheButtonText}>Clear Cache</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    zIndex: 20,
  },
  header: {
    minHeight: headerHeight,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    color: colors.text,
    fontSize: menuTextSize,
    fontWeight: '700',
  },
  closeButton: {
    width: headerHeight,
    height: headerHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.small,
    backgroundColor: colors.surface,
  },
  optionList: {
    gap: 12,
  },
  option: {
    minHeight: 44,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.small,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
  },
  optionText: {
    color: colors.text,
    fontSize: menuTextSize,
    fontWeight: '700',
  },
  drawerFooter: {
    marginTop: 'auto',
  },
  drawerFooterRow: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearCacheButton: {
    position: 'absolute',
    right: 0,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.dangerText,
    borderRadius: radii.small,
    backgroundColor: colors.dangerBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearCacheButtonText: {
    color: colors.dangerText,
    fontSize: 12,
    fontWeight: '700',
  },
  storageUsageText: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.82,
  },
});

function formatStorageUsage(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
}
