import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type CountPickerScreenProps = {
  prompt: string;
  selectedCount: number;
  counts: number[];
  onCountChange: (count: number) => void;
  onConfirm: () => void;
};

export function CountPickerScreen({
  prompt,
  selectedCount,
  counts,
  onCountChange,
  onConfirm,
}: CountPickerScreenProps) {
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Pressable
        accessibilityRole="button"
        onPress={goBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}>
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.prompt}>{prompt}</Text>

        <View style={styles.pickerFrame}>
          <Picker
            selectedValue={selectedCount}
            onValueChange={(value) => onCountChange(value)}
            itemStyle={styles.pickerItem}
            style={styles.picker}>
            {counts.map((count) => (
              <Picker.Item key={count} label={String(count)} value={count} />
            ))}
          </Picker>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onConfirm}
          style={({ pressed }) => [styles.confirmButton, pressed && styles.buttonPressed]}>
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  backButton: {
    position: 'absolute',
    top: 64,
    left: 24,
    zIndex: 1,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#1D4ED8',
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 28,
  },
  prompt: {
    maxWidth: 340,
    color: '#111827',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    textAlign: 'center',
  },
  pickerFrame: {
    width: '100%',
    maxWidth: 280,
    height: 190,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
    height: 190,
  },
  pickerItem: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '600',
  },
  confirmButton: {
    minWidth: 180,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 24,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.82,
  },
});
