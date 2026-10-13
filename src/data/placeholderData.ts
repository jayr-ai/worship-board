import type { PadAssignment } from '../types';

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
