import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGroupSession } from '@/context/group-session-context';
import { translate } from '@/i18n';
import { colors, radii } from '@/styles/theme';

export default function StartScreen() {
  const {
    completeStartScreen,
    hasActiveSession,
    hasHydratedPersistedData,
    hasSelectedLanguage,
    hasSeenStartScreen,
    preferences,
  } = useGroupSession();

  useEffect(() => {
    if (!hasHydratedPersistedData || !hasSeenStartScreen) {
      return;
    }

    if (!hasSelectedLanguage) {
      router.replace('/language');
      return;
    }

    router.replace(hasActiveSession ? '/results' : '/select');
  }, [
    hasActiveSession,
    hasHydratedPersistedData,
    hasSelectedLanguage,
    hasSeenStartScreen,
  ]);

  const startSetup = () => {
    completeStartScreen();
    router.replace('/language');
  };

  if (!hasHydratedPersistedData || hasSeenStartScreen) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Image
          accessibilityLabel={translate(preferences.language, 'appLogo')}
          source={require('../assets/service_group_planner_2.png')}
          style={styles.logo}
        />
        <Pressable
          accessibilityRole="button"
          onPress={startSetup}
          style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}>
          <Text style={styles.startButtonText}>
            {translate(preferences.language, 'start')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 32,
  },
  logo: {
    width: 280,
    height: 280,
    resizeMode: 'contain',
  },
  startButton: {
    minWidth: 160,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.small,
    backgroundColor: colors.mint,
    paddingHorizontal: 24,
  },
  startButtonPressed: {
    opacity: 0.82,
  },
  startButtonText: {
    color: colors.background,
    fontSize: 17,
    fontWeight: '700',
  },
});
