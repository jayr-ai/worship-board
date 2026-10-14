import { useEffect, useState } from 'react';
import './Sheet.css';
import './SettingsSheet.css';

interface SettingsSheetProps {
  duckAmbientToo: boolean;
  lockFadersToo: boolean;
  onClose: () => void;
  onToggleDuckAmbientToo: () => void;
  onToggleLockFadersToo: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

export function SettingsSheet({
  duckAmbientToo,
  lockFadersToo,
  onClose,
  onToggleDuckAmbientToo,
  onToggleLockFadersToo,
}: SettingsSheetProps) {
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [usage, setUsage] = useState<{ used: number; quota: number } | null>(null);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
    navigator.storage?.estimate?.().then((estimate) => {
      if (estimate.usage != null && estimate.quota != null) {
        setUsage({ used: estimate.usage, quota: estimate.quota });
      }
    }).catch(() => {});
  }, []);

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

          <div className="settings__storage">
            <div className="settings__row-title">Storage</div>
            <div className="settings__row-sub">
              {persisted === true && 'Persistent storage granted — iOS is far less likely to evict your library under storage pressure.'}
              {persisted === false && "Persistent storage wasn't granted yet. It's requested automatically; back up regularly just in case."}
              {persisted === null && "This browser doesn't report persistent storage status."}
            </div>
            {usage && (
              <div className="settings__row-sub">
                Using {formatBytes(usage.used)} of {formatBytes(usage.quota)} available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
