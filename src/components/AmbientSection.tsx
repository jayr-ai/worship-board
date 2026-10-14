import { Fader } from './Fader';
import { SegmentedControl } from './SegmentedControl';
import { Chip } from './Chip';
import { AmbientKey } from './AmbientKey';
import './AmbientSection.css';

interface AmbientSectionProps {
  keys: string[];
  quality: 'major' | 'minor';
  pack: 'warm' | 'airy';
  faderValue: number;
  faderDefault: number;
  faderMuted: boolean;
  onKeyPointerDown: (key: string) => void;
  onQualityChange: (quality: 'major' | 'minor') => void;
  onPackToggle: () => void;
  onFaderChange: (value: number) => void;
  onFaderMuteToggle: () => void;
  onFadeOut: () => void;
}

export function AmbientSection({
  keys,
  quality,
  pack,
  faderValue,
  faderDefault,
  faderMuted,
  onKeyPointerDown,
  onQualityChange,
  onPackToggle,
  onFaderChange,
  onFaderMuteToggle,
  onFadeOut,
}: AmbientSectionProps) {
  return (
    <section className={`ambient ${faderMuted ? 'ambient--muted' : ''}`}>
      <header className="ambient__header">
        <span className="ambient__badge">4</span>
        <div className="ambient__heading">
          <h2 className="ambient__title">Ambient Pads</h2>
          <p className="ambient__subtitle">Sustained key drone</p>
        </div>
      </header>

      <div className="ambient__body">
        <div className="ambient__left">
          <SegmentedControl
            options={[
              { value: 'major', label: 'Major' },
              { value: 'minor', label: 'Minor' },
            ]}
            value={quality}
            onChange={onQualityChange}
          />

          <div className="ambient__grid">
            {keys.map((key) => (
              <AmbientKey key={key} note={key} onPointerDown={() => onKeyPointerDown(key)} />
            ))}
          </div>

          <div className="ambient__footer">
            <Chip
              label="PAD SOUND"
              value={pack === 'warm' ? 'Warm Pad' : 'Airy Pad'}
              onClick={onPackToggle}
            />
            <Chip label="CROSSFADE KEYS" value="2 sec" />
            <button type="button" className="ambient__fadeout" onClick={onFadeOut}>
              FADE OUT
            </button>
          </div>
        </div>

        <Fader
          accent="mint"
          value={faderValue}
          defaultValue={faderDefault}
          muted={faderMuted}
          onChange={onFaderChange}
          onToggleMute={onFaderMuteToggle}
        />
      </div>
    </section>
  );
}
