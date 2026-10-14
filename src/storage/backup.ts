// Section 8 backup/restore: a set (or everything) exported as one .zip with
// its referenced audio, shared through the iPad share sheet or downloaded.
import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import type { LibraryItem, SetData } from './db';
import { findLibraryItemByHash, putLibraryItem, putSet } from './db';

const MANIFEST_VERSION = 1;

interface LibraryManifestEntry {
  id: string;
  fileName: string;
  label: string;
  durationSec: number;
  hash: string;
  mimeType: string;
  path: string;
}

interface Manifest {
  version: number;
  exportedAt: number;
  sets: SetData[];
  library: LibraryManifestEntry[];
}

function extensionFor(mimeType: string): string {
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mp4') || mimeType.includes('m4a') || mimeType.includes('aac')) return 'm4a';
  if (mimeType.includes('mpeg') || mimeType.includes('mp3')) return 'mp3';
  return 'bin';
}

function padIdsReferenced(sets: SetData[]): Set<string> {
  const ids = new Set<string>();
  for (const set of sets) {
    for (const pad of [
      ...set.clipsBankA,
      ...set.clipsBankB,
      ...set.sfxBankA,
      ...set.sfxBankB,
      ...set.bgPads,
    ]) {
      if (pad.libraryId) ids.add(pad.libraryId);
    }
  }
  return ids;
}

/** Builds a backup zip for one or more sets, bundling only the library
 * files those sets actually reference. */
export async function buildBackupZip(sets: SetData[], library: LibraryItem[]): Promise<Blob> {
  const referencedIds = padIdsReferenced(sets);
  const included = library.filter((item) => referencedIds.has(item.id));

  const files: Record<string, Uint8Array> = {};
  const libraryManifest: LibraryManifestEntry[] = [];

  for (const item of included) {
    const path = `library/${item.id}.${extensionFor(item.mimeType)}`;
    libraryManifest.push({
      id: item.id,
      fileName: item.fileName,
      label: item.label,
      durationSec: item.durationSec,
      hash: item.hash,
      mimeType: item.mimeType,
      path,
    });
    files[path] = new Uint8Array(await item.blob.arrayBuffer());
  }

  const manifest: Manifest = {
    version: MANIFEST_VERSION,
    exportedAt: Date.now(),
    sets,
    library: libraryManifest,
  };
  files['manifest.json'] = strToU8(JSON.stringify(manifest));

  const zipped = zipSync(files, { level: 6 });
  return new Blob([zipped], { type: 'application/zip' });
}

export interface RestoreResult {
  importedSets: SetData[];
  importedLibraryCount: number;
}

/** Parses and restores a backup zip: dedupes library files by hash, always
 * imports sets as new records (renaming on a name collision) so restoring
 * a backup never silently overwrites the current set. */
export async function restoreBackupZip(
  file: File,
  existingSetNames: Set<string>,
): Promise<RestoreResult> {
  const buffer = new Uint8Array(await file.arrayBuffer());
  const entries = unzipSync(buffer);

  const manifestBytes = entries['manifest.json'];
  if (!manifestBytes) throw new Error('This file is not a Worship Board backup.');
  const manifest = JSON.parse(strFromU8(manifestBytes)) as Manifest;

  const idRemap = new Map<string, string>();

  for (const entry of manifest.library) {
    const existing = await findLibraryItemByHash(entry.hash);
    if (existing) {
      idRemap.set(entry.id, existing.id);
      continue;
    }
    const bytes = entries[entry.path];
    if (!bytes) continue;
    const blob = new Blob([bytes], { type: entry.mimeType });
    const newId = crypto.randomUUID();
    idRemap.set(entry.id, newId);
    const item: LibraryItem = {
      id: newId,
      fileName: entry.fileName,
      label: entry.label,
      durationSec: entry.durationSec,
      hash: entry.hash,
      mimeType: entry.mimeType,
      blob,
      createdAt: Date.now(),
    };
    await putLibraryItem(item);
  }

  const remapPad = <T extends { libraryId: string | null }>(pad: T): T =>
    pad.libraryId && idRemap.has(pad.libraryId)
      ? { ...pad, libraryId: idRemap.get(pad.libraryId)! }
      : pad;

  const importedSets: SetData[] = [];
  for (const set of manifest.sets) {
    let name = set.name;
    if (existingSetNames.has(name)) {
      let n = 2;
      while (existingSetNames.has(`${set.name} (${n})`)) n++;
      name = `${set.name} (${n})`;
    }
    existingSetNames.add(name);

    const restored: SetData = {
      ...set,
      id: crypto.randomUUID(),
      name,
      clipsBankA: set.clipsBankA.map(remapPad),
      clipsBankB: set.clipsBankB.map(remapPad),
      sfxBankA: set.sfxBankA.map(remapPad),
      sfxBankB: set.sfxBankB.map(remapPad),
      bgPads: set.bgPads.map(remapPad),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await putSet(restored);
    importedSets.push(restored);
  }

  return { importedSets, importedLibraryCount: manifest.library.length };
}

/** iPad share sheet when available (Web Share API Level 2 with files),
 * falling back to a plain download link. */
export async function shareOrDownloadZip(blob: Blob, filename: string): Promise<void> {
  const file = new File([blob], filename, { type: 'application/zip' });

  const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
  if (nav.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      // Fall through to download on any other share failure.
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
