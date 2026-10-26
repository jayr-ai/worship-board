import { create } from 'zustand';
import type { ClipMarker, LibraryFolder, LibraryItem } from '../storage/db';
import {
  deleteFolder as deleteFolderRecord,
  deleteLibraryItem,
  getAllFolders,
  getAllLibraryItems,
  putFolder,
  putLibraryItem,
} from '../storage/db';
import { importAudioFiles } from '../storage/importAudio';

interface LibraryState {
  items: LibraryItem[];
  folders: LibraryFolder[];
  loaded: boolean;
  importErrors: { fileName: string; message: string }[];

  load: () => Promise<void>;
  importFiles: (files: FileList | File[]) => Promise<LibraryItem[]>;
  renameItem: (id: string, label: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  dismissImportErrors: () => void;
  savePeaks: (id: string, peaks: Float32Array) => Promise<void>;
  saveMarkers: (id: string, markers: ClipMarker[]) => Promise<void>;
  createFolder: (name: string) => Promise<LibraryFolder>;
  deleteFolder: (id: string) => Promise<void>;
  moveItemToFolder: (itemId: string, folderId: string | null) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  items: [],
  folders: [],
  loaded: false,
  importErrors: [],

  load: async () => {
    const [items, folders] = await Promise.all([getAllLibraryItems(), getAllFolders()]);
    set({ items, folders, loaded: true });
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

  createFolder: async (name) => {
    const folder: LibraryFolder = {
      id: crypto.randomUUID(),
      name: name.trim() || 'Untitled Folder',
      createdAt: Date.now(),
    };
    await putFolder(folder);
    set((state) => ({ folders: [...state.folders, folder] }));
    return folder;
  },

  deleteFolder: async (id) => {
    // Un-file its items rather than deleting them - the folder is just an
    // organizational label, not a container the files live inside.
    const filedItems = get().items.filter((i) => i.folderId === id);
    await Promise.all(filedItems.map((i) => putLibraryItem({ ...i, folderId: null })));
    await deleteFolderRecord(id);
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== id),
      items: state.items.map((i) => (i.folderId === id ? { ...i, folderId: null } : i)),
    }));
  },

  moveItemToFolder: async (itemId, folderId) => {
    const item = get().items.find((i) => i.id === itemId);
    if (!item) return;
    const updated = { ...item, folderId };
    await putLibraryItem(updated);
    set((state) => ({ items: state.items.map((i) => (i.id === itemId ? updated : i)) }));
  },
}));
