import type { LibraryItem } from './db';
import { findLibraryItemByHash, putLibraryItem } from './db';
import { hashBlob } from './hash';
import { probeAudioDuration } from './audioProbe';

function labelFromFileName(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '');
}

/** Imports one file into the library, deduplicating by content hash. */
export async function importAudioFile(file: File): Promise<LibraryItem> {
  const hash = await hashBlob(file);
  const existing = await findLibraryItemByHash(hash);
  if (existing) return existing;

  const durationSec = await probeAudioDuration(file);

  const item: LibraryItem = {
    id: crypto.randomUUID(),
    fileName: file.name,
    label: labelFromFileName(file.name),
    durationSec,
    hash,
    mimeType: file.type || 'audio/mpeg',
    blob: file,
    createdAt: Date.now(),
  };

  await putLibraryItem(item);
  return item;
}

export interface ImportResult {
  succeeded: LibraryItem[];
  failed: { fileName: string; message: string }[];
}

export async function importAudioFiles(files: FileList | File[]): Promise<ImportResult> {
  const succeeded: LibraryItem[] = [];
  const failed: ImportResult['failed'] = [];

  for (const file of Array.from(files)) {
    try {
      succeeded.push(await importAudioFile(file));
    } catch (err) {
      failed.push({
        fileName: file.name,
        message: err instanceof Error ? err.message : 'Import failed.',
      });
    }
  }

  return { succeeded, failed };
}
