import { create } from 'zustand';
import type { PadAssignment } from '../types';
import { getAllAssignments, putAssignment, putAssignments } from '../storage/db';
import { sfxBankA as demoSfxBankA, sfxBankB as demoSfxBankB, bgPads as demoBgPads } from '../data/placeholderData';

type ArrayKey = 'sfxBankA' | 'sfxBankB' | 'bgPads';

function arrayKeyForPadId(padId: string): ArrayKey | null {
  if (padId.startsWith('sfx-a-')) return 'sfxBankA';
  if (padId.startsWith('sfx-b-')) return 'sfxBankB';
  if (padId.startsWith('bg-')) return 'bgPads';
  return null;
}

interface AssignmentsState {
  sfxBankA: PadAssignment[];
  sfxBankB: PadAssignment[];
  bgPads: PadAssignment[];
  loaded: boolean;

  load: () => Promise<void>;
  updatePad: (padId: string, patch: Partial<PadAssignment>) => Promise<void>;
  clearPad: (padId: string) => Promise<void>;
}

const emptyLike = (pad: PadAssignment): PadAssignment => ({ id: pad.id, libraryId: null });

export const useAssignmentsStore = create<AssignmentsState>((set, get) => ({
  sfxBankA: demoSfxBankA,
  sfxBankB: demoSfxBankB,
  bgPads: demoBgPads,
  loaded: false,

  load: async () => {
    const stored = await getAllAssignments();
    if (stored.length === 0) {
      // First run: seed persistence with the section 9 demo layout so it's
      // stable across restarts instead of being silently re-derived.
      await putAssignments([...demoSfxBankA, ...demoSfxBankB, ...demoBgPads]);
      set({ loaded: true });
      return;
    }

    const byId = new Map(stored.map((pad) => [pad.id, pad]));
    const merge = (defaults: PadAssignment[]) =>
      defaults.map((pad) => byId.get(pad.id) ?? pad);

    set({
      sfxBankA: merge(demoSfxBankA),
      sfxBankB: merge(demoSfxBankB),
      bgPads: merge(demoBgPads),
      loaded: true,
    });
  },

  updatePad: async (padId, patch) => {
    const key = arrayKeyForPadId(padId);
    if (!key) return;
    const current = get()[key].find((p) => p.id === padId);
    if (!current) return;
    const updated = { ...current, ...patch };
    await putAssignment(updated);
    set({ [key]: get()[key].map((p) => (p.id === padId ? updated : p)) } as Pick<
      AssignmentsState,
      ArrayKey
    >);
  },

  clearPad: async (padId) => {
    const key = arrayKeyForPadId(padId);
    if (!key) return;
    const current = get()[key].find((p) => p.id === padId);
    if (!current) return;
    const cleared = emptyLike(current);
    await putAssignment(cleared);
    set({ [key]: get()[key].map((p) => (p.id === padId ? cleared : p)) } as Pick<
      AssignmentsState,
      ArrayKey
    >);
  },
}));
