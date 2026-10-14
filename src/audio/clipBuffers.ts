// Section 6.2: for clips, only the trimmed region is kept in memory, not the
// full decoded song. The full decode is a short-lived intermediate step.
import { useLibraryStore } from '../store/useLibraryStore';

export async function decodeLibraryItem(
  ctx: AudioContext,
  libraryId: string,
): Promise<AudioBuffer | null> {
  const item = useLibraryStore.getState().items.find((i) => i.id === libraryId);
  if (!item) return null;
  const arrayBuffer = await item.blob.arrayBuffer();
  try {
    return await ctx.decodeAudioData(arrayBuffer);
  } catch {
    return null;
  }
}

export function extractTrimmedBuffer(
  ctx: AudioContext,
  source: AudioBuffer,
  startSec: number,
  endSec: number,
): AudioBuffer {
  const sampleRate = source.sampleRate;
  const startFrame = Math.max(0, Math.floor(startSec * sampleRate));
  const endFrame = Math.min(source.length, Math.floor(endSec * sampleRate));
  const frameCount = Math.max(1, endFrame - startFrame);

  const trimmed = ctx.createBuffer(source.numberOfChannels, frameCount, sampleRate);
  for (let channel = 0; channel < source.numberOfChannels; channel++) {
    const data = source.getChannelData(channel).subarray(startFrame, startFrame + frameCount);
    trimmed.copyToChannel(data, channel);
  }
  return trimmed;
}

const trimmedCache = new Map<string, AudioBuffer>();

function cacheKey(libraryId: string, startSec: number, endSec: number): string {
  return `${libraryId}:${startSec.toFixed(2)}:${endSec.toFixed(2)}`;
}

export async function getTrimmedClipBuffer(
  ctx: AudioContext,
  libraryId: string,
  startSec: number,
  endSec: number,
): Promise<AudioBuffer | null> {
  const key = cacheKey(libraryId, startSec, endSec);
  const cached = trimmedCache.get(key);
  if (cached) return cached;

  const full = await decodeLibraryItem(ctx, libraryId);
  if (!full) return null;

  const trimmed = extractTrimmedBuffer(ctx, full, startSec, endSec);
  trimmedCache.set(key, trimmed);
  return trimmed;
}
