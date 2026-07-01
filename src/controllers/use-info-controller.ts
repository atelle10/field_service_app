import { router } from 'expo-router';
import { Linking } from 'react-native';

import packageMetadata from '../../package.json';

const repositoryUrl = 'https://github.com/atelle10/field_service_app';

export function useInfoController() {
  const goHome = () => {
    router.navigate('/results');
  };

  const goToHistory = () => {
    router.navigate('/history');
  };

  const goToInfo = () => {
    router.navigate('/info');
  };

  const goToOptions = () => {
    router.navigate('/options');
  };

  const goToPublishers = () => {
    router.navigate('/publishers');
  };

  const openRepository = () => {
    void Linking.openURL(repositoryUrl);
  };

  return {
    appVersion: packageMetadata.version,
    goHome,
    goToHistory,
    goToInfo,
    goToOptions,
    goToPublishers,
    openRepository,
    repositoryUrl,
  };
}
