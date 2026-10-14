import { create } from 'zustand';
import type { PadAssignment } from '../types';
import type { SetData } from '../storage/db';
import { deleteSet, getAllSets, getAppSetting, putAppSetting, putSet } from '../storage/db';
import { createDefaultSetData } from '../data/placeholderData';
import { buildBackupZip, restoreBackupZip, shareOrDownloadZip } from '../storage/backup';
import { useLibraryStore } from './useLibraryStore';

type ArrayKey = 'clipsBankA' | 'clipsBankB' | 'sfxBankA' | 'sfxBankB' | 'bgPads';

function arrayKeyForPadId(padId: string): ArrayKey | null {
  if (padId.startsWith('clips-a-')) return 'clipsBankA';
  if (padId.startsWith('clips-b-')) return 'clipsBankB';
  if (padId.startsWith('sfx-a-')) return 'sfxBankA';
  if (padId.startsWith('sfx-b-')) return 'sfxBankB';
  if (padId.startsWith('bg-')) return 'bgPads';
  return null;
}

const emptyLike = (pad: PadAssignment): PadAssignment => ({ id: pad.id, libraryId: null });

interface SetState {
  setsIndex: { id: string; name: string }[];
  current: SetData;
  loaded: boolean;

  load: () => Promise<void>;
  switchTo: (id: string) => Promise<void>;
  createNew: (name: string) => Promise<void>;
  duplicate: (id: string, newName: string) => Promise<void>;
  rename: (id: string, newName: string) => Promise<void>;
  remove: (id: string) => Promise<void>;

  updatePad: (padId: string, patch: Partial<PadAssignment>) => Promise<void>;
  clearPad: (padId: string) => Promise<void>;
  setLevel: (section: keyof SetData['levels'], value: number) => Promise<void>;
  toggleMute: (section: keyof SetData['muted']) => Promise<void>;
  setAmbientQuality: (quality: SetData['ambientQuality']) => Promise<void>;
  setAmbientPack: (pack: SetData['ambientPack']) => Promise<void>;
  toggleExclusiveClips: () => Promise<void>;
  cycleDefaultClipFadeOut: () => Promise<void>;

  exportCurrent: () => Promise<void>;
  exportSet: (id: string) => Promise<void>;
  exportAll: () => Promise<void>;
  importZip: (file: File) => Promise<{ importedCount: number }>;
}

const FADE_OUT_PRESETS = [2, 3, 4, 5];

async function persist(set: SetData): Promise<void> {
  await putSet({ ...set, updatedAt: Date.now() });
}

