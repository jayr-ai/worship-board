import type { ReactNode } from 'react';
import { Pad, type PadAccent } from './Pad';
import { Fader } from './Fader';
import type { PadAssignment } from '../types';
import './Section.css';

interface SectionProps {
  number: number;
  title: string;
  subtitle: string;
  accent: PadAccent;
  pads: PadAssignment[];
  activePadIds: Set<string>;
  showProgress?: boolean;
  width: number;
  footer: ReactNode;
  faderValue: number;
  faderDefault: number;
  faderMuted: boolean;
  onPadPointerDown: (padId: string) => void;
  onPadPointerUp?: (padId: string) => void;
  onFaderChange: (value: number) => void;
  onFaderMuteToggle: () => void;
}

export function Section({
  number,
  title,
  subtitle,
  accent,
  pads,
  activePadIds,
  showProgress,
  width,
  footer,
  faderValue,
  faderDefault,
  faderMuted,
  onPadPointerDown,
  onPadPointerUp,
  onFaderChange,
  onFaderMuteToggle,
}: SectionProps) {
  return (
    <section
      className={`section ${faderMuted ? 'section--muted' : ''}`}
      style={{ width }}
    >
      <header className="section__header">
        <span className={`section__badge section__badge--${accent}`}>{number}</span>
        <div className="section__heading">
          <h2 className={`section__title section__title--${accent}`}>{title}</h2>
          <p className="section__subtitle">{subtitle}</p>
        </div>
        <button type="button" className="section__edit">
          EDIT
        </button>
      </header>

      <div className="section__body">
        <div className="section__left">
          <div className="section__grid">
            {pads.map((pad) => (
              <Pad
                key={pad.id}
                size={98}
                accent={accent}
                label={pad.label}
                tag={pad.tag}
                duration={pad.durationSec ? `${pad.durationSec.toFixed(1)}s` : undefined}
                active={activePadIds.has(pad.id)}
                showProgress={showProgress}
                onPointerDown={() => onPadPointerDown(pad.id)}
                onPointerUp={onPadPointerUp ? () => onPadPointerUp(pad.id) : undefined}
              />
            ))}
          </div>
          <div className="section__footer">{footer}</div>
        </div>

        <Fader
          accent={accent}
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
