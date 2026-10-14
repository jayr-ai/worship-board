// Decoded custom Ambient audio, cached by libraryId so retriggering the
// same key doesn't re-decode every time (same pattern as sfxBuffers.ts).
import { decodeLibraryItem } from './clipBuffers';

const cache = new Map<string, AudioBuffer>();

export async function getAmbientCustomBuffer(
  ctx: AudioContext,
  libraryId: string,
): Promise<AudioBuffer | null> {
  const cached = cache.get(libraryId);
  if (cached) return cached;

  const buffer = await decodeLibraryItem(ctx, libraryId);
  if (!buffer) return null;

  cache.set(libraryId, buffer);
  return buffer;
}
