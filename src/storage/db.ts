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
}

let dbPromise: Promise<IDBPDatabase<WorshipBoardDB>> | null = null;

function getDB(): Promise<IDBPDatabase<WorshipBoardDB>> {
  if (!dbPromise) {
    dbPromise = openDB<WorshipBoardDB>('worship-board', 1, {
      upgrade(db) {
        const library = db.createObjectStore('library', { keyPath: 'id' });
        library.createIndex('hash', 'hash');
        db.createObjectStore('assignments', { keyPath: 'id' });
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

export async function getAllAssignments(): Promise<PadAssignment[]> {
  const db = await getDB();
  return db.getAll('assignments');
}

export async function putAssignment(pad: PadAssignment): Promise<void> {
  const db = await getDB();
  await db.put('assignments', pad);
}

export async function putAssignments(pads: PadAssignment[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('assignments', 'readwrite');
  await Promise.all(pads.map((pad) => tx.store.put(pad)));
  await tx.done;
}