export const useSetStore = create<SetState>((set, get) => ({
  setsIndex: [],
  current: createDefaultSetData('default-sunday-service', 'Sunday Service'),
  loaded: false,

  load: async () => {
    let all = await getAllSets();
    if (all.length === 0) {
      const seeded = createDefaultSetData('default-sunday-service', 'Sunday Service');
      await putSet(seeded);
      all = [seeded];
    }

    const currentId = (await getAppSetting<string>('currentSetId')) ?? all[0].id;
    const current = all.find((s) => s.id === currentId) ?? all[0];

    set({
      setsIndex: all.map((s) => ({ id: s.id, name: s.name })),
      current,
      loaded: true,
    });
  },

  switchTo: async (id) => {
    const all = await getAllSets();
    const target = all.find((s) => s.id === id);
    if (!target) return;
    await putAppSetting('currentSetId', id);
    set({ current: target });
  },

  createNew: async (name) => {
    const newSet = createDefaultSetData(crypto.randomUUID(), name);
    await putSet(newSet);
    await putAppSetting('currentSetId', newSet.id);
    set((state) => ({
      setsIndex: [...state.setsIndex, { id: newSet.id, name: newSet.name }],
      current: newSet,
    }));
  },

  duplicate: async (id, newName) => {
    const all = await getAllSets();
    const source = all.find((s) => s.id === id);
    if (!source) return;
    const now = Date.now();
    const copy: SetData = { ...source, id: crypto.randomUUID(), name: newName, createdAt: now, updatedAt: now };
    await putSet(copy);
    set((state) => ({ setsIndex: [...state.setsIndex, { id: copy.id, name: copy.name }] }));
  },

  rename: async (id, newName) => {
    const all = await getAllSets();
    const target = all.find((s) => s.id === id);
    if (!target) return;
    const renamed = { ...target, name: newName, updatedAt: Date.now() };
    await putSet(renamed);
    set((state) => ({
      setsIndex: state.setsIndex.map((s) => (s.id === id ? { ...s, name: newName } : s)),
      current: state.current.id === id ? renamed : state.current,
    }));
  },

  remove: async (id) => {
    const state = get();
    if (state.setsIndex.length <= 1) return; // always keep at least one set
    await deleteSet(id);
    const remaining = state.setsIndex.filter((s) => s.id !== id);
    if (state.current.id === id) {
      const all = await getAllSets();
      const next = all.find((s) => s.id === remaining[0].id)!;
      await putAppSetting('currentSetId', next.id);
      set({ setsIndex: remaining, current: next });
    } else {
      set({ setsIndex: remaining });
    }
  },

  updatePad: async (padId, patch) => {
    const key = arrayKeyForPadId(padId);
    if (!key) return;
    const current = get().current;
    const pad = current[key].find((p) => p.id === padId);
    if (!pad) return;
    const updated = { ...current, [key]: current[key].map((p) => (p.id === padId ? { ...p, ...patch } : p)) };
    await persist(updated);
    set({ current: updated });
  },

  clearPad: async (padId) => {
    const key = arrayKeyForPadId(padId);
    if (!key) return;
    const current = get().current;
    const pad = current[key].find((p) => p.id === padId);
    if (!pad) return;
    const updated = {
      ...current,
      [key]: current[key].map((p) => (p.id === padId ? emptyLike(p) : p)),
    };
    await persist(updated);
    set({ current: updated });
  },

  setLevel: async (section, value) => {
    const updated = { ...get().current, levels: { ...get().current.levels, [section]: value } };
    await persist(updated);
    set({ current: updated });
  },

  toggleMute: async (section) => {
    const current = get().current;
    const updated = { ...current, muted: { ...current.muted, [section]: !current.muted[section] } };
    await persist(updated);
    set({ current: updated });
  },

  setAmbientQuality: async (quality) => {
    const updated = { ...get().current, ambientQuality: quality };
    await persist(updated);
    set({ current: updated });
  },

  setAmbientPack: async (pack) => {
    const updated = { ...get().current, ambientPack: pack };
    await persist(updated);
    set({ current: updated });
  },

  toggleExclusiveClips: async () => {
    const updated = { ...get().current, exclusiveClips: !get().current.exclusiveClips };
    await persist(updated);
    set({ current: updated });
  },

  cycleDefaultClipFadeOut: async () => {
    const current = get().current;
    const idx = FADE_OUT_PRESETS.indexOf(current.defaultClipFadeOutSec);
    const next = FADE_OUT_PRESETS[(idx + 1) % FADE_OUT_PRESETS.length];
    const updated = { ...current, defaultClipFadeOutSec: next };
    await persist(updated);
    set({ current: updated });
  },

  exportCurrent: async () => {
    await get().exportSet(get().current.id);
  },

  exportSet: async (id) => {
    const all = await getAllSets();
    const target = all.find((s) => s.id === id);
    if (!target) return;
    const library = useLibraryStore.getState().items;
    const blob = await buildBackupZip([target], library);
    await shareOrDownloadZip(blob, `${target.name.replace(/[^a-z0-9]+/gi, '-')}.worshipboard.zip`);
  },

  exportAll: async () => {
    const all = await getAllSets();
    const library = useLibraryStore.getState().items;
    const blob = await buildBackupZip(all, library);
    await shareOrDownloadZip(blob, 'worship-board-backup.zip');
  },

  importZip: async (file) => {
    const existingNames = new Set(get().setsIndex.map((s) => s.name));
    const { importedSets } = await restoreBackupZip(file, existingNames);
    await useLibraryStore.getState().load();
    if (importedSets.length === 0) return { importedCount: 0 };

    const first = importedSets[0];
    await putAppSetting('currentSetId', first.id);
    set((state) => ({
      setsIndex: [...state.setsIndex, ...importedSets.map((s) => ({ id: s.id, name: s.name }))],
      current: first,
    }));
    return { importedCount: importedSets.length };
  },
}));
