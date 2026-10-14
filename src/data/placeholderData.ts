import type { PadAssignment } from '../types';
import type { SetData } from '../storage/db';

const emptyPad = (id: string): PadAssignment => ({ id, libraryId: null });

export const createEmptyBank = (prefix: string, count = 10): PadAssignment[] =>
  Array.from({ length: count }, (_, i) => emptyPad(`${prefix}-${i}`));

const demoSfxLabels = ['Clap', 'Air Horn', 'Drum Roll', 'Whoosh', 'Kick', 'Snare'];

export const sfxBankA: PadAssignment[] = Array.from({ length: 10 }, (_, i) => {
  if (i < demoSfxLabels.length) {
    return {
      id: `sfx-a-${i}`,
      libraryId: `demo-sfx-${i}`,
      label: demoSfxLabels[i],
      tag: 'ONE-SHOT',
      mode: 'oneshot',
      durationSec: 1.2,
    };
  }
  return emptyPad(`sfx-a-${i}`);
});

export const sfxBankB: PadAssignment[] = createEmptyBank('sfx-b');
export const clipsBankA: PadAssignment[] = createEmptyBank('clips-a');
export const clipsBankB: PadAssignment[] = createEmptyBank('clips-b');
export const bgPads: PadAssignment[] = createEmptyBank('bg', 10);

export function createDefaultSetData(id: string, name: string): SetData {
  const now = Date.now();
  return {
    id,
    name,
    levels: { clips: 0.8, sfx: 1, bg: 0.25, ambient: 0.4, master: 1 },
    muted: { clips: false, sfx: false, bg: false, ambient: false },
    clipsBankA: createEmptyBank('clips-a'),
    clipsBankB: createEmptyBank('clips-b'),
    sfxBankA: sfxBankA.map((pad) => ({ ...pad })),
    sfxBankB: createEmptyBank('sfx-b'),
    bgPads: createEmptyBank('bg', 10),
    ambientQuality: 'major',
    ambientPack: 'warm',
    exclusiveClips: true,
    defaultClipFadeOutSec: 3,
    createdAt: now,
    updatedAt: now,
  };
}

export const ambientKeys = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];
