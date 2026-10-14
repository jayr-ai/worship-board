import { useEffect, useRef, useState } from 'react';
import type { PadAssignment } from '../../types';
import type { ClipMarker, LibraryItem } from '../../storage/db';
import { useLibraryStore } from '../../store/useLibraryStore';
import { audioEngine } from '../../audio/AudioEngine';
import { formatDuration } from '../../utils/formatDuration';
import './Sheet.css';
import './ClipEditorSheet.css';

const PRESET_MARKERS = ['INTRO', 'VERSE', 'PRE-CHORUS', 'CHORUS', 'BRIDGE', 'TAG', 'OUTRO'];
const MIN_CLIP_SEC = 1;
const MIN_ZOOM = 8;
const MAX_ZOOM = 300;
const WAVEFORM_HEIGHT = 120;

interface ClipEditorSheetProps {
  pad: PadAssignment;
  library: LibraryItem[];
  defaultFadeOutSec: number;
  onClose: () => void;
  onAssign: (patch: Partial<PadAssignment>) => void;
  onClear: () => void;
  onImportNew: (file: File) => Promise<LibraryItem | null>;
}

export function ClipEditorSheet({
  pad,
  library,
  defaultFadeOutSec,
  onClose,
  onAssign,
  onClear,
  onImportNew,
}: ClipEditorSheetProps) {
  const [songId, setSongId] = useState<string | null>(pad.libraryId ?? null);
  const [peaks, setPeaks] = useState<Float32Array | null>(null);
  const [durationSec, setDurationSec] = useState(0);
  const [loading, setLoading] = useState(false);
  const [startSec, setStartSec] = useState(pad.startSec ?? 0);
  const [endSec, setEndSec] = useState(pad.endSec ?? 18);
  const [fadeOutSec, setFadeOutSec] = useState(pad.fadeOutSec ?? defaultFadeOutSec);
  const [label, setLabel] = useState(pad.label ?? '');
  const [markers, setMarkers] = useState<ClipMarker[]>([]);
  const [zoom, setZoom] = useState(20);
  const [auditioning, setAuditioning] = useState(false);
  const [customDraft, setCustomDraft] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<'start' | 'end' | null>(null);

  const song = library.find((i) => i.id === songId) ?? null;

  useEffect(() => {
    if (!songId) return;
    setLoading(true);
    audioEngine.getWaveform(songId).then((result) => {
      if (!result) {
        setLoading(false);
        return;
      }
      setPeaks(result.peaks);
      setDurationSec(result.durationSec);
      if (pad.libraryId !== songId) {
        setStartSec(0);
        setEndSec(Math.min(18, result.durationSec));
      }
      const libItem = library.find((i) => i.id === songId);
      setMarkers(libItem?.markers ?? []);
      setZoom(() => {
        const target = 500;
        return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, target / Math.min(30, result.durationSec)));
      });
      setLoading(false);
    });
    return () => audioEngine.stopAudition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songId]);

  useEffect(() => () => audioEngine.stopAudition(), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks) return;
    const width = Math.max(1, Math.round(durationSec * zoom));
    canvas.width = width;
    canvas.height = WAVEFORM_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, WAVEFORM_HEIGHT);
    ctx.fillStyle = '#78bbff';
    const mid = WAVEFORM_HEIGHT / 2;
    const pxPerBucket = width / peaks.length;
    for (let i = 0; i < peaks.length; i++) {
      const h = Math.max(1, peaks[i] * WAVEFORM_HEIGHT * 0.9);
      ctx.fillRect(i * pxPerBucket, mid - h / 2, Math.max(1, pxPerBucket), h);
    }
  }, [peaks, zoom, durationSec]);

  const secToPx = (sec: number) => sec * zoom;
  const pxToSec = (px: number) => Math.min(durationSec, Math.max(0, px / zoom));

  const handlePointerDown = (which: 'start' | 'end') => (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = which;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !scrollRef.current) return;
    const rect = scrollRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left + scrollRef.current.scrollLeft;
    const sec = pxToSec(px);
    if (dragRef.current === 'start') {
      setStartSec(Math.min(sec, endSec - MIN_CLIP_SEC));
    } else {
      setEndSec(Math.max(sec, startSec + MIN_CLIP_SEC));
    }
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const persistMarkers = (next: ClipMarker[]) => {
    setMarkers(next);
    if (songId) void useLibraryStore.getState().saveMarkers(songId, next);
  };

  const applyMarker = (marker: ClipMarker) => {
    setStartSec(marker.startSec);
    setEndSec(marker.endSec);
    if (song) setLabel(`${song.label} | ${marker.label}`);
  };

  const saveAsMarker = (markerLabel: string) => {
    const existing = markers.find((m) => m.label === markerLabel);
    const next: ClipMarker = existing
      ? { ...existing, startSec, endSec }
      : { id: crypto.randomUUID(), label: markerLabel, startSec, endSec };
    const updated = existing
      ? markers.map((m) => (m.id === existing.id ? next : m))
      : [...markers, next];
    persistMarkers(updated);
    if (song) setLabel(`${song.label} | ${markerLabel}`);
  };

  const deleteMarker = (id: string) => {
    persistMarkers(markers.filter((m) => m.id !== id));
  };

  const toggleAudition = () => {
    if (auditioning) {
      audioEngine.stopAudition();
      setAuditioning(false);
      return;
    }
    if (!songId) return;
    void audioEngine.auditionClip(songId, startSec, endSec, fadeOutSec);
    setAuditioning(true);
    window.setTimeout(
      () => setAuditioning(false),
      Math.max(0, (endSec - startSec) * 1000),
    );
  };

  const handleAssign = () => {
    if (!songId || !song) return;
    audioEngine.stopAudition();
    onAssign({
      libraryId: songId,
      startSec,
      endSec,
      durationSec: endSec - startSec,
      fadeOutSec,
      label: label || song.label,
    });
    onClose();
  };

  // ---- Step 1: choose a song --------------------------------------------
  if (!songId) {
    return (
      <div className="sheet-overlay" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="sheet-panel">
          <div className="sheet-header">
            <h2 className="sheet-title">Choose a Song</h2>
            <button type="button" className="sheet-close" onClick={onClose}>
              ✕
            </button>
          </div>
          <div className="sheet-body">
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
                if (item) setSongId(item.id);
              }}
            />
            {library.length > 0 && (
              <div className="pad-edit__library-list clip-editor__song-list">
                {library.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="pad-edit__library-item"
                    onClick={() => setSongId(item.id)}
                  >
                    <span>{item.label}</span>
                    <span className="pad-edit__library-item-duration">
                      {formatDuration(item.durationSec)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---- Step 2: clip editor -----------------------------------------------
  return (
    <div className="sheet-overlay sheet-overlay--fullscreen">
      <div className="sheet-panel clip-editor">
        <div className="sheet-header">
          <h2 className="sheet-title">{song?.label ?? 'Clip Editor'}</h2>
          <button type="button" className="sheet-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="sheet-body clip-editor__body">
          {loading && <p className="clip-editor__loading">Loading waveform…</p>}

          {!loading && peaks && (
            <>
              <div className="clip-editor__zoom-row">
                <span className="clip-editor__duration-readout">
                  {(endSec - startSec).toFixed(1)}s selected
                </span>
                <div className="clip-editor__zoom-controls">
                  <button type="button" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.5))}>
                    −
                  </button>
                  <span>Zoom</span>
                  <button type="button" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.5))}>
                    +
                  </button>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="clip-editor__scroll"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                <div
                  className="clip-editor__waveform-wrap"
                  style={{ width: secToPx(durationSec) }}
                >
                  <canvas ref={canvasRef} className="clip-editor__canvas" />

                  <div
                    className="clip-editor__selection"
                    style={{
                      left: secToPx(startSec),
                      width: secToPx(endSec) - secToPx(startSec),
                    }}
                  />

                  {markers.map((m) => (
                    <div
                      key={m.id}
                      className="clip-editor__marker-flag"
                      style={{ left: secToPx(m.startSec) }}
                      title={m.label}
                    />
                  ))}

                  <div
                    className="clip-editor__handle clip-editor__handle--start"
                    style={{ left: secToPx(startSec) }}
                    onPointerDown={handlePointerDown('start')}
                  />
                  <div
                    className="clip-editor__handle clip-editor__handle--end"
                    style={{ left: secToPx(endSec) }}
                    onPointerDown={handlePointerDown('end')}
                  />
                </div>
              </div>

              <div className="clip-editor__markers-row">
                {PRESET_MARKERS.map((name) => {
                  const existing = markers.find((m) => m.label === name);
                  return (
                    <button
                      key={name}
                      type="button"
                      className={`clip-editor__marker-chip ${existing ? 'clip-editor__marker-chip--saved' : ''}`}
                      onClick={() => (existing ? applyMarker(existing) : saveAsMarker(name))}
                    >
                      {name}
                    </button>
                  );
                })}
                {markers
                  .filter((m) => !PRESET_MARKERS.includes(m.label))
                  .map((m) => (
                    <span key={m.id} className="clip-editor__marker-chip clip-editor__marker-chip--saved">
                      <button type="button" onClick={() => applyMarker(m)}>
                        {m.label}
                      </button>
                      <button
                        type="button"
                        className="clip-editor__marker-delete"
                        onClick={() => deleteMarker(m.id)}
                        aria-label={`Delete ${m.label}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                {customDraft === null ? (
                  <button
                    type="button"
                    className="clip-editor__marker-chip clip-editor__marker-chip--add"
                    onClick={() => setCustomDraft('')}
                  >
                    + Custom
                  </button>
                ) : (
                  <input
                    autoFocus
                    className="clip-editor__custom-input"
                    value={customDraft}
                    placeholder="Marker name"
                    onChange={(e) => setCustomDraft(e.target.value)}
                    onBlur={() => {
                      if (customDraft.trim()) saveAsMarker(customDraft.trim().toUpperCase());
                      setCustomDraft(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                  />
                )}
              </div>

              <div className="clip-editor__controls-row">
                <button type="button" className="clip-editor__audition-btn" onClick={toggleAudition}>
                  {auditioning ? '■ Stop' : '▶ Audition'}
                </button>
                <div className="clip-editor__fadeout-control">
                  <span className="sheet-field-label">Fade Out ({fadeOutSec.toFixed(1)}s)</span>
                  <input
                    type="range"
                    min={0.5}
                    max={8}
                    step={0.5}
                    value={fadeOutSec}
                    onChange={(e) => setFadeOutSec(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <span className="sheet-field-label">Label</span>
                <input
                  type="text"
                  className="sheet-text-input"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Song | Section"
                />
              </div>
            </>
          )}
        </div>

        <div className="sheet-footer">
          {pad.libraryId && (
            <button
              type="button"
              className="sheet-btn sheet-btn--danger"
              onClick={() => {
                onClear();
                onClose();
              }}
            >
              Clear Pad
            </button>
          )}
          <button type="button" className="sheet-btn" onClick={() => setSongId(null)}>
            Change Song
          </button>
          <button
            type="button"
            className="sheet-btn sheet-btn--primary"
            disabled={loading || !peaks}
            onClick={handleAssign}
          >
            Assign to Pad
          </button>
        </div>
      </div>
    </div>
  );
}
