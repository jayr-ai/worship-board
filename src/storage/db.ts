import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { PadAssignment } from '../types';

export interface ClipMarker {
  id: string;
  label: string;
  startSec: number;
  endSec: number;
}

export interface LibraryItem {
  id: string;
  fileName: string;
  label: string;
  durationSec: number;
  hash: string;
  mimeType: string;
  blob: Blob;
  createdAt: number;
  /** Waveform peaks for the clip editor, computed once and cached (section 7). */
  peaks?: number[];
  /** Section 1 clip editor: named start/end regions stored on the song. */
  markers?: ClipMarker[];
}

/** Section 8: "a set stores everything about a service setup." */
export interface SetData {
  id: string;
  name: string;
  levels: { clips: number; sfx: number; bg: number; ambient: number; master: number };
  muted: { clips: boolean; sfx: boolean; bg: boolean; ambient: boolean };
  clipsBankA: PadAssignment[];
  clipsBankB: PadAssignment[];
  sfxBankA: PadAssignment[];
  sfxBankB: PadAssignment[];
  bgPads: PadAssignment[];
  ambientQuality: 'major' | 'minor';
  ambientPack: 'warm' | 'airy';
  exclusiveClips: boolean;
  defaultClipFadeOutSec: number;
  createdAt: number;
  updatedAt: number;
}

export interface AppPrefs {
  pulseAnimation: boolean;
  autoDuckEnabled: boolean;
  duckAmbientToo: boolean;
  lockFadersToo: boolean;
  lastBackupAt: number | null;
}

interface AppSettingsRecord {
  key: string;
  value: unknown;
}

interface WorshipBoardDB extends DBSchema {
  library: {
    key: string;
    value: LibraryItem;
    indexes: { hash: string };
  };
  assignments: {
    key: string;
    value: PadAssignment;
  };
  sets: {
    key: string;
    value: SetData;
  };
  appSettings: {
    key: string;
    value: AppSettingsRecord;
  };
}

const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<WorshipBoardDB>> | null = null;

function getDB(): Promise<IDBPDatabase<WorshipBoardDB>> {
  if (!dbPromise) {
    dbPromise = openDB<WorshipBoardDB>('worship-board', DB_VERSION, {
      async upgrade(db, oldVersion, _newVersion, tx) {
        if (oldVersion < 1) {
          const library = db.createObjectStore('library', { keyPath: 'id' });
          library.createIndex('hash', 'hash');
          db.createObjectStore('assignments', { keyPath: 'id' });
        }
        if (oldVersion < 2) {
          db.createObjectStore('sets', { keyPath: 'id' });
          db.createObjectStore('appSettings', { keyPath: 'key' });

          // Carry forward any Phase 3-5 flat assignments into a default
          // named set, so upgrading the app doesn't lose a service already
          // built. A brand-new install has nothing here; useSetStore seeds
          // its own default set in that case.
          if (oldVersion >= 1) {
            const pads = await tx.objectStore('assignments').getAll();
            if (pads.length > 0) {
              const byId = new Map(pads.map((p) => [p.id, p]));
              const bank = (prefix: string, count: number) =>
                Array.from(
                  { length: count },
                  (_, i) => byId.get(`${prefix}-${i}`) ?? { id: `${prefix}-${i}`, libraryId: null },
                );

              const now = Date.now();
              const migrated: SetData = {
                id: 'default-sunday-service',
                name: 'Sunday Service',
                levels: { clips: 0.8, sfx: 1, bg: 0.25, ambient: 0.4, master: 1 },
                muted: { clips: false, sfx: false, bg: false, ambient: false },
                clipsBankA: bank('clips-a', 10),
                clipsBankB: bank('clips-b', 10),
                sfxBankA: bank('sfx-a', 10),
                sfxBankB: bank('sfx-b', 10),
                bgPads: bank('bg', 10),
                ambientQuality: 'major',
                ambientPack: 'warm',
                exclusiveClips: true,
                defaultClipFadeOutSec: 3,
                createdAt: now,
                updatedAt: now,
              };
              await tx.objectStore('sets').put(migrated);
              await tx.objectStore('appSettings').put({ key: 'currentSetId', value: migrated.id });
            }
          }
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllLibraryItems(): Promise<LibraryItem[]> {
  const db = await getDB();
  return db.getAll('library');
}

export async function findLibraryItemByHash(hash: string): Promise<LibraryItem | undefined> {
  const db = await getDB();
  return db.getFromIndex('library', 'hash', hash);
}

export async function putLibraryItem(item: LibraryItem): Promise<void> {
  const db = await getDB();
  await db.put('library', item);
}

export async function deleteLibraryItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('library', id);
}

export async function getAllSets(): Promise<SetData[]> {
  const db = await getDB();
  return db.getAll('sets');
}

export async function getSet(id: string): Promise<SetData | undefined> {
  const db = await getDB();
  return db.get('sets', id);
}

export async function putSet(set: SetData): Promise<void> {
  const db = await getDB();
  await db.put('sets', set);
}

export async function deleteSet(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sets', id);
}

export async function getAppSetting<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  const record = await db.get('appSettings', key);
  return record?.value as T | undefined;
}

export async function putAppSetting(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('appSettings', { key, value });
}
