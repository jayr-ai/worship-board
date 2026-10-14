# Worship Board

A 4-in-1 worship audio pad app for iPad: Song Clips, Sound Effects, Background songs, and Ambient key pads, each on its own independent mixer bus. Installs as a full-screen PWA from Safari and runs fully offline.

Live: https://jayr-ai.github.io/worship-board/

## Status

**Phase 5 of 7: Glow system.** Every pad now pulses while sounding (Clips/Background/Ambient breathe at 1.6s, sustained Sound Effects modes too), flashes on trigger (one-shot Sound Effects), and fades its glow in real time together with the actual sound — including during an Ambient key or Background crossfade, where the outgoing pad visibly dims as the incoming one brightens. A PULSE toggle in the top bar swaps pulsing for a steady glow. All of it runs off a single rAF loop writing a CSS custom property directly to the DOM, so it never triggers a React re-render.

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
