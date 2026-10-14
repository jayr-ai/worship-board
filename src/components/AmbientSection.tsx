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
  locked?: boolean;
  faderDisabled?: boolean;
  editMode?: boolean;
  onToggleEdit?: () => void;
  onKeyEdit?: (key: string) => void;
  customKeyIds?: Set<string>;
  activeKey?: string | null;
  activeDetail?: string | null;
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
  locked = false,
  faderDisabled = false,
  editMode = false,
  onToggleEdit,
  onKeyEdit,
  customKeyIds,
  activeKey = null,
  activeDetail = null,
}: AmbientSectionProps) {
  return (
    <section className={`ambient ${faderMuted ? 'ambient--muted' : ''}`}>
      <header className="ambient__header">
        <span className="ambient__badge">4</span>
        <div className="ambient__heading">
          <h2 className="ambient__title">Ambient Pads</h2>
          <p className="ambient__subtitle">Sustained key drone</p>
        </div>
        <button
          type="button"
          className={`section__edit ${editMode ? 'section__edit--active' : ''}`}
          onClick={onToggleEdit}
          disabled={locked}
        >
          EDIT
        </button>
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
            disabled={locked}
          />

          <div className="ambient__now-playing">
            {activeKey ? (
              <>
                <span className="ambient__now-playing-key">{activeKey}</span>
                <span className="ambient__now-playing-detail">{activeDetail}</span>
              </>
            ) : (
              <span className="ambient__now-playing-idle">— tap a key —</span>
            )}
          </div>

          <div className="ambient__grid">
            {keys.map((key) => (
              <AmbientKey
                key={key}
                note={key}
                editing={editMode}
                hasCustomAudio={customKeyIds?.has(key) ?? false}
                onPointerDown={() => onKeyPointerDown(key)}
                onEdit={() => onKeyEdit?.(key)}
              />
            ))}
          </div>

          <div className="ambient__footer">
            <Chip
              label="PAD SOUND"
              value={pack === 'warm' ? 'Warm Pad' : 'Airy Pad'}
              onClick={onPackToggle}
              disabled={locked}
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
          disabled={faderDisabled}
          onChange={onFaderChange}
          onToggleMute={onFaderMuteToggle}
        />
      </div>
    </section>
  );
}
