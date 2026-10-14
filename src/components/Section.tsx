import type { ReactNode } from 'react';
import type { PadAccent } from './Pad';
import { GlowPad } from './GlowPad';
import { Fader, type FaderAccent } from './Fader';
import type { PadAssignment } from '../types';
import type { GlowSection } from '../audio/glowEngine';
import './Section.css';

interface SectionProps {
  number: number;
  title: string;
  subtitle: string;
  accent: FaderAccent;
  glowSection: GlowSection;
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
  editMode?: boolean;
  onToggleEdit?: () => void;
  onPadEdit?: (padId: string) => void;
  formatDuration?: (durationSec: number) => string;
}

export function Section({
  number,
  title,
  subtitle,
  accent,
  glowSection,
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
  editMode = false,
  onToggleEdit,
  onPadEdit,
  formatDuration,
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
        <button
          type="button"
          className={`section__edit ${editMode ? 'section__edit--active' : ''}`}
          onClick={onToggleEdit}
        >
          EDIT
        </button>
      </header>

      <div className="section__body">
        <div className="section__left">
          <div className="section__grid">
            {pads.map((pad) => (
              <GlowPad
                key={pad.id}
                glowId={pad.id}
                glowSection={glowSection}
                glowMode={pad.mode}
                size={98}
                accent={(pad.gradient as PadAccent) || accent}
                label={pad.label}
                tag={pad.tag}
                duration={
                  pad.durationSec
                    ? formatDuration
                      ? formatDuration(pad.durationSec)
                      : `${pad.durationSec.toFixed(1)}s`
                    : undefined
                }
                active={activePadIds.has(pad.id)}
                showProgress={showProgress}
                editing={editMode}
                onPointerDown={() =>
                  editMode ? onPadEdit?.(pad.id) : onPadPointerDown(pad.id)
                }
                onPointerUp={
                  !editMode && onPadPointerUp ? () => onPadPointerUp(pad.id) : undefined
                }
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
