import { create } from 'zustand';
import type { Bank, SectionId } from '../types';

interface UIState {
  levels: { clips: number; sfx: number; bg: number; ambient: number; master: number };
  muted: { clips: boolean; sfx: boolean; bg: boolean; ambient: boolean };
  banks: { clips: Bank; sfx: Bank };
  ambientQuality: 'major' | 'minor';
  autoDuck: boolean;
  locked: boolean;
  // Phase 1 only: fake "sounding" pad per section, for visual states.
  // Replaced by the real audio engine's playback state in Phase 2.
  demoActivePad: Partial<Record<SectionId, string | null>>;

  setLevel: (section: keyof UIState['levels'], value: number) => void;
  toggleMute: (section: keyof UIState['muted']) => void;
  setBank: (section: 'clips' | 'sfx', bank: Bank) => void;
  setAmbientQuality: (quality: 'major' | 'minor') => void;
  toggleAutoDuck: () => void;
  toggleLocked: () => void;
  setDemoActivePad: (section: SectionId, padId: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  levels: { clips: 0.8, sfx: 1, bg: 0.25, ambient: 0.4, master: 1 },
  muted: { clips: false, sfx: false, bg: false, ambient: false },
  banks: { clips: 'bankA', sfx: 'bankA' },
  ambientQuality: 'major',
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
  toggleAutoDuck: () => set((state) => ({ autoDuck: !state.autoDuck })),
  toggleLocked: () => set((state) => ({ locked: !state.locked })),
  setDemoActivePad: (section, padId) =>
    set((state) => ({ demoActivePad: { ...state.demoActivePad, [section]: padId } })),
}));
