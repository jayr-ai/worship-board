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
import { useUIStore } from './store/useUIStore';
import { usePlaybackStore } from './store/usePlaybackStore';
import { useAssignmentsStore } from './store/useAssignmentsStore';
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
  const {
    levels,
    muted,
    banks,
    ambientQuality,
    ambientPack,
    autoDuck,
    locked,
    exclusiveClips,
    defaultClipFadeOutSec,
    pulseAnimation,
    setLevel,
    toggleMute,
    setBank,
    setAmbientQuality,
    setAmbientPack,
    toggleAutoDuck,
    toggleLocked,
    toggleExclusiveClips,
    cycleDefaultClipFadeOut,
    togglePulseAnimation,
  } = useUIStore();

  const activeSfxPadIds = usePlaybackStore((s) => s.activeSfxPadIds);
  const activeClipPadIds = usePlaybackStore((s) => s.activeClipPadIds);
  const bgPadId = usePlaybackStore((s) => s.bgPadId);
  const bgPlaying = usePlaybackStore((s) => s.bgPlaying);
  const bgLooping = usePlaybackStore((s) => s.bgLooping);

  const { clipsBankA, clipsBankB, sfxBankA, sfxBankB, bgPads, updatePad, clearPad } =
    useAssignmentsStore();
  const library = useLibraryStore();

  const [editingSection, setEditingSection] = useState<EditingSection>(null);
  const [editingPadId, setEditingPadId] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  useEffect(() => {
    audioEngine.bindGlobalUnlock();
    void useAssignmentsStore.getState().load();
    void useLibraryStore.getState().load();
    navigator.storage?.persist?.().catch(() => {});
  }, []);

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

  const closePadEdit = () => setEditingPadId(null);

  const handleStopAll = () => void audioEngine.stopAll();
  const handleFadeAll = () => void audioEngine.fadeAll();

  return (
    <Stage>
      <AudioNotices />
      <TopBar
        setName="Sunday Service · Oct 20"
        autoDuck={autoDuck}
        locked={locked}
        pulseAnimation={pulseAnimation}
        masterValue={levels.master}
        onToggleAutoDuck={toggleAutoDuck}
        onToggleLocked={toggleLocked}
        onTogglePulse={togglePulseAnimation}
        onFadeAll={handleFadeAll}
        onStopAll={handleStopAll}
        onMasterChange={(v) => setLevel('master', v)}
        onOpenSets={() => {}}
        onOpenLibrary={() => setLibraryOpen(true)}
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
          width={280}
          faderValue={levels.clips}
          faderDefault={DEFAULTS.clips}
          faderMuted={muted.clips}
          editMode={editingSection === 'clips'}
          onToggleEdit={() => setEditingSection(editingSection === 'clips' ? null : 'clips')}
          onPadEdit={(id) => setEditingPadId(id)}
          formatDuration={formatDuration}
          onPadPointerDown={(id) => {
            const pad = clipsPads.find((p) => p.id === id);
            if (pad?.libraryId) void audioEngine.triggerClipDown(pad);
          }}
          onFaderChange={(v) => setLevel('clips', v)}
          onFaderMuteToggle={() => toggleMute('clips')}
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
                />
                <button
                  type="button"
                  className={`clips-exclusive-toggle ${exclusiveClips ? 'clips-exclusive-toggle--on' : ''}`}
                  onClick={toggleExclusiveClips}
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
          width={280}
          faderValue={levels.sfx}
          faderDefault={DEFAULTS.sfx}
          faderMuted={muted.sfx}
          editMode={editingSection === 'sfx'}
          onToggleEdit={() => setEditingSection(editingSection === 'sfx' ? null : 'sfx')}
          onPadEdit={(id) => setEditingPadId(id)}
          formatDuration={formatDuration}
          onPadPointerDown={(id) => {
            const pad = sfxPads.find((p) => p.id === id);
            if (pad) void audioEngine.triggerSfxDown(pad);
          }}
          onPadPointerUp={(id) => audioEngine.triggerSfxUp(id)}
          onFaderChange={(v) => setLevel('sfx', v)}
          onFaderMuteToggle={() => toggleMute('sfx')}
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
          width={280}
          faderValue={levels.bg}
          faderDefault={DEFAULTS.bg}
          faderMuted={muted.bg}
          editMode={editingSection === 'bg'}
          onToggleEdit={() => setEditingSection(editingSection === 'bg' ? null : 'bg')}
          onPadEdit={(id) => setEditingPadId(id)}
          formatDuration={formatDuration}
          onPadPointerDown={(id) => {
            const pad = bgPads.find((p) => p.id === id);
            if (pad?.libraryId) void audioEngine.triggerBackgroundPad(pad);
          }}
          onFaderChange={(v) => setLevel('bg', v)}
          onFaderMuteToggle={() => toggleMute('bg')}
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
          onKeyPointerDown={(key) => void audioEngine.playAmbientKey(key)}
          onQualityChange={setAmbientQuality}
          onPackToggle={() => {
            const next = ambientPack === 'warm' ? 'airy' : 'warm';
            setAmbientPack(next);
            audioEngine.setAmbientPack(next);
          }}
          onFaderChange={(v) => setLevel('ambient', v)}
          onFaderMuteToggle={() => toggleMute('ambient')}
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
          onImportNew={(file) => useLibraryStore.getState().importFiles([file]).then((r) => r[0] ?? null)}
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
              const [item] = await useLibraryStore.getState().importFiles([file]);
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
    </Stage>
  );
}

export default App;
