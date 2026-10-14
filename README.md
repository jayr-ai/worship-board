# Worship Board

A 4-in-1 worship audio pad app for iPad: Song Clips, Sound Effects, Background songs, and Ambient key pads, each on its own independent mixer bus. Installs as a full-screen PWA from Safari and runs fully offline.

Live: https://jayr-ai.github.io/worship-board/

## Status

**Phase 2 of 7: Audio engine foundation.** Four independent mixer buses + master + limiter, working faders/mute, the built-in synth Ambient pad (Major/Minor, key crossfade, Warm/Airy), synthesized demo Sound Effects, Stop All / Fade All, and iOS audio-session handling are all live. Song Clips and Background still have no real audio (import lands in Phase 3/4).

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
