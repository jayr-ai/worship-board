import type { LibraryItem } from '../storage/db';
import { Fader } from './Fader';
import './BackgroundPlayer.css';

interface BackgroundPlayerProps {
  songs: LibraryItem[];
  activeSongId: string | null;
  playing: boolean;
  looping: boolean;
  shuffle: boolean;
  faderValue: number;
  faderDefault: number;
  faderMuted: boolean;
  faderDisabled?: boolean;
  formatDuration: (durationSec: number) => string;
  onSelectSong: (id: string) => void;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleLoop: () => void;
  onToggleShuffle: () => void;
  onFaderChange: (value: number) => void;
  onFaderMuteToggle: () => void;
  onOpenLibrary: () => void;
}

export function BackgroundPlayer({
  songs,
  activeSongId,
  playing,
  looping,
  shuffle,
  faderValue,
  faderDefault,
  faderMuted,
  faderDisabled = false,
  formatDuration,
  onSelectSong,
  onPlayPause,
  onNext,
  onPrevious,
  onToggleLoop,
  onToggleShuffle,
  onFaderChange,
  onFaderMuteToggle,
  onOpenLibrary,
}: BackgroundPlayerProps) {
  return (
    <section className={`bgplayer ${faderMuted ? 'bgplayer--muted' : ''}`}>
      <header className="bgplayer__header">
        <span className="bgplayer__badge">3</span>
        <div className="bgplayer__heading">
          <h2 className="bgplayer__title">Background</h2>
          <p className="bgplayer__subtitle">Full songs</p>
        </div>
      </header>

      <div className="bgplayer__body">
        <div className="bgplayer__left">
          <div className="bgplayer__list">
            {songs.length === 0 && (
              <div className="bgplayer__empty">
                <p>No songs imported yet.</p>
                <button type="button" className="bgplayer__empty-btn" onClick={onOpenLibrary}>
                  Open Library
                </button>
              </div>
            )}
            {songs.map((song) => (
              <button
                key={song.id}
                type="button"
                className={`bgplayer__row ${song.id === activeSongId ? 'bgplayer__row--active' : ''}`}
                onClick={() => onSelectSong(song.id)}
              >
                {song.id === activeSongId && (
                  <svg className="bgplayer__row-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    {playing ? (
                      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                    ) : (
                      <path d="M8 5v14l11-7z" />
                    )}
                  </svg>
                )}
                <span className="bgplayer__row-label">{song.label}</span>
                <span className="bgplayer__row-duration">{formatDuration(song.durationSec)}</span>
              </button>
            ))}
          </div>

          <div className="bgplayer__transport">
            <button
              type="button"
              className={`bgplayer__icon-btn ${shuffle ? 'bgplayer__icon-btn--active' : ''}`}
              onClick={onToggleShuffle}
              aria-label="Shuffle"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 5h3.5c1.5 0 2.9.8 3.6 2.1L15 18.5c.7 1.3 2.1 2.1 3.6 2.1H22" />
                <path d="M18 2l4 3-4 3" />
                <path d="M2 19h3.5c1.5 0 2.9-.8 3.6-2.1l.9-1.6" />
                <path d="M18 22l4-3-4-3" />
              </svg>
            </button>
            <button type="button" className="bgplayer__icon-btn" onClick={onPrevious} aria-label="Previous">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M16 6h2v12h-2zM14.5 6L6 12l8.5 6z" />
              </svg>
            </button>
            <button type="button" className="bgplayer__play" onClick={onPlayPause} aria-label={playing ? 'Pause' : 'Play'}>
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                {playing ? (
                  <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                ) : (
                  <path d="M8 5v14l11-7z" />
                )}
              </svg>
            </button>
            <button type="button" className="bgplayer__icon-btn" onClick={onNext} aria-label="Next">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>
            <button
              type="button"
              className={`bgplayer__icon-btn ${looping ? 'bgplayer__icon-btn--active' : ''}`}
              onClick={onToggleLoop}
              aria-label="Repeat"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
              </svg>
            </button>
          </div>
        </div>

        <Fader
          accent="sky"
          value={faderValue}
          defaultValue={faderDefault}
          muted={faderMuted}
          disabled={faderDisabled}
          onChange={onFaderChange}
          onToggleMute={onFaderMuteToggle}
        />
      </div>
    </section>
  );
}
