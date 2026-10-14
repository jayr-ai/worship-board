import { useEffect, useState } from 'react';
import { Stage } from './components/Stage';
import { TopBar } from './components/TopBar';
import { Section } from './components/Section';
import { AmbientSection } from './components/AmbientSection';
import { SegmentedControl } from './components/SegmentedControl';
import { Chip } from './components/Chip';
import { TransportRow } from './components/TransportRow';
import { AudioNotices } from './components/AudioNotices';
import { useUIStore } from './store/useUIStore';
import { usePlaybackStore } from './store/usePlaybackStore';
import { audioEngine } from './audio/AudioEngine';
import {
  clipsBankA,
  clipsBankB,
  sfxBankA,
  sfxBankB,
  bgPads,
  ambientKeys,
} from './data/placeholderData';
import './App.css';

const DEFAULTS = { clips: 0.8, sfx: 1, bg: 0.25, ambient: 0.4 };
const EMPTY_SET: Set<string> = new Set();

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

  const [bgPlaying, setBgPlaying] = useState(false);
  const [bgLooping, setBgLooping] = useState(false);

  useEffect(() => {
    audioEngine.bindGlobalUnlock();
  }, []);

  const clipsPads = banks.clips === 'bankA' ? clipsBankA : clipsBankB;
  const sfxPads = banks.sfx === 'bankA' ? sfxBankA : sfxBankB;

  // Song Clips and Background have no real audio yet (Phase 3/4 import), so
  // tapping a pad there just toggles a fake "sounding" visual state.
  const demoTogglePad = (section: 'clips' | 'bg', padId: string) => {
    setDemoActivePad(section, demoActivePad[section] === padId ? null : padId);
  };

  const clearDemoAndTransport = () => {
    setDemoActivePad('clips', null);
    setDemoActivePad('bg', null);
    setBgPlaying(false);
  };

  const handleStopAll = () => {
    clearDemoAndTransport();
    void audioEngine.stopAll();
  };

  const handleFadeAll = () => {
    clearDemoAndTransport();
    void audioEngine.fadeAll();
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
          onPadPointerDown={(id) => demoTogglePad('clips', id)}
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
          pads={sfxPads}
          activePadIds={activeSfxPadIds}
          width={280}
          faderValue={levels.sfx}
          faderDefault={DEFAULTS.sfx}
          faderMuted={muted.sfx}
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
          pads={bgPads}
          activePadIds={demoActivePad.bg ? new Set([demoActivePad.bg]) : EMPTY_SET}
          showProgress
          width={280}
          faderValue={levels.bg}
          faderDefault={DEFAULTS.bg}
          faderMuted={muted.bg}
          onPadPointerDown={(id) => {
            demoTogglePad('bg', id);
            setBgPlaying(demoActivePad.bg !== id);
          }}
          onFaderChange={(v) => setLevel('bg', v)}
          onFaderMuteToggle={() => toggleMute('bg')}
          footer={
            <>
              <TransportRow
                playing={bgPlaying}
                looping={bgLooping}
                onPlayPause={() => setBgPlaying((p) => !p)}
                onNext={() => {}}
                onToggleLoop={() => setBgLooping((l) => !l)}
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
    </Stage>
  );
}

export default App;
