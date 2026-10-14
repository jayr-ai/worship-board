import { usePlaybackStore } from '../store/usePlaybackStore';
import { audioEngine } from '../audio/AudioEngine';
import './AudioNotices.css';

export function AudioNotices() {
  const needsTapToResume = usePlaybackStore((s) => s.needsTapToResume);
  const wakeLockUnsupported = usePlaybackStore((s) => s.wakeLockUnsupported);

  return (
    <>
      {needsTapToResume && (
        <button
          type="button"
          className="resume-overlay"
          onPointerDown={() => void audioEngine.ensureStarted()}
        >
          Tap to resume audio
        </button>
      )}
      {wakeLockUnsupported && (
        <div className="wakelock-notice">
          Screen may sleep during long pauses — this browser doesn't support staying awake.
        </div>
      )}
    </>
  );
}
