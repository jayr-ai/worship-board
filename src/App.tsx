import { useEffect, useState } from 'react';
import { Stage } from './components/Stage';
import { TopBar } from './components/TopBar';
import { Section } from './components/Section';
import { AmbientSection } from './components/AmbientSection';
import { SegmentedControl } from './components/SegmentedControl';
import { Chip } from './components/Chip';
import { TransportRow } from './components/TransportRow';
import { AudioNotices } from './components/AudioNotices';
import { PadEditSheet } from './components/sheets/PadEditSheet';
import { LibrarySheet } from './components/sheets/LibrarySheet';
import { ClipEditorSheet } from './components/sheets/ClipEditorSheet';
import { SetsSheet } from './components/sheets/SetsSheet';
import { SettingsSheet } from './components/sheets/SettingsSheet';
import { useUIStore } from './store/useUIStore';
import { useToastStore } from './store/useToastStore';
import { ToastStack } from './components/ToastStack';
import { usePlaybackStore } from './store/usePlaybackStore';
import { useSetStore } from './store/useSetStore';
import { useLibraryStore } from './store/useLibraryStore';
import { audioEngine } from './audio/AudioEngine';
import { formatDuration } from './utils/formatDuration';
import { ambientKeys } from './data/placeholderData';
import './App.css';

const DEFAULTS = { clips: 0.8, sfx: 1, bg: 0.25, ambient: 0.4 };
const EMPTY_SET: Set<string> = new Set();

type EditingSection = 'clips' | 'sfx' | 'bg' | null;

const MODE_TAG: Record<string, string> = {
  oneshot: 'ONE-SHOT',
  hold: 'HOLD',
  loop: 'LOOP',
  toggle: 'TOGGLE',
};

function editingKindForPadId(padId: string): 'clips' | 'sfx' | 'bg' | null {
  if (padId.startsWith('clips-')) return 'clips';
  if (padId.startsWith('sfx-')) return 'sfx';
  if (padId.startsWith('bg-')) return 'bg';
  return null;
}

