import { Picker } from '@react-native-picker/picker';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii } from '@/styles/theme';

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
  return (
    <SafeAreaView style={styles.safeArea}>
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
    backgroundColor: colors.background,
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
    color: colors.text,
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
    borderRadius: radii.large,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
  },
  picker: {
    width: '100%',
    height: 190,
  },
  pickerItem: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '600',
  },
  confirmButton: {
    minWidth: 180,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.small,
    backgroundColor: colors.mint,
    paddingHorizontal: 24,
  },
  confirmButtonText: {
    color: colors.background,
    fontSize: 17,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.82,
  },
});
