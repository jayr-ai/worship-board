import './TopBar.css';

interface TopBarProps {
  setName: string;
  autoDuck: boolean;
  locked: boolean;
  pulseAnimation: boolean;
  masterValue: number;
  onToggleAutoDuck: () => void;
  onToggleLocked: () => void;
  onTogglePulse: () => void;
  onFadeAll: () => void;
  onStopAll: () => void;
  onMasterChange: (value: number) => void;
  onOpenSets: () => void;
  onOpenLibrary: () => void;
}

export function TopBar({
  setName,
  autoDuck,
  locked,
  pulseAnimation,
  masterValue,
  onToggleAutoDuck,
  onToggleLocked,
  onTogglePulse,
  onFadeAll,
  onStopAll,
  onMasterChange,
  onOpenSets,
  onOpenLibrary,
}: TopBarProps) {
  return (
    <div className={`topbar ${locked ? 'topbar--locked' : ''}`}>
      <div className="topbar__left">
        <h1 className="topbar__title">WORSHIP BOARD</h1>
        <button type="button" className="topbar__set" onClick={onOpenSets}>
          {setName} ▾
        </button>
        <button type="button" className="topbar__set" onClick={onOpenLibrary}>
          Library
        </button>
      </div>

      <div className="topbar__right">
        <button
          type="button"
          className={`topbar__toggle ${autoDuck ? 'topbar__toggle--active' : ''}`}
          onClick={onToggleAutoDuck}
        >
          AUTO-DUCK
        </button>
        <button
          type="button"
          className={`topbar__toggle ${locked ? 'topbar__toggle--active' : ''}`}
          onClick={onToggleLocked}
        >
          {locked ? '🔒 LOCK' : 'LOCK'}
        </button>
        <button
          type="button"
          className={`topbar__toggle ${pulseAnimation ? 'topbar__toggle--active' : ''}`}
          onClick={onTogglePulse}
        >
          PULSE
        </button>
        <button type="button" className="topbar__btn" onClick={onFadeAll}>
          FADE ALL
        </button>
        <button type="button" className="topbar__btn topbar__btn--stop" onClick={onStopAll}>
          STOP ALL
        </button>

        <div className="topbar__master">
          <span className="topbar__master-label">MASTER</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(masterValue * 100)}
            onChange={(e) => onMasterChange(Number(e.target.value) / 100)}
            className="topbar__master-slider"
          />
          <span className="topbar__master-value">{Math.round(masterValue * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