function App() {
  const { banks, locked, pulseAnimation, autoDuckEnabled, duckAmbientToo, lockFadersToo, lastBackupAt } =
    useUIStore();
  const { setBank, toggleLocked, togglePulseAnimation, toggleAutoDuckEnabled, toggleDuckAmbientToo, toggleLockFadersToo } =
    useUIStore();

  const activeSfxPadIds = usePlaybackStore((s) => s.activeSfxPadIds);
  const activeClipPadIds = usePlaybackStore((s) => s.activeClipPadIds);
  const activeAmbientKey = usePlaybackStore((s) => s.activeAmbientKey);
  const activeAmbientDetail = usePlaybackStore((s) => s.activeAmbientDetail);
  const bgPadId = usePlaybackStore((s) => s.bgPadId);
  const bgPlaying = usePlaybackStore((s) => s.bgPlaying);
  const bgLooping = usePlaybackStore((s) => s.bgLooping);

  const {
    current,
    setsIndex,
    updatePad,
    clearPad,
    setLevel,
    toggleMute,
    setAmbientQuality,
    setAmbientPack,
    toggleExclusiveClips,
    cycleDefaultClipFadeOut,
  } = useSetStore();
  const {
    clipsBankA,
    clipsBankB,
    sfxBankA,
    sfxBankB,
    bgPads,
    ambientPads,
    levels,
    muted,
    ambientQuality,
    ambientPack,
    exclusiveClips,
    defaultClipFadeOutSec,
  } = current;

  const library = useLibraryStore();

  const [editingSection, setEditingSection] = useState<EditingSection>(null);
  const [editingPadId, setEditingPadId] = useState<string | null>(null);
  const [ambientEditMode, setAmbientEditMode] = useState(false);
  const [editingAmbientKey, setEditingAmbientKey] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [setsOpen, setSetsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    audioEngine.bindGlobalUnlock();
    void useSetStore.getState().load();
    void useLibraryStore.getState().load();
    void useUIStore.getState().loadPrefs();
    navigator.storage?.persist?.().catch(() => {});
  }, []);

  // Locking mid-edit should back out of edit mode and close config sheets,
  // not leave them open but inert. Driven from the toggle itself rather
  // than an effect on `locked`, since this is a direct response to the
  // user's own action, not a sync with an external system.
  const handleToggleLocked = () => {
    const willLock = !useUIStore.getState().locked;
    toggleLocked();
    if (willLock) {
      setEditingSection(null);
      setEditingPadId(null);
      setAmbientEditMode(false);
      setEditingAmbientKey(null);
      setLibraryOpen(false);
      setSetsOpen(false);
      setSettingsOpen(false);
    }
  };

  const clipsPads = banks.clips === 'bankA' ? clipsBankA : clipsBankB;
  const sfxPads = banks.sfx === 'bankA' ? sfxBankA : sfxBankB;
  const sfxPadsForDisplay = sfxPads.map((pad) => ({
    ...pad,
    tag: pad.libraryId ? MODE_TAG[pad.mode ?? 'oneshot'] : pad.tag,
  }));
  const bgPadsForDisplay = bgPads.map((pad) => ({
    ...pad,
    tag: pad.libraryId ? pad.tag ?? 'ONCE' : pad.tag,
  }));

  const editingKind = editingPadId ? editingKindForPadId(editingPadId) : null;
  const editingPad = editingPadId
    ? [...clipsBankA, ...clipsBankB, ...sfxBankA, ...sfxBankB, ...bgPads].find(
        (p) => p.id === editingPadId,
      )
    : null;

  const customAmbientKeyIds = new Set(ambientPads.filter((p) => p.libraryId).map((p) => p.id));
  const editingAmbientPad = editingAmbientKey
    ? ambientPads.find((p) => p.id === editingAmbientKey)
    : null;

  const closePadEdit = () => setEditingPadId(null);
  const closeAmbientKeyEdit = () => setEditingAmbientKey(null);

  // Shared by the pad edit sheets' "Import New File" buttons: surfaces the
  // real decode error as a toast instead of just doing nothing.
  const importFileForPad = async (file: File) => {
    const errorsBefore = useLibraryStore.getState().importErrors.length;
    const [item] = await useLibraryStore.getState().importFiles([file]);
    const newErrors = useLibraryStore.getState().importErrors.slice(errorsBefore);
    if (newErrors.length > 0) useToastStore.getState().push(newErrors[0].message);
    return item ?? null;
  };

  const handleStopAll = () => void audioEngine.stopAll();
  const handleFadeAll = () => void audioEngine.fadeAll();

  return (
    <Stage>
      <AudioNotices />
      <ToastStack />
      <TopBar
        setName={current.name}
        autoDuck={autoDuckEnabled}
        locked={locked}
        pulseAnimation={pulseAnimation}
        masterValue={levels.master}
        masterDisabled={locked && lockFadersToo}
        onToggleAutoDuck={toggleAutoDuckEnabled}
        onToggleLocked={handleToggleLocked}
        onTogglePulse={togglePulseAnimation}
        onFadeAll={handleFadeAll}
        onStopAll={handleStopAll}
        onMasterChange={(v) => void setLevel('master', v)}
        onOpenSets={() => setSetsOpen(true)}
        onOpenLibrary={() => setLibraryOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="board-row">
        <Section
          number={1}
          title="Song Clips"
          subtitle="Chorus / verse cuts"
          accent="gold"
          glowSection="clips"
          pads={clipsPads}
          activePadIds={activeClipPadIds}
          showProgress
          width={386}
          faderValue={levels.clips}
          faderDefault={DEFAULTS.clips}
          faderMuted={muted.clips}
          faderDisabled={locked && lockFadersToo}
          editMode={editingSection === 'clips'}
          editLocked={locked}
          onToggleEdit={() => setEditingSection(editingSection === 'clips' ? null : 'clips')}
          onPadEdit={(id) => setEditingPadId(id)}
          formatDuration={formatDuration}
          onPadPointerDown={(id) => {
            const pad = clipsPads.find((p) => p.id === id);
            if (pad?.libraryId) void audioEngine.triggerClipDown(pad);
          }}
          onFaderChange={(v) => void setLevel('clips', v)}
          onFaderMuteToggle={() => void toggleMute('clips')}
          footer={
            <>
              <SegmentedControl
                options={[
                  { value: 'bankA', label: 'BANK A' },
                  { value: 'bankB', label: 'BANK B' },
                ]}
                value={banks.clips}
                onChange={(v) => setBank('clips', v)}
              />
              <div className="clips-footer-row">
                <Chip
                  label="FADE OUT"
                  value={`${defaultClipFadeOutSec} sec`}
                  onClick={cycleDefaultClipFadeOut}
                  disabled={locked}
                />
                <button
                  type="button"
                  className={`clips-exclusive-toggle ${exclusiveClips ? 'clips-exclusive-toggle--on' : ''}`}
                  onClick={() => void toggleExclusiveClips()}
                  disabled={locked}
                >
                  EXCLUSIVE {exclusiveClips ? 'ON' : 'OFF'}
                </button>
              </div>
            </>
          }
        />

        <Section
          number={2}
          title="Sound Effects"
          subtitle="Claps, shouts, stings"
          accent="coral"
          glowSection="sfx"
          pads={sfxPadsForDisplay}
          activePadIds={activeSfxPadIds}
          width={386}
          faderValue={levels.sfx}
          faderDefault={DEFAULTS.sfx}
          faderMuted={muted.sfx}
          faderDisabled={locked && lockFadersToo}
          editMode={editingSection === 'sfx'}
          editLocked={locked}
          onToggleEdit={() => setEditingSection(editingSection === 'sfx' ? null : 'sfx')}
          onPadEdit={(id) => setEditingPadId(id)}
          formatDuration={formatDuration}
          onPadPointerDown={(id) => {
            const pad = sfxPads.find((p) => p.id === id);
            if (pad) void audioEngine.triggerSfxDown(pad);
          }}
          onPadPointerUp={(id) => audioEngine.triggerSfxUp(id)}
          onFaderChange={(v) => void setLevel('sfx', v)}
          onFaderMuteToggle={() => void toggleMute('sfx')}
          footer={
            <>
              <SegmentedControl
                options={[
                  { value: 'bankA', label: 'BANK A' },
                  { value: 'bankB', label: 'BANK B' },
                ]}
                value={banks.sfx}
                onChange={(v) => setBank('sfx', v)}
              />
              <Chip label="MODE" value="One-shot" />
            </>
          }
        />

        <Section
          number={3}
          title="Background"
          subtitle="Full songs"
          accent="sky"
          glowSection="bg"
          pads={bgPadsForDisplay}
          activePadIds={bgPadId ? new Set([bgPadId]) : EMPTY_SET}
          showProgress
          width={386}
          faderValue={levels.bg}
          faderDefault={DEFAULTS.bg}
          faderMuted={muted.bg}
          faderDisabled={locked && lockFadersToo}
          editMode={editingSection === 'bg'}
          editLocked={locked}
          onToggleEdit={() => setEditingSection(editingSection === 'bg' ? null : 'bg')}
          onPadEdit={(id) => setEditingPadId(id)}
          formatDuration={formatDuration}
          onPadPointerDown={(id) => {
            const pad = bgPads.find((p) => p.id === id);
            if (pad?.libraryId) void audioEngine.triggerBackgroundPad(pad);
          }}
          onFaderChange={(v) => void setLevel('bg', v)}
          onFaderMuteToggle={() => void toggleMute('bg')}
          footer={
            <>
              <TransportRow
                playing={bgPlaying}
                looping={bgLooping}
                onPlayPause={() => audioEngine.toggleBackgroundPlayPause()}
                onNext={() => void audioEngine.nextBackgroundPad(bgPads)}
                onToggleLoop={() => audioEngine.toggleBackgroundLoop()}
              />
              <Chip label="CROSSFADE" value="4 sec" />
            </>
          }
        />

        <AmbientSection
          keys={ambientKeys}
          quality={ambientQuality}
          pack={ambientPack}
          faderValue={levels.ambient}
          faderDefault={DEFAULTS.ambient}
          faderMuted={muted.ambient}
          faderDisabled={locked && lockFadersToo}
          locked={locked}
          editMode={ambientEditMode}
          onToggleEdit={() => setAmbientEditMode((m) => !m)}
          onKeyEdit={(key) => setEditingAmbientKey(key)}
          customKeyIds={customAmbientKeyIds}
          activeKey={activeAmbientKey}
          activeDetail={activeAmbientDetail}
          onKeyPointerDown={(key) => void audioEngine.playAmbientKey(key)}
          onQualityChange={(q) => void setAmbientQuality(q)}
          onPackToggle={() => {
            const next = ambientPack === 'warm' ? 'airy' : 'warm';
            void setAmbientPack(next);
            audioEngine.setAmbientPack(next);
          }}
          onFaderChange={(v) => void setLevel('ambient', v)}
          onFaderMuteToggle={() => void toggleMute('ambient')}
          onFadeOut={() => audioEngine.fadeOutAmbient()}
        />
      </div>

      {editingPad && editingKind === 'clips' && (
        <ClipEditorSheet
          pad={editingPad}
          library={library.items}
          defaultFadeOutSec={defaultClipFadeOutSec}
          onClose={closePadEdit}
          onAssign={(patch) => void updatePad(editingPad.id, patch)}
          onClear={() => void clearPad(editingPad.id)}
          onImportNew={importFileForPad}
        />
      )}

      {editingPad && (editingKind === 'sfx' || editingKind === 'bg') && (
        <PadEditSheet
          pad={editingPad}
          sectionLabel={editingKind === 'bg' ? 'Background' : 'Sound Effects'}
          showModeSelector={editingKind === 'sfx'}
          library={library.items}
          onClose={closePadEdit}
          onChooseLibraryItem={(item) =>
            void updatePad(editingPad.id, {
              libraryId: item.id,
              label: item.label,
              durationSec: item.durationSec,
            })
          }
          onImportNew={(file) => {
            void (async () => {
              const item = await importFileForPad(file);
              if (item) {
                await updatePad(editingPad.id, {
                  libraryId: item.id,
                  label: item.label,
                  durationSec: item.durationSec,
                });
              }
            })();
          }}
          onLabelChange={(label) => void updatePad(editingPad.id, { label })}
          onGradientChange={(gradient) => void updatePad(editingPad.id, { gradient })}
          onModeChange={(mode) => void updatePad(editingPad.id, { mode })}
          onTrimChange={(trimDb) => void updatePad(editingPad.id, { trimDb })}
          onClear={() => {
            void clearPad(editingPad.id);
            closePadEdit();
          }}
        />
      )}

      {editingAmbientPad && (
        <PadEditSheet
          pad={editingAmbientPad}
          sectionLabel="Ambient"
          showModeSelector={false}
          showColorPicker={false}
          clearLabel="Use Built-in Pad"
          library={library.items}
          onClose={closeAmbientKeyEdit}
          onChooseLibraryItem={(item) =>
            void updatePad(editingAmbientPad.id, {
              libraryId: item.id,
              label: item.label,
              durationSec: item.durationSec,
            })
          }
          onImportNew={(file) => {
            void (async () => {
              const item = await importFileForPad(file);
              if (item) {
                await updatePad(editingAmbientPad.id, {
                  libraryId: item.id,
                  label: item.label,
                  durationSec: item.durationSec,
                });
              }
            })();
          }}
          onLabelChange={(label) => void updatePad(editingAmbientPad.id, { label })}
          onGradientChange={() => {}}
          onModeChange={() => {}}
          onTrimChange={(trimDb) => void updatePad(editingAmbientPad.id, { trimDb })}
          onClear={() => {
            void clearPad(editingAmbientPad.id);
            closeAmbientKeyEdit();
          }}
        />
      )}

      {libraryOpen && (
        <LibrarySheet
          items={library.items}
          importErrors={library.importErrors}
          onClose={() => setLibraryOpen(false)}
          onImport={(files) => void library.importFiles(files)}
          onRename={(id, label) => void library.renameItem(id, label)}
          onDelete={(id) => void library.deleteItem(id)}
          onDismissErrors={library.dismissImportErrors}
        />
      )}

      {setsOpen && (
        <SetsSheet
          setsIndex={setsIndex}
          currentId={current.id}
          lastBackupAt={lastBackupAt}
          onClose={() => setSetsOpen(false)}
          onSwitch={(id) => void useSetStore.getState().switchTo(id)}
          onCreateNew={(name) => void useSetStore.getState().createNew(name)}
          onDuplicate={(id, name) => void useSetStore.getState().duplicate(id, name)}
          onRename={(id, name) => void useSetStore.getState().rename(id, name)}
          onRemove={(id) => void useSetStore.getState().remove(id)}
          onExportSet={(id) =>
            void useSetStore
              .getState()
              .exportSet(id)
              .then(() => useUIStore.getState().noteBackupMade())
          }
          onExportAll={() =>
            void useSetStore
              .getState()
              .exportAll()
              .then(() => useUIStore.getState().noteBackupMade())
          }
          onImport={(file) => void useSetStore.getState().importZip(file)}
        />
      )}

      {settingsOpen && (
        <SettingsSheet
          duckAmbientToo={duckAmbientToo}
          lockFadersToo={lockFadersToo}
          onClose={() => setSettingsOpen(false)}
          onToggleDuckAmbientToo={toggleDuckAmbientToo}
          onToggleLockFadersToo={toggleLockFadersToo}
        />
      )}
    </Stage>
  );
}

export default App;
