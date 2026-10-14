# Worship Board

A 4-in-1 worship audio pad app for iPad: Song Clips, Sound Effects, Background songs, and Ambient key pads, each on its own independent mixer bus. Installs as a full-screen PWA from Safari and runs fully offline.

Live: https://jayr-ai.github.io/worship-board/

## Status

**Phase 4 of 7: Song Clips.** The clip editor is live: waveform display, draggable trim handles, zoom, part markers (INTRO/VERSE/PRE-CHORUS/CHORUS/BRIDGE/TAG/OUTRO + custom) saved per song, audition, auto "Song | Section" labels, and sample-accurate fade-out on real playback. Exclusive mode (default on) crossfades between clips at 0.8s; tapping the same pad again fades it out over its own length. All four sections now play real audio and persist across restarts.

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
