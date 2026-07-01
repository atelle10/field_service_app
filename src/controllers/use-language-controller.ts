import { router } from 'expo-router';
import { useState } from 'react';

import { useGroupSession } from '@/context/group-session-context';
import { Language, type LanguageCode, translate } from '@/i18n';

export function useLanguageController() {
  const {
    completeLanguageSelection,
    hasActiveSession,
    preferences,
  } = useGroupSession();
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(
    preferences.language,
  );

  const confirmLanguage = async () => {
    await completeLanguageSelection(selectedLanguage);
    router.replace(hasActiveSession ? '/results' : '/select');
  };

  return {
    currentLanguage: preferences.language,
    confirmLanguage,
    languageOptions: [
      { code: Language.English, label: 'English' },
      { code: Language.Spanish, label: 'Español' },
    ],
    selectLanguage: setSelectedLanguage,
    selectedLanguage,
    t: (key: Parameters<typeof translate>[1], params?: Parameters<typeof translate>[2]) =>
      translate(selectedLanguage, key, params),
  };
}
