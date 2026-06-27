import { useState } from 'react';
import { Menu, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PublisherProfile } from '@/models/group-assignment';
import { colors } from '@/styles/theme';
import { AppMenuDrawer } from '@/views/app-menu-drawer';
import { styles } from '@/views/publishers-screen.styles';

type PublishersScreenProps = {
  addPublisherProfile: (name: string) => void;
  clearPersistentCache: () => Promise<void>;
  deleteAllPublisherProfiles: () => void;
  goHome: () => void;
  goToPublishers: () => void;
  publisherProfiles: PublisherProfile[];
  removePublisherProfile: (publisherId: string) => void;
  storageUsageBytes: number;
};

export function PublishersScreen({
  addPublisherProfile,
  clearPersistentCache,
  deleteAllPublisherProfiles,
  goHome,
  goToPublishers,
  publisherProfiles,
  removePublisherProfile,
  storageUsageBytes,
}: PublishersScreenProps) {
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
          onClearCache={clearPersistentCache}
          onSelectHome={goHome}
          onSelectPublishers={goToPublishers}
          onSelectOption={() => undefined}
          storageUsageBytes={storageUsageBytes}
        />
      )}

      <AddPublisherModal
        canConfirm={canAddPublisher}
        name={newPublisherName}
        onCancel={closeAddPublisherModal}
        onChangeName={setNewPublisherName}
        onConfirm={saveNewPublisher}
        visible={publisherModalVisible}
      />

      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable
              accessibilityLabel={menuOpen ? 'Close menu' : 'Open menu'}
              accessibilityRole="button"
              onPress={() => setMenuOpen((currentValue) => !currentValue)}
              style={({ pressed }) => [styles.menuButton, pressed && styles.buttonPressed]}>
              <Menu color={colors.text} size={22} strokeWidth={2.5} />
            </Pressable>

            <View style={styles.titlePanel}>
              <Text style={styles.title}>Publishers</Text>
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
                    accessibilityLabel={`Remove ${publisher.name}`}
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
              <Text style={styles.emptyTitle}>No saved publishers</Text>
              <Text style={styles.emptyText}>
                Publisher names saved from seat labels will appear here.
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
              <Text style={styles.addButtonText}>Add New</Text>
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
                Delete All
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
  visible,
}: {
  canConfirm: boolean;
  name: string;
  onCancel: () => void;
  onChangeName: (name: string) => void;
  onConfirm: () => void;
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
          <Text style={styles.modalTitle}>Add Publisher</Text>

          <TextInput
            accessibilityLabel="Publisher name"
            autoCapitalize="words"
            autoFocus
            onChangeText={onChangeName}
            onSubmitEditing={onConfirm}
            placeholder="Enter publisher name"
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
              <Text style={styles.secondaryButtonText}>Cancel</Text>
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
                Confirm
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
