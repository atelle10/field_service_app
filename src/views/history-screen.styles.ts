import { StyleSheet } from 'react-native';

import { colors, radii } from '@/styles/theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 28,
    gap: 18,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.small,
    backgroundColor: colors.surface,
  },
  titlePanel: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.small,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    backgroundColor: colors.surfaceStrong,
    padding: 12,
  },
  historyCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  historyCardTitleButton: {
    minHeight: 40,
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  historyCardTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  historyCardToggle: {
    color: colors.mint,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 22,
  },
  historyDeleteButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.dangerText,
    borderRadius: radii.small,
    backgroundColor: colors.dangerBackground,
  },
  historyCardBody: {
    gap: 12,
  },
  historySummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  historySummaryText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  historyVehicleList: {
    gap: 8,
  },
  historyVehicleRow: {
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.small,
    backgroundColor: colors.surface,
    padding: 10,
  },
  historyVehicleHeader: {
    alignItems: 'flex-start',
    gap: 4,
  },
  historyVehicleName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  historyVehicleSeats: {
    color: colors.mint,
    fontSize: 12,
    fontWeight: '700',
  },
  historyVehiclePublishers: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  historyRestoreButton: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: colors.mint,
    borderRadius: radii.small,
    backgroundColor: colors.mint,
    paddingHorizontal: 16,
  },
  historyRestoreButtonText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyPanel: {
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    backgroundColor: colors.surface,
    padding: 18,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  footerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  footerButton: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: radii.small,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  clearAllButton: {
    borderColor: colors.dangerText,
    backgroundColor: colors.dangerBackground,
  },
  clearAllButtonText: {
    color: colors.dangerText,
    fontSize: 13,
    fontWeight: '700',
  },
  disabledButton: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  disabledButtonText: {
    color: colors.textSubtle,
  },
  buttonPressed: {
    opacity: 0.82,
  },
});
