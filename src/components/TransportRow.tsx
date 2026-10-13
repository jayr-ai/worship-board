import './TransportRow.css';

interface TransportRowProps {
  playing: boolean;
  looping: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onToggleLoop: () => void;
}

export function TransportRow({
  playing,
  looping,
  onPlayPause,
  onNext,
  onToggleLoop,
}: TransportRowProps) {
  return (
    <div className="transport">
      <button type="button" className="transport__play" onClick={onPlayPause}>
        {playing ? 'PAUSE' : 'PLAY'}
      </button>
      <button type="button" className="transport__btn" onClick={onNext} aria-label="Next">
        ⏭
      </button>
      <button
        type="button"
        className={`transport__btn ${looping ? 'transport__btn--active' : ''}`}
        onClick={onToggleLoop}
        aria-label="Loop"
      >
        🔁
      </button>
    </div>
  );
}
