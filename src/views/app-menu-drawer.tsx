import { useEffect, useState } from 'react';
import {
  History,
  House,
  Info,
  SlidersHorizontal,
  StepBack,
  UsersRound,
} from 'lucide-react-native';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGroupSession } from '@/context/group-session-context';
import { translate } from '@/i18n';
import { colors, radii } from '@/styles/theme';

const menuOptions = [
  { Icon: UsersRound, key: 'publishers' },
  { Icon: History, key: 'history' },
  { Icon: SlidersHorizontal, key: 'options' },
  { Icon: Info, key: 'info' },
] as const;
const headerHeight = 44;
const headerTopPadding = 28;
const menuTextSize = 13;
const edgeSwipeWidth = 32;
const edgeSwipeThreshold = 42;
const verticalDriftLimit = 70;

type DrawerEdgeSwipeAreaProps = {
  onOpen: () => void;
};

export function DrawerEdgeSwipeArea({ onOpen }: DrawerEdgeSwipeAreaProps) {
  const openGesture = Gesture.Pan()
    .activeOffsetX([12, 999])
    .failOffsetY([-verticalDriftLimit, verticalDriftLimit])
    .onEnd((event) => {
      if (event.translationX > edgeSwipeThreshold) {
        runOnJS(onOpen)();
      }
    });

  return (
    <GestureDetector gesture={openGesture}>
      <View pointerEvents="box-only" style={styles.leftEdgeSwipeArea} />
    </GestureDetector>
  );
}

type AppMenuDrawerProps = {
  onClose: () => void;
  onSelectHome: () => void;
  onSelectHistory: () => void;
  onSelectInfo: () => void;
  onSelectPublishers: () => void;
  onSelectOptions: () => void;
};

export function AppMenuDrawer({
  onClose,
  onSelectHome,
  onSelectHistory,
  onSelectInfo,
  onSelectPublishers,
  onSelectOptions,
}: AppMenuDrawerProps) {
  const { preferences } = useGroupSession();
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
  const closeGesture = Gesture.Pan()
    .activeOffsetX([-999, -12])
    .failOffsetY([-verticalDriftLimit, verticalDriftLimit])
    .onEnd((event) => {
      if (event.translationX < -edgeSwipeThreshold) {
        runOnJS(closeDrawer)();
      }
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
        <Text style={styles.title}>{translate(preferences.language, 'menu')}</Text>

        <Pressable
          accessibilityLabel={translate(preferences.language, 'closeMenu')}
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
          <Text style={styles.optionText}>{translate(preferences.language, 'home')}</Text>
        </Pressable>

        {menuOptions.map(({ Icon, key }) => {
          const onSelect =
            key === 'publishers'
              ? onSelectPublishers
              : key === 'history'
                ? onSelectHistory
              : key === 'options'
                ? onSelectOptions
              : key === 'info'
                ? onSelectInfo
                : undefined;

          return (
            <Pressable
              accessibilityRole="button"
              key={key}
              onPress={() => closeDrawer(onSelect)}
              style={({ pressed }) => [styles.option, pressed && styles.buttonPressed]}>
              <Icon color={colors.text} size={16} strokeWidth={2.2} />
              <Text style={styles.optionText}>
                {translate(preferences.language, key)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <GestureDetector gesture={closeGesture}>
        <View pointerEvents="box-only" style={styles.rightEdgeSwipeArea} />
      </GestureDetector>
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
  leftEdgeSwipeArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: edgeSwipeWidth,
    zIndex: 10,
  },
  rightEdgeSwipeArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: edgeSwipeWidth,
    zIndex: 21,
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
