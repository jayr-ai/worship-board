# Worship Board — iPad Test Checklist

Run through this on the actual iPad, in Safari, with the app added to the
Home Screen (Share → Add to Home Screen). A few checks explicitly need the
installed app, not the Safari tab — those are marked **[installed]**.

Keep the iPad's physical volume at a fixed, moderate level for the whole
pass — the point of the four independent buses is that *you* control
balance with the faders, not the hardware volume rocker.

## 1. Install and shell

- [ ] Opening the live URL in Safari shows the board, landscape, no scrolling.
- [ ] Add to Home Screen creates an icon; tapping it **[installed]** opens
      full-screen with no Safari address bar or tab strip.
- [ ] Holding the iPad in portrait shows "Rotate your iPad" instead of a
      squashed layout.
- [ ] Turn on **Airplane Mode**, force-quit, relaunch from the Home Screen
      icon **[installed]** — the app still loads and plays audio with zero
      network.

## 2. Mixing basics

- [ ] Each section's fader moves smoothly under a finger; the double-tap
      resets it to that section's default (Clips 80%, SFX 100%, BG 25%,
      Ambient 40%).
- [ ] With the iPad's hardware volume fixed, pulling a Sound Effect while
      Background is low (25%) still sounds clearly audible over it — this is
      the whole point of independent buses, so it should be obvious.
- [ ] Tapping a section's **M** mutes only that bus (panel dims to ~55%);
      sound already playing on another bus is unaffected.
- [ ] **FADE ALL** takes about 3s to go silent; **STOP ALL** is near-instant
      and works even mid-crossfade (try it while two Background songs are
      crossfading).
- [ ] No clicks or pops on any fader move, mute toggle, or trigger.

## 3. Song Clips

- [ ] EDIT → tap an empty pad → choose or import a song → clip editor opens
      with a waveform.
- [ ] Drag the trim handles; the "X.Xs selected" readout updates live.
- [ ] Tap a part name (CHORUS, VERSE, …) to save the current trim as that
      marker; tapping it again later recalls that same region.
- [ ] Audition plays the exact trimmed region and fades out at the end.
- [ ] Assign to Pad — label auto-fills "Song | Section" and is editable.
- [ ] Tapping the assigned pad plays it and fades out exactly at its end,
      every time, not just the first time.
- [ ] With EXCLUSIVE ON (default), starting a second clip fades the first
      out quickly (~0.8s) instead of layering.
- [ ] Toggle EXCLUSIVE OFF — two clips now play on top of each other.
- [ ] Tapping an already-playing clip pad again fades *that* pad out over
      its own fade-out length, not instantly.

## 4. Sound Effects

- [ ] Demo sounds (Clap, Air Horn, Drum Roll, Whoosh, Kick, Snare) play
      immediately on tap with no noticeable delay.
- [ ] Tap several pads in quick succession with two fingers at once — all
      sound, no dropped triggers (polyphony).
- [ ] EDIT → assign your own recording → One-shot, Hold, Loop, and Toggle
      modes all behave as expected (Hold plays only while held; Loop/Toggle
      start on tap and stop on a second tap).
- [ ] Re-tapping a one-shot mid-playback restarts it from the top.
- [ ] Volume trim in the pad edit sheet is audible.

## 5. Background

- [ ] Tap a song — plays; tap a second — crossfades over ~4s, not an abrupt
      cut.
- [ ] Tap the currently-playing pad again — fades out and stops.
- [ ] Play/Pause, Next, and Loop in the transport row all work on the
      actual audio, not just the UI state.
- [ ] A non-looping song that reaches its natural end stops on its own —
      no auto-advance to the next pad.
- [ ] Assigning a full multi-minute song doesn't noticeably stall the UI on
      import or first playback (streamed, not fully decoded up front).

## 6. Ambient Pads

- [ ] Tapping a key fades the built-in pad in over ~2.5s (not an abrupt
      start).
- [ ] Only one key sounds at a time; switching keys crossfades over ~2s.
- [ ] Tapping the sounding key again, or FADE OUT, fades it out smoothly
      (~3s / ~4s respectively).
- [ ] Major ↔ Minor changes the chord quality on the *next* key you press.
- [ ] PAD SOUND toggles Warm ↔ Airy with an audibly different timbre.

## 7. Glow

- [ ] Clips/Background/Ambient pads visibly pulse while sounding, Sound
      Effects flash briefly on each one-shot trigger.
- [ ] A pad's glow visibly fades out together with its sound, not before
      or after.
- [ ] Crossfading Ambient keys or Background songs shows the outgoing pad
      dim while the incoming one brightens, overlapping.
- [ ] Toggling PULSE off gives a steady glow instead of breathing.
- [ ] Light up 5-6 pads across every section at once — no stutter or lag
      elsewhere in the UI while they're all glowing/pulsing.

## 8. Auto-Duck

- [ ] With AUTO-DUCK on and a Background song playing, tapping a Sound
      Effect audibly ducks the music and it recovers after the sound ends.
- [ ] Tapping several Sound Effects back-to-back keeps the music ducked
      the whole time rather than bouncing up and down between them.
- [ ] In Settings, turning on "Auto-Duck Ambient Too" makes Sound Effects
      also duck a sounding Ambient pad.
- [ ] Turning AUTO-DUCK off in the top bar stops the ducking entirely.

## 9. Lock

- [ ] LOCK disables every EDIT button, Library, the set selector, and ⚙
      Settings — but pads still trigger and faders still move.
- [ ] In Settings, "Lock Also Locks Faders" on, then LOCK — now the
      faders (including Master) are frozen too.
- [ ] Unlocking restores every control immediately.

## 10. Sets and backup

- [ ] Sets sheet → **+ New Set** starts a clean board (demo Sound Effects
      only); switching back to your original set restores it exactly.
- [ ] Rename and Duplicate both work and show up in the list immediately.
- [ ] Export a set — the iPad share sheet appears (or a download, if share
      isn't available) with a `.zip`.
- [ ] Delete the app and reinstall, or just clear Safari site data for the
      URL, then **Import Set…** that `.zip` — your pads, labels, colors,
      and audio all come back.
- [ ] "Backup Everything" bundles every set you have, not just the current
      one.
- [ ] The backup reminder banner in the Sets sheet disappears right after
      you export.

## 11. Interruptions

- [ ] Receive a phone call (or simulate with Control Center) while a
      Background song is playing — audio pauses, and resumes or shows "Tap
      to resume audio" afterward rather than staying silently broken.
- [ ] Switch to another app and back — audio state recovers the same way.
- [ ] Lock the iPad's screen with audio playing, then unlock — same.
- [ ] Leave the app idle on screen for several minutes — the screen does
      not auto-sleep (Wake Lock). If your iOS/browser doesn't support Wake
      Lock, a small notice should say so instead of silently failing.

## 12. Error handling

- [ ] Try importing an unsupported or corrupted file — you get a clear
      message (not a silent failure or a frozen sheet).
- [ ] If a pad's assigned audio ever goes missing (e.g. an edge case during
      testing), tapping it shows a toast instead of doing nothing.

## Known limits (see README for more)

- No streaming from YouTube or any online service — all audio is files you
  import.
- Zoom in the clip editor is +/- buttons, not a two-finger pinch gesture.
- Auto-Duck's amount/attack/release use the spec's fixed defaults; they
  aren't user-tunable yet.
