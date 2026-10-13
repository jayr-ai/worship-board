export type Gradient = 'gold' | 'coral' | 'sky' | 'mint' | string;

export type SectionId = 'clips' | 'sfx' | 'bg' | 'ambient';

export type TriggerMode = 'oneshot' | 'hold' | 'loop' | 'toggle';

export type Bank = 'bankA' | 'bankB';

export interface PadAssignment {
  id: string;
  libraryId: string | null;
  label?: string;
  tag?: string;
  startSec?: number;
  endSec?: number;
  fadeOutSec?: number;
  mode?: TriggerMode;
  gradient?: Gradient;
  trimDb?: number;
  durationSec?: number;
}

export interface SetData {
  version: 1;
  id: string;
  name: string;
  levels: { clips: number; sfx: number; bg: number; ambient: number; master: number };
  muted: { clips: boolean; sfx: boolean; bg: boolean; ambient: boolean };
  clips: { bankA: PadAssignment[]; bankB: PadAssignment[] };
  sfx: { bankA: PadAssignment[]; bankB: PadAssignment[] };
  bg: PadAssignment[];
  ambient: { pack: 'warm' | 'airy' | string; quality: 'major' | 'minor' };
}
