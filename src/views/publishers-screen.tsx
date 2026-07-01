import { useState } from 'react';
import { Menu, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PublisherProfile } from '@/models/group-assignment';
import { type LanguageCode, translate } from '@/i18n';
import { colors } from '@/styles/theme';
import { AppMenuDrawer, DrawerEdgeSwipeArea } from '@/views/app-menu-drawer';
import { styles } from '@/views/publishers-screen.styles';

type PublishersScreenProps = {
  addPublisherProfile: (name: string) => void;
  deleteAllPublisherProfiles: () => void;
  goHome: () => void;
  goToHistory: () => void;
  goToInfo: () => void;
  goToPublishers: () => void;
  goToOptions: () => void;
  publisherProfiles: PublisherProfile[];
  removePublisherProfile: (publisherId: string) => void;
  language: LanguageCode;
};

export function PublishersScreen({
  addPublisherProfile,
  deleteAllPublisherProfiles,
  goHome,
  goToHistory,
  goToInfo,
  goToPublishers,
  goToOptions,
  publisherProfiles,
  removePublisherProfile,
  language,
}: PublishersScreenProps) {
  const t = (key: Parameters<typeof translate>[1], params?: Parameters<typeof translate>[2]) =>
    translate(language, key, params);
  const [menuOpen, setMenuOpen] = useState(false);
  const [newPublisherName, setNewPublisherName] = useState('');
  const [publisherModalVisible, setPublisherModalVisible] = useState(false);
  const hasPublishers = publisherProfiles.length > 0;
  const canAddPublisher = newPublisherName.trim().length > 0;

  const openAddPublisherModal = () => {
    setNewPublisherName('');
    setPublisherModalVisible(true);
  };

  const closeAddPublisherModal = () => {
    setNewPublisherName('');
    setPublisherModalVisible(false);
  };

  const saveNewPublisher = () => {
    if (!canAddPublisher) {
      return;
    }

    addPublisherProfile(newPublisherName);
    closeAddPublisherModal();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {menuOpen && (
        <AppMenuDrawer
          onClose={() => setMenuOpen(false)}
          onSelectHome={goHome}
          onSelectHistory={goToHistory}
          onSelectInfo={goToInfo}
          onSelectPublishers={goToPublishers}
          onSelectOptions={goToOptions}
        />
      )}
      {!menuOpen && <DrawerEdgeSwipeArea onOpen={() => setMenuOpen(true)} />}

      <AddPublisherModal
        canConfirm={canAddPublisher}
        name={newPublisherName}
        onCancel={closeAddPublisherModal}
        onChangeName={setNewPublisherName}
        onConfirm={saveNewPublisher}
        t={t}
        visible={publisherModalVisible}
      />

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
              <Text style={styles.title}>{t('publishers')}</Text>
            </View>
          </View>

          {hasPublishers ? (
            <View style={styles.list}>
              {publisherProfiles.map((publisher) => (
                <View key={publisher.id} style={styles.listItem}>
                  <Text style={styles.publisherName} numberOfLines={1}>
                    {publisher.name}
                  </Text>
                  <Pressable
                    accessibilityLabel={t('removePublisher', { name: publisher.name })}
                    accessibilityRole="button"
                    onPress={() => removePublisherProfile(publisher.id)}
                    style={({ pressed }) => [
                      styles.removeButton,
                      pressed && styles.buttonPressed,
                    ]}>
                    <X color={colors.dangerText} size={18} strokeWidth={2.8} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyPanel}>
              <Text style={styles.emptyTitle}>{t('noSavedPublishers')}</Text>
              <Text style={styles.emptyText}>
                {t('noSavedPublishersText')}
              </Text>
            </View>
          )}

          <View style={styles.footerActions}>
            <Pressable
              accessibilityRole="button"
              onPress={openAddPublisherModal}
              style={({ pressed }) => [
                styles.footerButton,
                styles.addButton,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.addButtonText}>{t('addNew')}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={!hasPublishers}
              onPress={deleteAllPublisherProfiles}
              style={({ pressed }) => [
                styles.footerButton,
                hasPublishers ? styles.deleteAllButton : styles.disabledButton,
                pressed && hasPublishers && styles.buttonPressed,
              ]}>
              <Text
                style={[
                  styles.deleteAllButtonText,
                  !hasPublishers && styles.disabledButtonText,
                ]}>
                {t('deleteAll')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function AddPublisherModal({
  canConfirm,
  name,
  onCancel,
  onChangeName,
  onConfirm,
  t,
  visible,
}: {
  canConfirm: boolean;
  name: string;
  onCancel: () => void;
  onChangeName: (name: string) => void;
  onConfirm: () => void;
  t: (key: Parameters<typeof translate>[1], params?: Parameters<typeof translate>[2]) => string;
  visible: boolean;
}) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{t('addPublisher')}</Text>

          <TextInput
            accessibilityLabel={t('publisherName')}
            autoCapitalize="words"
            autoFocus
            onChangeText={onChangeName}
            onSubmitEditing={onConfirm}
            placeholder={t('enterPublisherName')}
            placeholderTextColor={colors.textSubtle}
            returnKeyType="done"
            style={styles.nameInput}
            value={name}
          />

          <View style={styles.modalActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.modalButton,
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.secondaryButtonText}>{t('cancel')}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={!canConfirm}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.modalButton,
                canConfirm ? styles.primaryButton : styles.disabledButton,
                pressed && canConfirm && styles.buttonPressed,
              ]}>
              <Text
                style={[
                  styles.primaryButtonText,
                  !canConfirm && styles.disabledButtonText,
                ]}>
                {t('confirm')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
