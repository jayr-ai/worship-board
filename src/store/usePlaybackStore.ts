import { create } from 'zustand';

// Pure "what's currently sounding" state. The audio engine writes to this;
// components only ever read it. Keeps the UI decoupled from audio nodes.
interface PlaybackState {
  activeSfxPadIds: Set<string>;
  activeClipPadIds: Set<string>;
  activeAmbientKey: string | null;
  bgPadId: string | null;
  bgPlaying: boolean;
  bgLooping: boolean;
  audioUnlocked: boolean;
  needsTapToResume: boolean;
  wakeLockUnsupported: boolean;

  setSfxActive: (padId: string, active: boolean) => void;
  setClipActive: (padId: string, active: boolean) => void;
  setAmbientKey: (key: string | null) => void;
  setBackground: (padId: string | null, playing: boolean) => void;
  setBgLooping: (looping: boolean) => void;
  setAudioUnlocked: (unlocked: boolean) => void;
  setNeedsTapToResume: (needs: boolean) => void;
  setWakeLockUnsupported: (unsupported: boolean) => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  activeSfxPadIds: new Set(),
  activeClipPadIds: new Set(),
  activeAmbientKey: null,
  bgPadId: null,
  bgPlaying: false,
  bgLooping: false,
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
  setClipActive: (padId, active) =>
    set((state) => {
      const next = new Set(state.activeClipPadIds);
      if (active) next.add(padId);
      else next.delete(padId);
      return { activeClipPadIds: next };
    }),
  setAmbientKey: (key) => set({ activeAmbientKey: key }),
  setBackground: (padId, playing) => set({ bgPadId: padId, bgPlaying: playing }),
  setBgLooping: (looping) => set({ bgLooping: looping }),
  setAudioUnlocked: (unlocked) => set({ audioUnlocked: unlocked }),
  setNeedsTapToResume: (needs) => set({ needsTapToResume: needs }),
  setWakeLockUnsupported: (unsupported) => set({ wakeLockUnsupported: unsupported }),
}));
