import { Check } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { LanguageCode, TranslationKey } from '@/i18n';
import { colors, radii } from '@/styles/theme';

type LanguageScreenProps = {
  confirmLanguage: () => Promise<void>;
  currentLanguage: LanguageCode;
  languageOptions: { code: LanguageCode; label: string }[];
  selectLanguage: (language: LanguageCode) => void;
  selectedLanguage: LanguageCode;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

export function LanguageScreen({
  confirmLanguage,
  currentLanguage,
  languageOptions,
  selectLanguage,
  selectedLanguage,
  t,
}: LanguageScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Image
          accessibilityLabel={t('appLogo')}
          source={require('../assets/field_service_assistant_logo_3.png')}
          style={styles.logo}
        />

        <View style={styles.copy}>
          <Text style={styles.title}>{t('chooseLanguage')}</Text>
          <Text style={styles.subtitle}>{t('selectLanguagePrompt')}</Text>
          <Text style={styles.meta}>{t('languageMeta')}</Text>
        </View>

        <View style={styles.languageList}>
          {languageOptions.map((option) => {
            const active = option.code === selectedLanguage;
            const saved = option.code === currentLanguage;

            return (
              <Pressable
                accessibilityRole="button"
                key={option.code}
                onPress={() => {
                  void selectLanguage(option.code);
                }}
                style={({ pressed }) => [
                  styles.languageButton,
                  active && styles.languageButtonActive,
                  pressed && styles.buttonPressed,
                ]}>
                <Text
                  style={[
                    styles.languageButtonText,
                    active && styles.languageButtonTextActive,
                  ]}>
                  {option.label}
                </Text>
                {(active || saved) && (
                  <Check
                    color={active ? colors.background : colors.mint}
                    size={18}
                    strokeWidth={2.8}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void confirmLanguage();
          }}
          style={({ pressed }) => [
            styles.confirmButton,
            pressed && styles.buttonPressed,
          ]}>
          <Text style={styles.confirmButtonText}>{t('confirm')}</Text>
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
    gap: 24,
    paddingHorizontal: 24,
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
  },
  copy: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  meta: {
    color: colors.textSubtle,
    fontSize: 12,
    textAlign: 'center',
  },
  languageList: {
    width: '100%',
    gap: 12,
  },
  languageButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.small,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
  },
  languageButtonActive: {
    borderColor: colors.mint,
    backgroundColor: colors.mint,
  },
  languageButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  languageButtonTextActive: {
    color: colors.background,
  },
  confirmButton: {
    minWidth: 160,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.small,
    backgroundColor: colors.deepForest,
    paddingHorizontal: 24,
  },
  confirmButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.82,
  },
});
