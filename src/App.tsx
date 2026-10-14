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
import { useUIStore } from './store/useUIStore';
import { usePlaybackStore } from './store/usePlaybackStore';
import { useAssignmentsStore } from './store/useAssignmentsStore';
import { useLibraryStore } from './store/useLibraryStore';
import { audioEngine } from './audio/AudioEngine';
import { formatDuration } from './utils/formatDuration';
import { clipsBankA, clipsBankB, ambientKeys } from './data/placeholderData';
import './App.css';

const DEFAULTS = { clips: 0.8, sfx: 1, bg: 0.25, ambient: 0.4 };
const EMPTY_SET: Set<string> = new Set();

type EditingSection = 'sfx' | 'bg' | null;

const MODE_TAG: Record<string, string> = {
  oneshot: 'ONE-SHOT',
  hold: 'HOLD',
  loop: 'LOOP',
  toggle: 'TOGGLE',
};

function App() {
  const {
    levels,
    muted,
    banks,
    ambientQuality,
    ambientPack,
    autoDuck,
    locked,
    demoActivePad,
    setLevel,
    toggleMute,
    setBank,
    setAmbientQuality,
    setAmbientPack,
    toggleAutoDuck,
    toggleLocked,
    setDemoActivePad,
  } = useUIStore();

  const activeSfxPadIds = usePlaybackStore((s) => s.activeSfxPadIds);
  const activeAmbientKey = usePlaybackStore((s) => s.activeAmbientKey);
  const bgPadId = usePlaybackStore((s) => s.bgPadId);
  const bgPlaying = usePlaybackStore((s) => s.bgPlaying);
  const bgLooping = usePlaybackStore((s) => s.bgLooping);

  const { sfxBankA, sfxBankB, bgPads, updatePad, clearPad } = useAssignmentsStore();
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

  const editingPad = editingPadId
    ? [...sfxBankA, ...sfxBankB, ...bgPads].find((p) => p.id === editingPadId)
    : null;
  const editingIsBackground = editingPadId?.startsWith('bg-') ?? false;

  // Song Clips has no real audio yet (Phase 4: clip editor), so tapping a
  // pad there just toggles a fake "sounding" visual state.
  const demoTogglePad = (padId: string) => {
    setDemoActivePad('clips', demoActivePad.clips === padId ? null : padId);
  };

  const handleStopAll = () => {
    setDemoActivePad('clips', null);
    void audioEngine.stopAll();
  };

  const handleFadeAll = () => {
    setDemoActivePad('clips', null);
    void audioEngine.fadeAll();
  };

  const closePadEdit = () => {
    setEditingPadId(null);
  };

  return (
    <Stage>
      <AudioNotices />
      <TopBar
        setName="Sunday Service · Oct 20"
        autoDuck={autoDuck}
        locked={locked}
        masterValue={levels.master}
        onToggleAutoDuck={toggleAutoDuck}
        onToggleLocked={toggleLocked}
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
          pads={clipsPads}
          activePadIds={demoActivePad.clips ? new Set([demoActivePad.clips]) : EMPTY_SET}
          showProgress
          width={280}
          faderValue={levels.clips}
          faderDefault={DEFAULTS.clips}
          faderMuted={muted.clips}
          onPadPointerDown={demoTogglePad}
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
              <Chip label="FADE OUT" value="3 sec" />
            </>
          }
        />

        <Section
          number={2}
          title="Sound Effects"
          subtitle="Claps, shouts, stings"
          accent="coral"
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
          activeKey={activeAmbientKey}
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

      {editingPad && (
        <PadEditSheet
          pad={editingPad}
          sectionLabel={editingIsBackground ? 'Background' : 'Sound Effects'}
          showModeSelector={!editingIsBackground}
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
