import { create } from 'zustand';
import type { Bank } from '../types';

const FADE_OUT_PRESETS = [2, 3, 4, 5];

interface UIState {
  levels: { clips: number; sfx: number; bg: number; ambient: number; master: number };
  muted: { clips: boolean; sfx: boolean; bg: boolean; ambient: boolean };
  banks: { clips: Bank; sfx: Bank };
  ambientQuality: 'major' | 'minor';
  ambientPack: 'warm' | 'airy';
  autoDuck: boolean;
  locked: boolean;
  exclusiveClips: boolean;
  defaultClipFadeOutSec: number;
  pulseAnimation: boolean;

  setLevel: (section: keyof UIState['levels'], value: number) => void;
  toggleMute: (section: keyof UIState['muted']) => void;
  setBank: (section: 'clips' | 'sfx', bank: Bank) => void;
  setAmbientQuality: (quality: 'major' | 'minor') => void;
  setAmbientPack: (pack: 'warm' | 'airy') => void;
  toggleAutoDuck: () => void;
  toggleLocked: () => void;
  toggleExclusiveClips: () => void;
  cycleDefaultClipFadeOut: () => void;
  togglePulseAnimation: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  levels: { clips: 0.8, sfx: 1, bg: 0.25, ambient: 0.4, master: 1 },
  muted: { clips: false, sfx: false, bg: false, ambient: false },
  banks: { clips: 'bankA', sfx: 'bankA' },
  ambientQuality: 'major',
  ambientPack: 'warm',
  autoDuck: true,
  locked: false,
  exclusiveClips: true,
  defaultClipFadeOutSec: 3,
  pulseAnimation: true,

  setLevel: (section, value) =>
    set((state) => ({ levels: { ...state.levels, [section]: value } })),
  toggleMute: (section) =>
    set((state) => ({ muted: { ...state.muted, [section]: !state.muted[section] } })),
  setBank: (section, bank) =>
    set((state) => ({ banks: { ...state.banks, [section]: bank } })),
  setAmbientQuality: (quality) => set({ ambientQuality: quality }),
  setAmbientPack: (pack) => set({ ambientPack: pack }),
  toggleAutoDuck: () => set((state) => ({ autoDuck: !state.autoDuck })),
  toggleLocked: () => set((state) => ({ locked: !state.locked })),
  toggleExclusiveClips: () => set((state) => ({ exclusiveClips: !state.exclusiveClips })),
  cycleDefaultClipFadeOut: () =>
    set((state) => {
      const idx = FADE_OUT_PRESETS.indexOf(state.defaultClipFadeOutSec);
      const next = FADE_OUT_PRESETS[(idx + 1) % FADE_OUT_PRESETS.length];
      return { defaultClipFadeOutSec: next };
    }),
  togglePulseAnimation: () => set((state) => ({ pulseAnimation: !state.pulseAnimation })),
}));
