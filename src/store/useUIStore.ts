import { create } from 'zustand';
import type { Bank, SectionId } from '../types';

interface UIState {
  levels: { clips: number; sfx: number; bg: number; ambient: number; master: number };
  muted: { clips: boolean; sfx: boolean; bg: boolean; ambient: boolean };
  banks: { clips: Bank; sfx: Bank };
  ambientQuality: 'major' | 'minor';
  ambientPack: 'warm' | 'airy';
  autoDuck: boolean;
  locked: boolean;
  // Song Clips and Background don't have real audio yet (Phase 3/4 import).
  // This fakes a "sounding" pad for their visual states in the meantime.
  // Sound Effects and Ambient are driven by the real engine (usePlaybackStore).
  demoActivePad: Partial<Record<SectionId, string | null>>;

  setLevel: (section: keyof UIState['levels'], value: number) => void;
  toggleMute: (section: keyof UIState['muted']) => void;
  setBank: (section: 'clips' | 'sfx', bank: Bank) => void;
  setAmbientQuality: (quality: 'major' | 'minor') => void;
  setAmbientPack: (pack: 'warm' | 'airy') => void;
  toggleAutoDuck: () => void;
  toggleLocked: () => void;
  setDemoActivePad: (section: SectionId, padId: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  levels: { clips: 0.8, sfx: 1, bg: 0.25, ambient: 0.4, master: 1 },
  muted: { clips: false, sfx: false, bg: false, ambient: false },
  banks: { clips: 'bankA', sfx: 'bankA' },
  ambientQuality: 'major',
  ambientPack: 'warm',
  autoDuck: true,
  locked: false,
  demoActivePad: {},

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
  setDemoActivePad: (section, padId) =>
    set((state) => ({ demoActivePad: { ...state.demoActivePad, [section]: padId } })),
}));
