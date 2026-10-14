# Worship Board

A 4-in-1 worship audio pad app for iPad: Song Clips, Sound Effects, Background songs, and Ambient key pads, each on its own independent mixer bus. Installs as a full-screen PWA from Safari and runs fully offline.

Live: https://jayr-ai.github.io/worship-board/

## Status

**Phase 6 of 7: Auto-Duck, Lock, and Sets.** Named Sets (New/Duplicate/Rename/Delete/Switch) now hold everything about a service — pad assignments, levels, mutes, Ambient pack/quality, exclusive-clips and default fade-out — and autosave on every change. Export a set (or back up everything) as a .zip with its audio via the iPad share sheet; import dedupes by content hash and always lands as a new set. Auto-Duck is real: Sound Effects duck Background −6dB with proper attack/hold/release, optionally ducking Ambient too. LOCK now actually disables EDIT/Library/Sets/Settings while leaving pads and faders free to play, with an option to lock faders too.

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
