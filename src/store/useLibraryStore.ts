import { create } from 'zustand';
import type { ClipMarker, LibraryItem } from '../storage/db';
import { deleteLibraryItem, getAllLibraryItems, putLibraryItem } from '../storage/db';
import { importAudioFiles } from '../storage/importAudio';

interface LibraryState {
  items: LibraryItem[];
  loaded: boolean;
  importErrors: { fileName: string; message: string }[];

  load: () => Promise<void>;
  importFiles: (files: FileList | File[]) => Promise<LibraryItem[]>;
  renameItem: (id: string, label: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  dismissImportErrors: () => void;
  savePeaks: (id: string, peaks: Float32Array) => Promise<void>;
  saveMarkers: (id: string, markers: ClipMarker[]) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  items: [],
  loaded: false,
  importErrors: [],

  load: async () => {
    const items = await getAllLibraryItems();
    set({ items, loaded: true });
  },

  importFiles: async (files) => {
    const { succeeded, failed } = await importAudioFiles(files);
    if (succeeded.length > 0) {
      set((state) => {
        const byId = new Map(state.items.map((item) => [item.id, item]));
        for (const item of succeeded) byId.set(item.id, item);
        return { items: [...byId.values()] };
      });
    }
    if (failed.length > 0) {
      set((state) => ({ importErrors: [...state.importErrors, ...failed] }));
    }
    return succeeded;
  },

  renameItem: async (id, label) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    const updated = { ...item, label };
    await putLibraryItem(updated);
    set((state) => ({ items: state.items.map((i) => (i.id === id ? updated : i)) }));
  },

  deleteItem: async (id) => {
    await deleteLibraryItem(id);
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
  },

  dismissImportErrors: () => set({ importErrors: [] }),

  savePeaks: async (id, peaks) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    const updated = { ...item, peaks: Array.from(peaks) };
    await putLibraryItem(updated);
    set((state) => ({ items: state.items.map((i) => (i.id === id ? updated : i)) }));
  },

  saveMarkers: async (id, markers) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    const updated = { ...item, markers };
    await putLibraryItem(updated);
    set((state) => ({ items: state.items.map((i) => (i.id === id ? updated : i)) }));
  },
}));
