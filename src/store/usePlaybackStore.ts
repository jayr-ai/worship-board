import { create } from 'zustand';

// Pure "what's currently sounding" state. The audio engine writes to this;
// components only ever read it. Keeps the UI decoupled from audio nodes.
interface PlaybackState {
  activeSfxPadIds: Set<string>;
  activeAmbientKey: string | null;
  audioUnlocked: boolean;
  needsTapToResume: boolean;
  wakeLockUnsupported: boolean;

  setSfxActive: (padId: string, active: boolean) => void;
  setAmbientKey: (key: string | null) => void;
  setAudioUnlocked: (unlocked: boolean) => void;
  setNeedsTapToResume: (needs: boolean) => void;
  setWakeLockUnsupported: (unsupported: boolean) => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  activeSfxPadIds: new Set(),
  activeAmbientKey: null,
  audioUnlocked: false,
  needsTapToResume: false,
  wakeLockUnsupported: false,

  setSfxActive: (padId, active) =>
    set((state) => {
      const next = new Set(state.activeSfxPadIds);
      if (active) next.add(padId);
      else next.delete(padId);
      return { activeSfxPadIds: next };
    }),
  setAmbientKey: (key) => set({ activeAmbientKey: key }),
  setAudioUnlocked: (unlocked) => set({ audioUnlocked: unlocked }),
  setNeedsTapToResume: (needs) => set({ needsTapToResume: needs }),
  setWakeLockUnsupported: (unsupported) => set({ wakeLockUnsupported: unsupported }),
}));
