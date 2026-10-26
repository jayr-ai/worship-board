import { useRef, useState } from 'react';
import type { PadAssignment, TriggerMode } from '../../types';
import type { LibraryItem } from '../../storage/db';
import { PAD_ACCENTS, type PadAccent } from '../Pad';
import { SegmentedControl } from '../SegmentedControl';
import { FolderChips } from '../FolderChips';
import { formatDuration } from '../../utils/formatDuration';
import { useLibraryStore } from '../../store/useLibraryStore';
import './Sheet.css';
import './PadEditSheet.css';

interface PadEditSheetProps {
  pad: PadAssignment;
  sectionLabel: string;
  showModeSelector: boolean;
  showColorPicker?: boolean;
  library: LibraryItem[];
  onClose: () => void;
  onChooseLibraryItem: (item: LibraryItem) => void;
  onImportNew: (file: File) => Promise<LibraryItem | null>;
  onLabelChange: (label: string) => void;
  onGradientChange: (gradient: PadAccent) => void;
  onModeChange: (mode: TriggerMode) => void;
  onTrimChange: (trimDb: number) => void;
  onClear: () => void;
  clearLabel?: string;
}

const MODE_OPTIONS: { value: TriggerMode; label: string }[] = [
  { value: 'oneshot', label: 'One-shot' },
  { value: 'hold', label: 'Hold' },
  { value: 'loop', label: 'Loop' },
  { value: 'toggle', label: 'Toggle' },
];

export function PadEditSheet({
  pad,
  sectionLabel,
  showModeSelector,
  showColorPicker = true,
  library,
  onClose,
  onChooseLibraryItem,
  onImportNew,
  onLabelChange,
  onGradientChange,
  onModeChange,
  onTrimChange,
  onClear,
  clearLabel = 'Clear Pad',
}: PadEditSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const folders = useLibraryStore((s) => s.folders);
  const libraryList = library.filter((i) => selectedFolderId === null || i.folderId === selectedFolderId);

  return (
    <div className="sheet-overlay" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet-panel">
        <div className="sheet-header">
          <h2 className="sheet-title">Edit {sectionLabel} Pad</h2>
          <button type="button" className="sheet-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="sheet-body">
          <div>
            <span className="sheet-field-label">Audio</span>
            {pad.libraryId ? (
              <div className="pad-edit__current">
                {pad.label || 'Untitled'}
                <span className="pad-edit__current-duration">
                  {pad.durationSec ? formatDuration(pad.durationSec) : ''}
                </span>
              </div>
            ) : (
              <div className="pad-edit__current pad-edit__current--empty">Nothing assigned</div>
            )}

            <button
              type="button"
              className="pad-edit__import-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Import New File…
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="pad-edit__hidden-input"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                const item = await onImportNew(file);
                if (item && selectedFolderId) {
                  void useLibraryStore.getState().moveItemToFolder(item.id, selectedFolderId);
                }
              }}
            />

            {library.length > 0 && (
              <>
                <span className="sheet-field-label pad-edit__library-label">
                  Or choose from Library
                </span>
                <FolderChips
                  folders={folders}
                  selectedFolderId={selectedFolderId}
                  onSelect={setSelectedFolderId}
                  onCreateFolder={(name) => void useLibraryStore.getState().createFolder(name)}
                  onDeleteFolder={(id) => void useLibraryStore.getState().deleteFolder(id)}
                />
                <div className="pad-edit__library-list">
                  {libraryList.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`pad-edit__library-item ${
                        pad.libraryId === item.id ? 'pad-edit__library-item--active' : ''
                      }`}
                      onClick={() => onChooseLibraryItem(item)}
                    >
                      <span>{item.label}</span>
                      <span className="pad-edit__library-item-duration">
                        {formatDuration(item.durationSec)}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            <span className="sheet-field-label">Label</span>
            <input
              type="text"
              className="sheet-text-input"
              value={pad.label ?? ''}
              placeholder="Pad label"
              onChange={(e) => onLabelChange(e.target.value)}
            />
          </div>

          {showColorPicker && (
            <div>
              <span className="sheet-field-label">Color</span>
              <div className="pad-edit__swatches">
                {PAD_ACCENTS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`pad-edit__swatch pad-edit__swatch--${color} ${
                      (pad.gradient ?? '') === color ? 'pad-edit__swatch--selected' : ''
                    }`}
                    onClick={() => onGradientChange(color)}
                    aria-label={color}
                  />
                ))}
              </div>
            </div>
          )}

          {showModeSelector && (
            <div>
              <span className="sheet-field-label">Trigger Mode</span>
              <SegmentedControl
                options={MODE_OPTIONS}
                value={pad.mode ?? 'oneshot'}
                onChange={onModeChange}
              />
            </div>
          )}

          <div>
            <span className="sheet-field-label">Volume Trim ({pad.trimDb ?? 0} dB)</span>
            <input
              type="range"
              min={-12}
              max={12}
              step={1}
              value={pad.trimDb ?? 0}
              onChange={(e) => onTrimChange(Number(e.target.value))}
              className="pad-edit__trim-slider"
            />
          </div>
        </div>

        <div className="sheet-footer">
          <button type="button" className="sheet-btn sheet-btn--danger" onClick={onClear}>
            {clearLabel}
          </button>
          <button type="button" className="sheet-btn sheet-btn--primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
