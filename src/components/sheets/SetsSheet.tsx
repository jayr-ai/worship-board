import { useRef, useState } from 'react';
import './Sheet.css';
import './SetsSheet.css';

interface SetsSheetProps {
  setsIndex: { id: string; name: string }[];
  currentId: string;
  lastBackupAt: number | null;
  onClose: () => void;
  onSwitch: (id: string) => void;
  onCreateNew: (name: string) => void;
  onDuplicate: (id: string, newName: string) => void;
  onRename: (id: string, newName: string) => void;
  onRemove: (id: string) => void;
  onExportSet: (id: string) => void;
  onExportAll: () => void;
  onImport: (file: File) => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(ts: number | null): number | null {
  if (!ts) return null;
  return Math.floor((Date.now() - ts) / DAY_MS);
}

export function SetsSheet({
  setsIndex,
  currentId,
  lastBackupAt,
  onClose,
  onSwitch,
  onCreateNew,
  onDuplicate,
  onRename,
  onRemove,
  onExportSet,
  onExportAll,
  onImport,
}: SetsSheetProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const since = daysSince(lastBackupAt);
  const showReminder = since === null || since >= 30;

  const startRename = (id: string, currentName: string) => {
    setRenamingId(id);
    setDraft(currentName);
  };

  const commitRename = () => {
    if (renamingId && draft.trim()) onRename(renamingId, draft.trim());
    setRenamingId(null);
  };

  const commitNew = () => {
    if (draft.trim()) onCreateNew(draft.trim());
    setCreatingNew(false);
    setDraft('');
  };

  return (
    <div className="sheet-overlay" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet-panel">
        <div className="sheet-header">
          <h2 className="sheet-title">Sets</h2>
          <button type="button" className="sheet-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="sheet-body">
          {showReminder && (
            <div className="sets__reminder">
              {since === null
                ? "You haven't backed up yet."
                : `It's been ${since} days since your last backup.`}{' '}
              Consider exporting a backup before your next service.
            </div>
          )}

          <div className="sets__list">
            {setsIndex.map((s) => (
              <div key={s.id} className={`sets__row ${s.id === currentId ? 'sets__row--current' : ''}`}>
                {renamingId === s.id ? (
                  <input
                    autoFocus
                    className="sheet-text-input sets__rename-input"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => e.key === 'Enter' && commitRename()}
                  />
                ) : (
                  <button type="button" className="sets__name" onClick={() => onSwitch(s.id)}>
                    {s.id === currentId && <span className="sets__current-dot" />}
                    {s.name}
                  </button>
                )}
                <button
                  type="button"
                  className="sets__icon-btn"
                  onClick={() => startRename(s.id, s.name)}
                  aria-label="Rename"
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="sets__icon-btn"
                  onClick={() => onDuplicate(s.id, `${s.name} copy`)}
                  aria-label="Duplicate"
                >
                  ⧉
                </button>
                <button
                  type="button"
                  className="sets__icon-btn"
                  onClick={() => onExportSet(s.id)}
                  aria-label="Export"
                >
                  ⇧
                </button>
                <button
                  type="button"
                  className="sets__icon-btn sets__icon-btn--danger"
                  onClick={() => onRemove(s.id)}
                  disabled={setsIndex.length <= 1}
                  aria-label="Delete"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>

          {creatingNew ? (
            <input
              autoFocus
              className="sheet-text-input"
              value={draft}
              placeholder="Set name"
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitNew}
              onKeyDown={(e) => e.key === 'Enter' && commitNew()}
            />
          ) : (
            <button type="button" className="sets__new-btn" onClick={() => setCreatingNew(true)}>
              + New Set
            </button>
          )}

          <div className="sets__backup-row">
            <button type="button" className="sheet-btn" onClick={() => fileInputRef.current?.click()}>
              Import Set…
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip"
              className="pad-edit__hidden-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) onImport(file);
              }}
            />
            <button type="button" className="sheet-btn sheet-btn--primary" onClick={onExportAll}>
              Backup Everything
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
