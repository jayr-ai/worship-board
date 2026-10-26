import { useState } from 'react';
import type { LibraryFolder } from '../storage/db';
import './FolderChips.css';

interface FolderChipsProps {
  folders: LibraryFolder[];
  selectedFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

/** Shared folder filter/organize row: an "All" chip, one chip per folder,
 * and a "+ Folder" chip that becomes an inline name input - same pattern
 * as SetsSheet's "+ New Set". Used identically in the Library manager and
 * every per-pad "choose from Library" picker. */
export function FolderChips({
  folders,
  selectedFolderId,
  onSelect,
  onCreateFolder,
  onDeleteFolder,
}: FolderChipsProps) {
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState('');

  const commitNew = () => {
    if (draft.trim()) onCreateFolder(draft.trim());
    setCreating(false);
    setDraft('');
  };

  return (
    <div className="folder-chips">
      <button
        type="button"
        className={`folder-chips__chip ${selectedFolderId === null ? 'folder-chips__chip--active' : ''}`}
        onClick={() => onSelect(null)}
      >
        All
      </button>
      {folders.map((folder) => (
        <button
          key={folder.id}
          type="button"
          className={`folder-chips__chip ${selectedFolderId === folder.id ? 'folder-chips__chip--active' : ''}`}
          onClick={() => onSelect(folder.id)}
        >
          {folder.name}
          <span
            className="folder-chips__delete"
            role="button"
            aria-label={`Delete folder ${folder.name}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!window.confirm(`Delete folder "${folder.name}"? Its files will be kept, just unfiled.`)) return;
              if (selectedFolderId === folder.id) onSelect(null);
              onDeleteFolder(folder.id);
            }}
          >
            ✕
          </span>
        </button>
      ))}
      {creating ? (
        <input
          autoFocus
          className="folder-chips__input"
          value={draft}
          placeholder="Folder name"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitNew}
          onKeyDown={(e) => e.key === 'Enter' && commitNew()}
        />
      ) : (
        <button type="button" className="folder-chips__chip folder-chips__chip--add" onClick={() => setCreating(true)}>
          + Folder
        </button>
      )}
    </div>
  );
}
