# Worship Board

A 4-in-1 worship audio pad app for iPad: Song Clips, Sound Effects, Background songs, and Ambient key pads, each on its own independent mixer bus. Installs as a full-screen PWA from Safari and runs fully offline.

Live: https://jayr-ai.github.io/worship-board/

## Status

**Phase 7 of 7: Hardening — feature-complete.** All four sections play real audio with independent buses, a limiter, and an Auto-Duck that actually ducks. Song Clips has a full waveform/marker/trim editor. Every pad pulses, flashes, and fade-syncs its glow. Named Sets autosave and round-trip through export/import with their audio intact. LOCK disables configuration while leaving pads and faders live. See [TESTING.md](TESTING.md) for the full iPad checklist and "Known limits" below for what's deliberately out of scope.

## Install on iPad

1. Open the live URL above in Safari.
2. Tap the Share icon → **Add to Home Screen**.
3. Launch it from the Home Screen icon — it opens full-screen, landscape, no Safari chrome.
4. Turn on Airplane Mode and confirm it still works — everything after this point runs fully offline.

**If a new version doesn't show up** after I ship an update: the installed icon can hold onto a cached version for a bit. Delete the Home Screen icon and re-add it from Safari to force a clean pull of the latest build.

## Backup advice

Everything lives in the iPad's local storage (IndexedDB) — there is no server, no account, and no cloud sync. That's good for privacy and for working offline, but it means **the only copy of your work is on that one device** unless you export a backup.

- Open the **Sets** sheet (tap the set name in the top bar) before or after you build out a service.
- **Export** a single set, or **Backup Everything** to bundle every set you have, as one `.zip` — via the iPad share sheet (AirDrop it to yourself, save to Files, email it, whatever) or a direct download if sharing isn't available.
- **Import Set…** restores from that `.zip` — it dedupes audio by content hash and always lands as a new set, so importing a backup never silently overwrites what's currently on the device.
- The Sets sheet shows a reminder if you haven't backed up in the last 30 days (or ever).
- Back up **before** a big service, and again after you've made edits you'd hate to redo — reinstalling the app, clearing Safari site data, or a worst-case iOS storage eviction would otherwise take your library and sets with it.

## Known limits

These are deliberate scope decisions, not bugs:

- **No streaming.** YouTube, Spotify, or any online audio source is out of scope — every sound is a file you import from the Files app. This was explicit from the original spec.
- **Clip editor zoom** is +/- buttons, not a two-finger pinch gesture. Panning works natively via touch-drag/scroll on the waveform.
- **Auto-Duck's amount (−6dB), attack (40ms), and release (700ms)** use the spec's fixed defaults and aren't user-tunable yet, beyond on/off and whether Ambient also ducks.
- **No MIDI, recording, BPM sync, or per-pad effects (reverb/EQ)** — all explicitly out of scope per the original spec.
- **No user accounts or cross-device sync** — a Set lives on the device it was built on until you export/import it manually.
- iOS can evict web app storage under pressure, same as any Safari site data. Persistent storage is requested automatically and the app checks whether it was granted (Settings sheet), but regular backups are still the real safety net.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Tests

Unit tests cover the pure logic: fader/dB taper curves, the clip fade-out
envelope schedule, the glow pulse/flash math, and the v1→v2 Set schema
migration (run against a real IndexedDB via `fake-indexeddb`, not mocked).

```bash
npm run test        # run once
npm run test:watch  # watch mode
```

## Architecture (for picking this back up later)

- `src/audio/AudioEngine.ts` — the framework-free Web Audio engine (buses,
  limiter, Auto-Duck, per-section triggering). The UI never touches an audio
  node directly; it reads `usePlaybackStore` for "what's sounding" and calls
  engine methods to trigger things.
- `src/audio/glowEngine.ts` + `glowMath.ts` — the rAF loop that drives every
  pad's `--glow` CSS variable; the math is split out into `glowMath.ts` so
  it's unit-testable without the engine's side effects.
- `src/store/useSetStore.ts` — the current Set (pad assignments, levels,
  mutes, Ambient pack/quality) plus Sets CRUD and backup export/import.
  Autosaves to IndexedDB on every change.
- `src/store/useUIStore.ts` — global, not-per-set preferences (Lock,
  Auto-Duck config, Pulse animation) plus which bank is currently displayed.
- `src/storage/db.ts` — the IndexedDB schema (`library`, `sets`,
  `appSettings`) and the v1→v2 migration that folds pre-Sets data into a
  named set on upgrade.
- `src/storage/backup.ts` — the `.zip` export/import format (fflate).
