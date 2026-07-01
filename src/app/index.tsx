import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii } from '@/styles/theme';

export default function StartScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Image
          accessibilityLabel="Field Service Assistant logo"
          source={require('../assets/field_service_assistant_logo_2.png')}
          style={styles.logo}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/select')}
          style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}>
          <Text style={styles.startButtonText}>Start</Text>
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
