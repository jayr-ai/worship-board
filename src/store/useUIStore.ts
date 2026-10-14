import { create } from 'zustand';
import type { Bank } from '../types';
import { getAppSetting, putAppSetting, type AppPrefs } from '../storage/db';

const DEFAULT_PREFS: AppPrefs = {
  pulseAnimation: true,
  autoDuckEnabled: true,
  duckAmbientToo: false,
  lockFadersToo: false,
  lastBackupAt: null,
};

interface UIState {
  // View-only state: which bank is currently displayed. Not part of a Set.
  banks: { clips: Bank; sfx: Bank };
  // Session-only: never persisted, always starts unlocked.
  locked: boolean;
  // Global app preferences (not per-set), persisted in appSettings.
  pulseAnimation: boolean;
  autoDuckEnabled: boolean;
  duckAmbientToo: boolean;
  lockFadersToo: boolean;
  lastBackupAt: number | null;
  prefsLoaded: boolean;

  setBank: (section: 'clips' | 'sfx', bank: Bank) => void;
  toggleLocked: () => void;
  loadPrefs: () => Promise<void>;
  togglePulseAnimation: () => void;
  toggleAutoDuckEnabled: () => void;
  toggleDuckAmbientToo: () => void;
  toggleLockFadersToo: () => void;
  noteBackupMade: () => void;
}

function persistPrefs(state: UIState): void {
  const prefs: AppPrefs = {
    pulseAnimation: state.pulseAnimation,
    autoDuckEnabled: state.autoDuckEnabled,
    duckAmbientToo: state.duckAmbientToo,
    lockFadersToo: state.lockFadersToo,
    lastBackupAt: state.lastBackupAt,
  };
  void putAppSetting('prefs', prefs);
}

export const useUIStore = create<UIState>((set, get) => ({
  banks: { clips: 'bankA', sfx: 'bankA' },
  locked: false,
  ...DEFAULT_PREFS,
  prefsLoaded: false,

  setBank: (section, bank) =>
    set((state) => ({ banks: { ...state.banks, [section]: bank } })),
  toggleLocked: () => set((state) => ({ locked: !state.locked })),

  loadPrefs: async () => {
    const stored = await getAppSetting<AppPrefs>('prefs');
    set({ ...DEFAULT_PREFS, ...stored, prefsLoaded: true });
  },

  togglePulseAnimation: () => {
    set((state) => ({ pulseAnimation: !state.pulseAnimation }));
    persistPrefs(get());
  },
  toggleAutoDuckEnabled: () => {
    set((state) => ({ autoDuckEnabled: !state.autoDuckEnabled }));
    persistPrefs(get());
  },
  toggleDuckAmbientToo: () => {
    set((state) => ({ duckAmbientToo: !state.duckAmbientToo }));
    persistPrefs(get());
  },
  toggleLockFadersToo: () => {
    set((state) => ({ lockFadersToo: !state.lockFadersToo }));
    persistPrefs(get());
  },
  noteBackupMade: () => {
    set({ lastBackupAt: Date.now() });
    persistPrefs(get());
  },
}));
