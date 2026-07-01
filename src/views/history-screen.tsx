import { useState } from 'react';
import { Menu, X } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ResultsHistoryEntry } from '@/services/group-session-service';
import {
  formatPublishersCount,
  formatSeatLabel,
  formatVehiclesCount,
  type LanguageCode,
  translate,
} from '@/i18n';
import { colors } from '@/styles/theme';
import { AppMenuDrawer, DrawerEdgeSwipeArea } from '@/views/app-menu-drawer';
import { styles } from '@/views/history-screen.styles';

type HistoryScreenProps = {
  deleteAllSavedResults: () => void;
  deleteSavedResult: (resultId: string) => void;
  getHistoryPassengerDisplayName: (
    entry: ResultsHistoryEntry,
    passengerId: string,
  ) => string;
  goHome: () => void;
  goToHistory: () => void;
  goToInfo: () => void;
  goToOptions: () => void;
  goToPublishers: () => void;
  restoreResult: (resultId: string) => void;
  savedResults: ResultsHistoryEntry[];
  language: LanguageCode;
};

export function HistoryScreen({
  deleteAllSavedResults,
  deleteSavedResult,
  getHistoryPassengerDisplayName,
  goHome,
  goToHistory,
  goToInfo,
  goToOptions,
  goToPublishers,
  restoreResult,
  savedResults,
  language,
}: HistoryScreenProps) {
  const t = (key: Parameters<typeof translate>[1], params?: Parameters<typeof translate>[2]) =>
    translate(language, key, params);
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const hasSavedResults = savedResults.length > 0;

  const toggleResult = (resultId: string) => {
    setExpandedResultId((currentResultId) =>
      currentResultId === resultId ? null : resultId,
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {menuOpen && (
        <AppMenuDrawer
          onClose={() => setMenuOpen(false)}
          onSelectHistory={goToHistory}
          onSelectHome={goHome}
          onSelectInfo={goToInfo}
          onSelectOptions={goToOptions}
          onSelectPublishers={goToPublishers}
        />
      )}
      {!menuOpen && <DrawerEdgeSwipeArea onOpen={() => setMenuOpen(true)} />}

      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable
              accessibilityLabel={menuOpen ? t('closeMenu') : t('openMenu')}
              accessibilityRole="button"
              onPress={() => setMenuOpen((currentValue) => !currentValue)}
              style={({ pressed }) => [styles.menuButton, pressed && styles.buttonPressed]}>
              <Menu color={colors.text} size={22} strokeWidth={2.5} />
            </Pressable>

            <View style={styles.titlePanel}>
              <Text style={styles.title}>{t('history')}</Text>
            </View>
          </View>

          {hasSavedResults ? (
            <View style={styles.historyList}>
              {savedResults.map((result) => (
                <HistoryResultCard
                  deleteSavedResult={deleteSavedResult}
                  expanded={expandedResultId === result.id}
                  getHistoryPassengerDisplayName={getHistoryPassengerDisplayName}
                  language={language}
                  key={result.id}
                  restoreResult={restoreResult}
                  result={result}
                  toggleResult={toggleResult}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyPanel}>
              <Text style={styles.emptyTitle}>{t('noSavedResults')}</Text>
              <Text style={styles.emptyText}>
                {t('noSavedResultsText')}
              </Text>
            </View>
          )}

          <View style={styles.footerActions}>
            <Pressable
              accessibilityRole="button"
              disabled={!hasSavedResults}
              onPress={deleteAllSavedResults}
              style={({ pressed }) => [
                styles.footerButton,
                hasSavedResults ? styles.clearAllButton : styles.disabledButton,
                pressed && hasSavedResults && styles.buttonPressed,
              ]}>
              <Text
                style={[
                  styles.clearAllButtonText,
                  !hasSavedResults && styles.disabledButtonText,
                ]}>
                {t('clearAll')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function HistoryResultCard({
  deleteSavedResult,
  expanded,
  getHistoryPassengerDisplayName,
  language,
  restoreResult,
  result,
  toggleResult,
}: {
  deleteSavedResult: (resultId: string) => void;
  expanded: boolean;
  getHistoryPassengerDisplayName: (
    entry: ResultsHistoryEntry,
    passengerId: string,
  ) => string;
  language: LanguageCode;
  restoreResult: (resultId: string) => void;
  result: ResultsHistoryEntry;
  toggleResult: (resultId: string) => void;
}) {
  return (
    <View style={styles.historyCard}>
      <View style={styles.historyCardHeader}>
        <Pressable
          accessibilityRole="button"
          onPress={() => toggleResult(result.id)}
          style={({ pressed }) => [
            styles.historyCardTitleButton,
            pressed && styles.buttonPressed,
          ]}>
          <Text style={styles.historyCardTitle}>
            {formatHistoryResultLabel(result, language)}
          </Text>
          <Text style={styles.historyCardToggle}>{expanded ? '-' : '+'}</Text>
        </Pressable>

        <Pressable
          accessibilityLabel={translate(language, 'deleteSavedResult')}
          accessibilityRole="button"
          onPress={() => deleteSavedResult(result.id)}
          style={({ pressed }) => [
            styles.historyDeleteButton,
            pressed && styles.buttonPressed,
          ]}>
          <X color={colors.dangerText} size={16} strokeWidth={2.8} />
        </Pressable>
      </View>

      {expanded && (
        <View style={styles.historyCardBody}>
          <View style={styles.historySummaryRow}>
            <Text style={styles.historySummaryText}>
              {translate(language, 'vehiclesUsed')}: {result.distribution.summary.vehiclesUsed}
            </Text>
            <Text style={styles.historySummaryText}>
              {translate(language, 'open')}: {result.distribution.summary.unusedSeats}
            </Text>
          </View>

          <View style={styles.historyVehicleList}>
            {result.distribution.assignments.map((assignment) => {
              const availableSeats = Math.max(
                assignment.capacity - assignment.passengerIds.length,
                0,
              );
              const publisherLabels = assignment.passengerIds.map((passengerId) =>
                getHistoryPassengerDisplayName(result, passengerId),
              );

              return (
                <View key={assignment.vehicleId} style={styles.historyVehicleRow}>
                  <View style={styles.historyVehicleHeader}>
                    <Text style={styles.historyVehicleName}>{assignment.label}</Text>
                    <Text style={styles.historyVehicleSeats}>
                      {assignment.passengerIds.length}/{assignment.capacity}{' '}
                      {formatSeatLabel(language, assignment.capacity)} - {availableSeats}{' '}
                      {language === 'es' ? 'disponibles' : 'available'}
                    </Text>
                  </View>
                  <Text style={styles.historyVehiclePublishers}>
                    {publisherLabels.length > 0
                      ? publisherLabels.join(', ')
                      : translate(language, 'noPublishers')}
                  </Text>
                </View>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => restoreResult(result.id)}
            style={({ pressed }) => [
              styles.historyRestoreButton,
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.historyRestoreButtonText}>
              {translate(language, 'restore')}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function formatHistoryResultLabel(result: ResultsHistoryEntry, language: LanguageCode) {
  const timestamp = formatHistoryTimestamp(result.createdAt, language);

  return `${timestamp} - ${formatPublishersCount(language, result.publisherCount)} - ${formatVehiclesCount(language, result.vehicles.length)}`;
}

function formatHistoryTimestamp(createdAt: string, language: LanguageCode) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return translate(language, 'savedResult');
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  const hour = date.getHours();
  const displayHour = hour % 12 || 12;
  const meridiem = hour >= 12 ? 'PM' : 'AM';

  return `${month}/${day}/${year} ${displayHour}:00 ${meridiem}`;
}
