import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it } from 'vitest';
import type { PadAssignment } from '../types';

// Simulates a Phase 3-5 install (DB v1: flat `library` + `assignments`
// stores, no `sets`) and checks that opening it with the current schema
// (db.ts, v2) migrates the assignments into a named "Sunday Service" set
// instead of silently losing a service someone already built.

function openV1Database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('worship-board', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      const library = db.createObjectStore('library', { keyPath: 'id' });
      library.createIndex('hash', 'hash');
      db.createObjectStore('assignments', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function putAssignment(db: IDBDatabase, pad: PadAssignment): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('assignments', 'readwrite');
    tx.objectStore('assignments').put(pad);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

describe('v1 -> v2 set migration', () => {
  beforeAll(async () => {
    const v1db = await openV1Database();
    await putAssignment(v1db, {
      id: 'sfx-a-0',
      libraryId: 'demo-sfx-0',
      label: 'Clap',
      tag: 'ONE-SHOT',
      mode: 'oneshot',
      durationSec: 1.2,
    });
    await putAssignment(v1db, {
      id: 'clips-a-3',
      libraryId: 'some-song-id',
      label: 'Song | Chorus',
      startSec: 10,
      endSec: 28,
      fadeOutSec: 4,
    });
    v1db.close();
  });

  it('carries existing pad assignments into a new "Sunday Service" set', async () => {
    const db = await import('./db');
    const sets = await db.getAllSets();

    expect(sets).toHaveLength(1);
    const migrated = sets[0];
    expect(migrated.name).toBe('Sunday Service');

    const clapPad = migrated.sfxBankA.find((p) => p.id === 'sfx-a-0');
    expect(clapPad?.label).toBe('Clap');
    expect(clapPad?.libraryId).toBe('demo-sfx-0');

    const clipPad = migrated.clipsBankA.find((p) => p.id === 'clips-a-3');
    expect(clipPad?.label).toBe('Song | Chorus');
    expect(clipPad?.startSec).toBe(10);
    expect(clipPad?.endSec).toBe(28);
  });

  it('fills every other pad slot with an empty placeholder, not undefined', async () => {
    const db = await import('./db');
    const [migrated] = await db.getAllSets();

    // v1 -> v3 in one jump: the v1 -> v2 step reconstructs 10-pad banks
    // from the old flat assignments store, then the v2 -> v3 step (below)
    // immediately grows them to 15.
    expect(migrated.sfxBankA).toHaveLength(15);
    expect(migrated.clipsBankA).toHaveLength(15);
    expect(migrated.clipsBankB).toHaveLength(15);
    expect(migrated.bgPads).toHaveLength(15);
    expect(migrated.ambientPads).toHaveLength(12);
    expect(migrated.ambientPads.every((p) => p.libraryId === null)).toBe(true);

    const untouchedPad = migrated.sfxBankA.find((p) => p.id === 'sfx-a-1');
    expect(untouchedPad).toEqual({ id: 'sfx-a-1', libraryId: null });

    const grownPad = migrated.sfxBankA.find((p) => p.id === 'sfx-a-12');
    expect(grownPad).toEqual({ id: 'sfx-a-12', libraryId: null });
  });

  it('points currentSetId at the migrated set so it loads automatically', async () => {
    const db = await import('./db');
    const [migrated] = await db.getAllSets();
    const currentSetId = await db.getAppSetting<string>('currentSetId');
    expect(currentSetId).toBe(migrated.id);
  });

  it('creates the folders store (v4) empty, and can store a folder', async () => {
    const db = await import('./db');
    expect(await db.getAllFolders()).toEqual([]);

    const folder = { id: 'f1', name: 'Sound Effects', createdAt: Date.now() };
    await db.putFolder(folder);
    expect(await db.getAllFolders()).toEqual([folder]);
  });
});
