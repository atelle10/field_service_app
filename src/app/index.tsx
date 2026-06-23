import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii } from '@/styles/theme';

export default function StartScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>Field Service Assistant</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/select')}
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
  title: {
    textAlign: 'center',
    color: colors.text,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
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
