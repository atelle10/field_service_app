import { useEffect, useState } from 'react';
import { Info, SlidersHorizontal, StepBack, UsersRound } from 'lucide-react-native';
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
  onSelectOption: () => void;
};

export function AppMenuDrawer({ onClose, onSelectOption }: AppMenuDrawerProps) {
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
        {menuOptions.map(({ Icon, label }) => (
          <Pressable
            accessibilityRole="button"
            key={label}
            onPress={() => closeDrawer(onSelectOption)}
            style={({ pressed }) => [styles.option, pressed && styles.buttonPressed]}>
            <Icon color={colors.text} size={16} strokeWidth={2.2} />
            <Text style={styles.optionText}>{label}</Text>
          </Pressable>
        ))}
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
  buttonPressed: {
    opacity: 0.82,
  },
});
