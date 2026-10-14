# Worship Board

A 4-in-1 worship audio pad app for iPad: Song Clips, Sound Effects, Background songs, and Ambient key pads, each on its own independent mixer bus. Installs as a full-screen PWA from Safari and runs fully offline.

Live: https://jayr-ai.github.io/worship-board/

## Status

**Phase 3 of 7: Import, library and assignment.** File import (IndexedDB-backed library with dedup), pad edit sheets for Sound Effects and Background (audio picker, label, color, trigger mode, volume trim, Clear Pad), a Library sheet, and real Background streaming (two-deck crossfade, Play/Pause/Next/Loop) are all live and persist across restarts. Song Clips still has no real audio — its clip editor (waveform, markers, trim) is Phase 4.

See the build plan in the original spec for what's next.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Install on iPad

1. Open the live URL in Safari.
2. Tap Share → Add to Home Screen.
3. Launch from the home screen icon. It opens full-screen in landscape.
