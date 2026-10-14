import { useRef, useState } from 'react';
import type { LibraryItem } from '../../storage/db';
import { formatDuration } from '../../utils/formatDuration';
import './Sheet.css';
import './LibrarySheet.css';

interface LibrarySheetProps {
  items: LibraryItem[];
  importErrors: { fileName: string; message: string }[];
  onClose: () => void;
  onImport: (files: FileList) => void;
  onRename: (id: string, label: string) => void;
  onDelete: (id: string) => void;
  onDismissErrors: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LibrarySheet({
  items,
  importErrors,
  onClose,
  onImport,
  onRename,
  onDelete,
  onDismissErrors,
}: LibrarySheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState('');

  const totalBytes = items.reduce((sum, item) => sum + item.blob.size, 0);

  const startRename = (item: LibraryItem) => {
    setRenamingId(item.id);
    setDraftLabel(item.label);
  };

  const commitRename = () => {
    if (renamingId) onRename(renamingId, draftLabel.trim() || 'Untitled');
    setRenamingId(null);
  };

  return (
    <div className="sheet-overlay" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet-panel">
        <div className="sheet-header">
          <h2 className="sheet-title">Library</h2>
          <button type="button" className="sheet-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="sheet-body">
          <div className="library__summary">
            <span>
              {items.length} file{items.length === 1 ? '' : 's'} · {formatBytes(totalBytes)}
            </span>
            <button
              type="button"
              className="library__import-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Import Files…
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              className="pad-edit__hidden-input"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) onImport(e.target.files);
                e.target.value = '';
              }}
            />
          </div>

          {importErrors.length > 0 && (
            <div className="library__errors">
              {importErrors.map((err, i) => (
                <div key={i} className="library__error">
                  {err.fileName}: {err.message}
                </div>
              ))}
              <button type="button" className="library__dismiss" onClick={onDismissErrors}>
                Dismiss
              </button>
            </div>
          )}

          <div className="library__list">
            {items.length === 0 && (
              <p className="library__empty">No files imported yet.</p>
            )}
            {items.map((item) => (
              <div key={item.id} className="library__row">
                {renamingId === item.id ? (
                  <input
                    autoFocus
                    className="sheet-text-input library__rename-input"
                    value={draftLabel}
                    onChange={(e) => setDraftLabel(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => e.key === 'Enter' && commitRename()}
                  />
                ) : (
                  <button
                    type="button"
                    className="library__label"
                    onClick={() => startRename(item)}
                  >
                    {item.label}
                  </button>
                )}
                <span className="library__duration">{formatDuration(item.durationSec)}</span>
                <span className="library__size">{formatBytes(item.blob.size)}</span>
                <button
                  type="button"
                  className="library__delete"
                  onClick={() => onDelete(item.id)}
                  aria-label="Delete"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
