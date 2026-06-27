import type AsyncStorageStatic from '@react-native-async-storage/async-storage';

import type { PublisherProfile } from '@/models/group-assignment';
import type { ResultsHistoryEntry } from '@/services/group-session-service';

const PUBLISHERS_STORAGE_KEY = 'fieldServiceAssistant:v1:publishers';
const SAVED_RESULTS_STORAGE_KEY = 'fieldServiceAssistant:v1:savedResults';
const APP_STORAGE_KEYS = [PUBLISHERS_STORAGE_KEY, SAVED_RESULTS_STORAGE_KEY] as const;

type AsyncStorageModule = typeof AsyncStorageStatic;

export type PersistedGroupData = {
  publisherProfiles: PublisherProfile[];
  savedResults: ResultsHistoryEntry[];
  storageUsageBytes: number;
};

export async function loadPersistedGroupData(): Promise<PersistedGroupData> {
  const asyncStorage = await getAsyncStorage();
  const [[, publishersValue], [, savedResultsValue]] = await asyncStorage.multiGet([
    PUBLISHERS_STORAGE_KEY,
    SAVED_RESULTS_STORAGE_KEY,
  ]);

  return {
    publisherProfiles: parsePublisherProfiles(publishersValue),
    savedResults: parseSavedResults(savedResultsValue),
    storageUsageBytes: estimateStorageBytes([
      publishersValue ?? '',
      savedResultsValue ?? '',
    ]),
  };
}

export async function savePublisherProfiles(publisherProfiles: PublisherProfile[]) {
  const asyncStorage = await getAsyncStorage();
  await asyncStorage.setItem(
    PUBLISHERS_STORAGE_KEY,
    serializePersistentPublishers(publisherProfiles),
  );

  return getPersistentStorageUsage();
}

export async function saveResultHistoryEntry(entry: ResultsHistoryEntry) {
  const asyncStorage = await getAsyncStorage();
  const existingResults = parseSavedResults(
    await asyncStorage.getItem(SAVED_RESULTS_STORAGE_KEY),
  );
  const nextResults = [...existingResults, entry];

  await asyncStorage.setItem(
    SAVED_RESULTS_STORAGE_KEY,
    serializePersistentResults(nextResults),
  );

  return getPersistentStorageUsage();
}

export async function getPersistentStorageUsage() {
  const asyncStorage = await getAsyncStorage();
  const entries = await asyncStorage.multiGet([...APP_STORAGE_KEYS]);

  return estimateStorageBytes(entries.map(([, value]) => value ?? ''));
}

export async function clearPersistentStorage() {
  const asyncStorage = await getAsyncStorage();
  await asyncStorage.multiRemove([...APP_STORAGE_KEYS]);

  return getPersistentStorageUsage();
}

export function serializePersistentPublishers(publisherProfiles: PublisherProfile[]) {
  return JSON.stringify(publisherProfiles);
}

export function serializePersistentResults(results: ResultsHistoryEntry[]) {
  return JSON.stringify(results);
}

export function estimateStorageBytes(values: string[]) {
  return values.reduce((total, value) => total + getUtf8ByteLength(value), 0);
}

export function mergePersistedPublishers(
  existingPublishers: PublisherProfile[],
  persistedPublishers: PublisherProfile[],
) {
  const mergedPublishers = [...existingPublishers];

  for (const persistedPublisher of persistedPublishers) {
    const alreadyExists = mergedPublishers.some(
      (publisher) =>
        normalizePublisherNameForCompare(publisher.name) ===
        normalizePublisherNameForCompare(persistedPublisher.name),
    );

    if (alreadyExists) {
      continue;
    }

    mergedPublishers.push({
      ...persistedPublisher,
      id: createUniquePublisherId(mergedPublishers, persistedPublisher.id),
    });
  }

  return mergedPublishers;
}

function parsePublisherProfiles(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isPublisherProfile);
  } catch {
    return [];
  }
}

function parseSavedResults(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed) ? (parsed as ResultsHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function isPublisherProfile(value: unknown): value is PublisherProfile {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof value.id === 'string' &&
    typeof value.name === 'string'
  );
}

function createUniquePublisherId(publisherProfiles: PublisherProfile[], candidateId: string) {
  const existingIds = new Set(publisherProfiles.map((publisher) => publisher.id));

  if (!existingIds.has(candidateId)) {
    return candidateId;
  }

  let index = publisherProfiles.length + 1;
  let nextId = `publisher-profile-${index}`;

  while (existingIds.has(nextId)) {
    index += 1;
    nextId = `publisher-profile-${index}`;
  }

  return nextId;
}

function normalizePublisherName(name: string) {
  return name.trim().replace(/\s+/g, ' ');
}

function normalizePublisherNameForCompare(name: string) {
  return normalizePublisherName(name).toLocaleLowerCase();
}

function getUtf8ByteLength(value: string) {
  let bytes = 0;

  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;

    if (codePoint <= 0x7f) {
      bytes += 1;
    } else if (codePoint <= 0x7ff) {
      bytes += 2;
    } else if (codePoint <= 0xffff) {
      bytes += 3;
    } else {
      bytes += 4;
    }
  }

  return bytes;
}

async function getAsyncStorage(): Promise<AsyncStorageModule> {
  const module = await import('@react-native-async-storage/async-storage');

  return module.default;
}
