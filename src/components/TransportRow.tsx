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
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
        </svg>
      </button>
      <button
        type="button"
        className={`transport__btn ${looping ? 'transport__btn--active' : ''}`}
        onClick={onToggleLoop}
        aria-label="Loop"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
        </svg>
      </button>
    </div>
  );
}
