import { useRef } from 'react';
import './Fader.css';

export type FaderAccent = 'gold' | 'coral' | 'sky' | 'mint';

interface FaderProps {
  accent: FaderAccent;
  value: number; // 0..1
  defaultValue: number; // 0..1, used on double-tap reset
  muted: boolean;
  onChange: (value: number) => void;
  onToggleMute: () => void;
}

export function Fader({
  accent,
  value,
  defaultValue,
  muted,
  onChange,
  onToggleMute,
}: FaderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const valueFromPointer = (clientY: number) => {
    const track = trackRef.current;
    if (!track) return value;
    const rect = track.getBoundingClientRect();
    const fraction = 1 - (clientY - rect.top) / rect.height;
    return Math.min(1, Math.max(0, fraction));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onChange(valueFromPointer(e.clientY));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0) return;
    onChange(valueFromPointer(e.clientY));
  };

  const handleDoubleClick = () => onChange(defaultValue);

  const percent = Math.round(value * 100);

  return (
    <div className={`fader fader--${accent}`}>
      <div className="fader__readout">{percent}%</div>
      <div
        ref={trackRef}
        className="fader__track"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onDoubleClick={handleDoubleClick}
      >
        <div className="fader__fill" style={{ height: `${percent}%` }} />
        <div className="fader__thumb" style={{ bottom: `calc(${percent}% - 13px)` }} />
      </div>
      <div className="fader__label">VOL</div>
      <button
        type="button"
        className={`fader__mute ${muted ? 'fader__mute--active' : ''}`}
        onClick={onToggleMute}
        aria-label="Mute"
      >
        M
      </button>
    </div>
  );
}
