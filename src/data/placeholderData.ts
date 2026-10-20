import type { PadAssignment } from '../types';
import type { SetData } from '../storage/db';

const emptyPad = (id: string): PadAssignment => ({ id, libraryId: null });

export const BANK_SIZE = 15;

export const createEmptyBank = (prefix: string, count = BANK_SIZE): PadAssignment[] =>
  Array.from({ length: count }, (_, i) => emptyPad(`${prefix}-${i}`));

/** Grows a saved bank up to BANK_SIZE instead of crashing when loading a
 * set saved before the 10->15 pads-per-bank feature existed. Already-full
 * banks pass through untouched. */
export const padBankTo = (
  pads: PadAssignment[],
  prefix: string,
  count = BANK_SIZE,
): PadAssignment[] => {
  if (pads.length >= count) return pads;
  const extra = Array.from({ length: count - pads.length }, (_, i) =>
    emptyPad(`${prefix}-${pads.length + i}`),
  );
  return [...pads, ...extra];
};

const demoSfxLabels = ['Clap', 'Air Horn', 'Drum Roll', 'Whoosh', 'Kick', 'Snare'];

export const sfxBankA: PadAssignment[] = Array.from({ length: BANK_SIZE }, (_, i) => {
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
export const bgPads: PadAssignment[] = createEmptyBank('bg', BANK_SIZE);

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

/** One optional custom-audio slot per key (section 4.4's "custom pad
 * pack"); empty by default, meaning "use the built-in synth". */
export const createEmptyAmbientPads = (): PadAssignment[] =>
  ambientKeys.map((key) => emptyPad(key));

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
    bgPads: createEmptyBank('bg', BANK_SIZE),
    ambientPads: createEmptyAmbientPads(),
    ambientQuality: 'major',
    ambientPack: 'warm',
    exclusiveClips: true,
    defaultClipFadeOutSec: 3,
    createdAt: now,
    updatedAt: now,
  };
}
