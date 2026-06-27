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
    borderRadius: radii.medium,
    backgroundColor: colors.surfaceStrong,
    padding: 18,
  },
  cardSuccess: {
    borderColor: colors.mint,
  },
  cardError: {
    borderColor: colors.dangerText,
    backgroundColor: colors.dangerBackground,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  titleSuccess: {
    color: colors.mint,
  },
  titleError: {
    color: colors.dangerText,
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  button: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderRadius: radii.small,
    paddingHorizontal: 18,
  },
  buttonSuccess: {
    borderColor: colors.mint,
    backgroundColor: colors.mint,
  },
  buttonError: {
    borderColor: colors.dangerText,
    backgroundColor: colors.surfaceStrong,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  buttonTextSuccess: {
    color: colors.background,
  },
  buttonTextError: {
    color: colors.dangerText,
  },
  buttonPressed: {
    opacity: 0.82,
  },
});
