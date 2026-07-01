import { ExternalLink, Menu } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/styles/theme';
import { type LanguageCode, translate } from '@/i18n';
import { AppMenuDrawer, DrawerEdgeSwipeArea } from '@/views/app-menu-drawer';
import { styles } from '@/views/info-screen.styles';

const openSourceCredits = [
  'Expo',
  'React Native',
  'Expo Router',
  'AsyncStorage',
  'React Native Picker',
  'Lucide React Native',
  'React Native Reanimated',
  'React Native Gesture Handler',
];

type InfoScreenProps = {
  appVersion: string;
  goHome: () => void;
  goToHistory: () => void;
  goToInfo: () => void;
  goToOptions: () => void;
  goToPublishers: () => void;
  openRepository: () => void;
  repositoryUrl: string;
  language: LanguageCode;
};

export function InfoScreen({
  appVersion,
  goHome,
  goToHistory,
  goToInfo,
  goToOptions,
  goToPublishers,
  openRepository,
  repositoryUrl,
  language,
}: InfoScreenProps) {
  const [creditsExpanded, setCreditsExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const t = (key: Parameters<typeof translate>[1], params?: Parameters<typeof translate>[2]) =>
    translate(language, key, params);

  return (
    <SafeAreaView style={styles.safeArea}>
      {menuOpen && (
        <AppMenuDrawer
          onClose={() => setMenuOpen(false)}
          onSelectHome={goHome}
          onSelectHistory={goToHistory}
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
              <Text style={styles.title}>{t('info')}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.appName}>Field Service Assistant</Text>
            <Text style={styles.metaText}>{t('version', { version: appVersion })}</Text>
            <Text style={styles.metaText}>© 2026 Andrew Tellez</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('about')}</Text>
            <Text style={styles.bodyText}>
              {t('appDescription')}
            </Text>
            <Text style={styles.bodyText}>
              {t('appOpenSource')}
            </Text>

            <Pressable
              accessibilityRole="link"
              onPress={openRepository}
              style={({ pressed }) => [
                styles.repositoryButton,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.repositoryButtonText}>{t('githubRepo')}</Text>
              <ExternalLink color={colors.background} size={16} strokeWidth={2.5} />
            </Pressable>
          </View>

          <View style={styles.section}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setCreditsExpanded((currentValue) => !currentValue)}
              style={({ pressed }) => [
                styles.dropdownHeader,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.sectionTitle}>{t('openSourceCredits')}</Text>
              <Text style={styles.dropdownIcon}>{creditsExpanded ? '-' : '+'}</Text>
            </Pressable>

            {creditsExpanded && (
              <>
                <Text style={styles.bodyText}>
                  {t('openSourceIntro')}
                </Text>

                <View style={styles.creditList}>
                  {openSourceCredits.map((credit) => (
                    <Text key={credit} style={styles.creditText}>
                      {credit}
                    </Text>
                  ))}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
