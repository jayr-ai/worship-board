import type { LibraryFolder, LibraryItem } from '../storage/db';
import { Fader } from './Fader';
import { FolderChips } from './FolderChips';
import './AmbientPlayer.css';

interface AmbientPlayerProps {
  songs: LibraryItem[];
  folders: LibraryFolder[];
  selectedFolderId: string | null;
  activeSongId: string | null;
  playing: boolean;
  looping: boolean;
  shuffle: boolean;
  faderValue: number;
  faderDefault: number;
  faderMuted: boolean;
  faderDisabled?: boolean;
  locked?: boolean;
  formatDuration: (durationSec: number) => string;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (folderId: string) => void;
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

export function AmbientPlayer({
  songs,
  folders,
  selectedFolderId,
  activeSongId,
  playing,
  looping,
  shuffle,
  faderValue,
  faderDefault,
  faderMuted,
  faderDisabled = false,
  locked = false,
  formatDuration,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
  onSelectSong,
  onPlayPause,
  onNext,
  onPrevious,
  onToggleLoop,
  onToggleShuffle,
  onFaderChange,
  onFaderMuteToggle,
  onOpenLibrary,
}: AmbientPlayerProps) {
  const selectedFolder = folders.find((f) => f.id === selectedFolderId) ?? null;

  return (
    <section className={`ambientplayer ${faderMuted ? 'ambientplayer--muted' : ''}`}>
      <header className="ambientplayer__header">
        <span className="ambientplayer__badge">4</span>
        <div className="ambientplayer__heading">
          <h2 className="ambientplayer__title">Ambient Pads</h2>
          <p className="ambientplayer__subtitle">Sustained background audio</p>
        </div>
      </header>

      <div className="ambientplayer__body">
        <div className="ambientplayer__left">
          <FolderChips
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelect={onSelectFolder}
            onCreateFolder={onCreateFolder}
            onDeleteFolder={onDeleteFolder}
            showAll={false}
          />

          <div className="ambientplayer__list">
            {!selectedFolder && (
              <div className="ambientplayer__empty">
                <p>Choose or create a folder above to populate this player.</p>
                <p className="ambientplayer__empty-hint">
                  Only songs filed in that folder show up here — Song Clips and Sound Effects stay out.
                </p>
              </div>
            )}

            {selectedFolder && songs.length === 0 && (
              <div className="ambientplayer__empty">
                <p>No songs in "{selectedFolder.name}" yet.</p>
                <button type="button" className="ambientplayer__empty-btn" onClick={onOpenLibrary}>
                  Open Library
                </button>
              </div>
            )}

            {selectedFolder &&
              songs.map((song) => (
                <button
                  key={song.id}
                  type="button"
                  className={`ambientplayer__row ${song.id === activeSongId ? 'ambientplayer__row--active' : ''}`}
                  onClick={() => onSelectSong(song.id)}
                >
                  {song.id === activeSongId && (
                    <svg className="ambientplayer__row-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                      {playing ? (
                        <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                      ) : (
                        <path d="M8 5v14l11-7z" />
                      )}
                    </svg>
                  )}
                  <span className="ambientplayer__row-label">{song.label}</span>
                  <span className="ambientplayer__row-duration">{formatDuration(song.durationSec)}</span>
                </button>
              ))}
          </div>

          <div className="ambientplayer__transport">
            <button
              type="button"
              className={`ambientplayer__icon-btn ${shuffle ? 'ambientplayer__icon-btn--active' : ''}`}
              onClick={onToggleShuffle}
              disabled={locked}
              aria-label="Shuffle"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 5h3.5c1.5 0 2.9.8 3.6 2.1L15 18.5c.7 1.3 2.1 2.1 3.6 2.1H22" />
                <path d="M18 2l4 3-4 3" />
                <path d="M2 19h3.5c1.5 0 2.9-.8 3.6-2.1l.9-1.6" />
                <path d="M18 22l4-3-4-3" />
              </svg>
            </button>
            <button type="button" className="ambientplayer__icon-btn" onClick={onPrevious} disabled={locked} aria-label="Previous">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M16 6h2v12h-2zM14.5 6L6 12l8.5 6z" />
              </svg>
            </button>
            <button
              type="button"
              className="ambientplayer__play"
              onClick={onPlayPause}
              disabled={locked}
              aria-label={playing ? 'Pause' : 'Play'}
            >
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                {playing ? (
                  <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                ) : (
                  <path d="M8 5v14l11-7z" />
                )}
              </svg>
            </button>
            <button type="button" className="ambientplayer__icon-btn" onClick={onNext} disabled={locked} aria-label="Next">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>
            <button
              type="button"
              className={`ambientplayer__icon-btn ${looping ? 'ambientplayer__icon-btn--active' : ''}`}
              onClick={onToggleLoop}
              disabled={locked}
              aria-label="Repeat"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
              </svg>
            </button>
          </div>
        </div>

        <Fader
          accent="mint"
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
