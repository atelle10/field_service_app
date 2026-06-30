import { StyleSheet } from 'react-native';

import { colors, radii } from '@/styles/theme';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 17, 23, 0.78)',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.dangerText,
    borderRadius: radii.medium,
    backgroundColor: colors.dangerBackground,
    padding: 18,
  },
  title: {
    color: colors.dangerText,
    fontSize: 18,
    fontWeight: '700',
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  button: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radii.small,
    paddingHorizontal: 16,
  },
  cancelButton: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
  },
  confirmButton: {
    borderColor: colors.dangerText,
    backgroundColor: colors.surfaceStrong,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  confirmButtonText: {
    color: colors.dangerText,
    fontSize: 14,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.82,
  },
});
