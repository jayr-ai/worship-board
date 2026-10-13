import { useState } from 'react';
import { Stage } from './components/Stage';
import { TopBar } from './components/TopBar';
import { Section } from './components/Section';
import { AmbientSection } from './components/AmbientSection';
import { SegmentedControl } from './components/SegmentedControl';
import { Chip } from './components/Chip';
import { TransportRow } from './components/TransportRow';
import { useUIStore } from './store/useUIStore';
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

function App() {
  const {
    levels,
    muted,
    banks,
    ambientQuality,
    autoDuck,
    locked,
    demoActivePad,
    setLevel,
    toggleMute,
    setBank,
    setAmbientQuality,
    toggleAutoDuck,
    toggleLocked,
    setDemoActivePad,
  } = useUIStore();

  const [bgPlaying, setBgPlaying] = useState(false);
  const [bgLooping, setBgLooping] = useState(false);

  const clipsPads = banks.clips === 'bankA' ? clipsBankA : clipsBankB;
  const sfxPads = banks.sfx === 'bankA' ? sfxBankA : sfxBankB;

  // Phase 1 demo-only: tapping a pad toggles a fake "sounding" visual state.
  // Real triggering (envelopes, polyphony, exclusivity) arrives in Phase 2.
  const demoTogglePad = (section: 'clips' | 'sfx' | 'bg', padId: string) => {
    setDemoActivePad(section, demoActivePad[section] === padId ? null : padId);
  };

  const handleStopAll = () => {
    setDemoActivePad('clips', null);
    setDemoActivePad('sfx', null);
    setDemoActivePad('bg', null);
    setDemoActivePad('ambient', null);
    setBgPlaying(false);
  };

  return (
    <Stage>
      <TopBar
        setName="Sunday Service · Oct 20"
        autoDuck={autoDuck}
        locked={locked}
        masterValue={levels.master}
        onToggleAutoDuck={toggleAutoDuck}
        onToggleLocked={toggleLocked}
        onFadeAll={handleStopAll}
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
          activePadId={demoActivePad.clips}
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
          activePadId={demoActivePad.sfx}
          width={280}
          faderValue={levels.sfx}
          faderDefault={DEFAULTS.sfx}
          faderMuted={muted.sfx}
          onPadPointerDown={(id) => demoTogglePad('sfx', id)}
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
          activePadId={demoActivePad.bg}
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
          activeKey={demoActivePad.ambient ?? null}
          quality={ambientQuality}
          faderValue={levels.ambient}
          faderDefault={DEFAULTS.ambient}
          faderMuted={muted.ambient}
          onKeyPointerDown={(key) =>
            setDemoActivePad('ambient', demoActivePad.ambient === key ? null : key)
          }
          onQualityChange={setAmbientQuality}
          onFaderChange={(v) => setLevel('ambient', v)}
          onFaderMuteToggle={() => toggleMute('ambient')}
          onFadeOut={() => setDemoActivePad('ambient', null)}
        />
      </div>
    </Stage>
  );
}

export default App;
