import './Sheet.css';
import './SettingsSheet.css';

interface SettingsSheetProps {
  duckAmbientToo: boolean;
  lockFadersToo: boolean;
  onClose: () => void;
  onToggleDuckAmbientToo: () => void;
  onToggleLockFadersToo: () => void;
}

export function SettingsSheet({
  duckAmbientToo,
  lockFadersToo,
  onClose,
  onToggleDuckAmbientToo,
  onToggleLockFadersToo,
}: SettingsSheetProps) {
  return (
    <div className="sheet-overlay" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet-panel">
        <div className="sheet-header">
          <h2 className="sheet-title">Settings</h2>
          <button type="button" className="sheet-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="sheet-body">
          <div className="settings__row">
            <div>
              <div className="settings__row-title">Auto-Duck Ambient Too</div>
              <div className="settings__row-sub">
                By default Auto-Duck only lowers Background. Also duck Ambient Pads.
              </div>
            </div>
            <button
              type="button"
              className={`settings__toggle ${duckAmbientToo ? 'settings__toggle--on' : ''}`}
              onClick={onToggleDuckAmbientToo}
            >
              {duckAmbientToo ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="settings__row">
            <div>
              <div className="settings__row-title">Lock Also Locks Faders</div>
              <div className="settings__row-sub">
                By default LOCK leaves faders free to move. Freeze them too.
              </div>
            </div>
            <button
              type="button"
              className={`settings__toggle ${lockFadersToo ? 'settings__toggle--on' : ''}`}
              onClick={onToggleLockFadersToo}
            >
              {lockFadersToo ? 'ON' : 'OFF'}
            </button>
          </div>

          <p className="settings__note">
            Auto-Duck amount (−6 dB), attack (40 ms) and release (700 ms) use the
            spec's defaults and aren't tunable yet.
          </p>
        </div>
      </div>
    </div>
  );
}
