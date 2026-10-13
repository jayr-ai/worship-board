import './Pad.css';

export type PadAccent = 'gold' | 'coral' | 'sky' | 'mint';

interface PadProps {
  size: number;
  accent: PadAccent;
  label?: string;
  tag?: string;
  duration?: string;
  active?: boolean;
  showProgress?: boolean;
  onPointerDown?: () => void;
}

export function Pad({
  size,
  accent,
  label,
  tag,
  duration,
  active = false,
  showProgress = false,
  onPointerDown,
}: PadProps) {
  const isEmpty = !label;

  return (
    <button
      type="button"
      className={`pad pad--${accent} ${isEmpty ? 'pad--empty' : 'pad--assigned'} ${
        active ? 'pad--active' : ''
      }`}
      style={{ width: size, height: size }}
      onPointerDown={onPointerDown}
    >
      {isEmpty ? (
        <span className="pad__empty-content">
          <span className="pad__plus">+</span>
          <span className="pad__assign-label">Assign</span>
        </span>
      ) : (
        <>
          <span className="pad__title">{label}</span>
          <span className="pad__footer">
            {tag && <span className="pad__chip">{tag}</span>}
            {duration && <span className="pad__duration">{duration}</span>}
          </span>
          {showProgress && active && <span className="pad__progress" />}
        </>
      )}
    </button>
  );
}
